import type { Prisma, PrismaClient } from "@prisma/client";

import type { ProductListQuery } from "../schemas/product.schemas.js";

const catalogRecordSelect = {
  id: true,
  name: true,
  slug: true
} satisfies Prisma.BrandSelect;

const productSummarySelect = {
  id: true,
  title: true,
  price: true,
  imageUrl: true,
  color: true,
  brand: {
    select: catalogRecordSelect
  },
  category: {
    select: catalogRecordSelect
  },
  sourcePlatform: {
    select: catalogRecordSelect
  }
} satisfies Prisma.ProductSelect;

const productDetailSelect = {
  ...productSummarySelect,
  productUrl: true,
  description: true,
  availableColors: true,
  tags: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.ProductSelect;

export type ProductSummaryRecord = Prisma.ProductGetPayload<{
  select: typeof productSummarySelect;
}>;

export type ProductDetailRecord = Prisma.ProductGetPayload<{
  select: typeof productDetailSelect;
}>;

export type ProductFilterCatalogRecord = {
  id: string;
  name: string;
  slug: string;
};

export type ProductFilterOptionsRecord = {
  brands: ProductFilterCatalogRecord[];
  categories: ProductFilterCatalogRecord[];
  sourcePlatforms: ProductFilterCatalogRecord[];
  colors: string[];
  minPrice: ProductSummaryRecord["price"] | null;
  maxPrice: ProductSummaryRecord["price"] | null;
};

type ProductListResult = {
  products: ProductSummaryRecord[];
  total: number;
};

function buildActiveProductWhere(filters: ProductListQuery): Prisma.ProductWhereInput {
  return {
    isActive: true,
    ...(filters.brandId === undefined ? {} : { brandId: filters.brandId }),
    ...(filters.categoryId === undefined ? {} : { categoryId: filters.categoryId }),
    ...(filters.sourcePlatformId === undefined
      ? {}
      : { sourcePlatformId: filters.sourcePlatformId }),
    ...(filters.color === undefined
      ? {}
      : {
          color: {
            equals: filters.color,
            mode: "insensitive"
          }
        }),
    ...(filters.minPrice === undefined && filters.maxPrice === undefined
      ? {}
      : {
          price: {
            ...(filters.minPrice === undefined ? {} : { gte: filters.minPrice }),
            ...(filters.maxPrice === undefined ? {} : { lte: filters.maxPrice })
          }
        }),
    ...(filters.search === undefined
      ? {}
      : {
          title: {
            contains: filters.search,
            mode: "insensitive"
          }
        })
  };
}

export async function findActiveProducts(
  prisma: PrismaClient,
  filters: ProductListQuery
): Promise<ProductListResult> {
  const where = buildActiveProductWhere(filters);
  const skip = (filters.page - 1) * filters.pageSize;

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      select: productSummarySelect,
      orderBy: {
        createdAt: "desc"
      },
      skip,
      take: filters.pageSize
    }),
    prisma.product.count({ where })
  ]);

  return { products, total };
}

export async function findActiveProductById(
  prisma: PrismaClient,
  productId: string
): Promise<ProductDetailRecord | null> {
  return prisma.product.findFirst({
    where: {
      id: productId,
      isActive: true
    },
    select: productDetailSelect
  });
}

export async function findActiveProductFilterOptions(
  prisma: PrismaClient
): Promise<ProductFilterOptionsRecord> {
  const [brands, categories, sourcePlatforms, colors, priceRange] = await prisma.$transaction([
    prisma.brand.findMany({
      where: {
        products: {
          some: {
            isActive: true
          }
        }
      },
      select: catalogRecordSelect,
      orderBy: {
        name: "asc"
      }
    }),
    prisma.category.findMany({
      where: {
        products: {
          some: {
            isActive: true
          }
        }
      },
      select: catalogRecordSelect,
      orderBy: {
        name: "asc"
      }
    }),
    prisma.sourcePlatform.findMany({
      where: {
        products: {
          some: {
            isActive: true
          }
        }
      },
      select: catalogRecordSelect,
      orderBy: {
        name: "asc"
      }
    }),
    prisma.product.findMany({
      where: {
        isActive: true
      },
      distinct: ["color"],
      select: {
        color: true
      },
      orderBy: {
        color: "asc"
      }
    }),
    prisma.product.aggregate({
      where: {
        isActive: true
      },
      _min: {
        price: true
      },
      _max: {
        price: true
      }
    })
  ]);

  return {
    brands,
    categories,
    sourcePlatforms,
    colors: colors.map((product) => product.color),
    minPrice: priceRange._min.price,
    maxPrice: priceRange._max.price
  };
}

export async function findFavoritedProductIds(
  prisma: PrismaClient,
  userId: string,
  productIds: string[]
): Promise<string[]> {
  if (productIds.length === 0) {
    return [];
  }

  const wishlistItems = await prisma.wishlistItem.findMany({
    where: {
      productId: {
        in: productIds
      },
      wishlist: {
        userId
      }
    },
    select: {
      productId: true
    }
  });

  return wishlistItems.map((item) => item.productId);
}
