import type { Prisma, PrismaClient } from "@prisma/client";

import type {
  AdminProductImportRow,
  AdminProductListQuery,
  CreateAdminProductRequest,
  UpdateAdminProductRequest
} from "../schemas/admin-product.schemas.js";

const catalogRecordSelect = {
  id: true,
  name: true,
  slug: true
} as const;

const adminProductSelect = {
  id: true,
  title: true,
  price: true,
  imageUrl: true,
  productUrl: true,
  color: true,
  description: true,
  availableColors: true,
  tags: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
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

export type AdminProductRecord = Prisma.ProductGetPayload<{
  select: typeof adminProductSelect;
}>;

type AdminProductListResult = {
  products: AdminProductRecord[];
  total: number;
};

function buildAdminProductWhere(query: AdminProductListQuery): Prisma.ProductWhereInput {
  return {
    ...(query.search === undefined
      ? {}
      : {
          title: {
            contains: query.search,
            mode: "insensitive"
          }
        }),
    ...(query.brandId === undefined ? {} : { brandId: query.brandId }),
    ...(query.categoryId === undefined ? {} : { categoryId: query.categoryId }),
    ...(query.sourcePlatformId === undefined ? {} : { sourcePlatformId: query.sourcePlatformId }),
    ...(query.color === undefined
      ? {}
      : {
          color: {
            equals: query.color,
            mode: "insensitive"
          }
        }),
    ...(query.isActive === undefined ? {} : { isActive: query.isActive })
  };
}

export async function listAdminProducts(
  prisma: PrismaClient,
  query: AdminProductListQuery
): Promise<AdminProductListResult> {
  const where = buildAdminProductWhere(query);
  const skip = (query.page - 1) * query.pageSize;

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      select: adminProductSelect,
      orderBy: {
        updatedAt: "desc"
      },
      skip,
      take: query.pageSize
    }),
    prisma.product.count({ where })
  ]);

  return { products, total };
}

export async function findAdminProductById(
  prisma: PrismaClient,
  productId: string
): Promise<AdminProductRecord | null> {
  return prisma.product.findUnique({
    where: { id: productId },
    select: adminProductSelect
  });
}

export async function createAdminProduct(
  prisma: PrismaClient,
  input: CreateAdminProductRequest
): Promise<AdminProductRecord> {
  return prisma.product.create({
    data: {
      title: input.title,
      brandId: input.brandId,
      categoryId: input.categoryId,
      sourcePlatformId: input.sourcePlatformId,
      price: input.price,
      imageUrl: input.imageUrl,
      productUrl: input.productUrl,
      color: input.color,
      ...(input.description === undefined ? {} : { description: input.description }),
      ...(input.availableColors === undefined ? {} : { availableColors: input.availableColors }),
      ...(input.tags === undefined ? {} : { tags: input.tags }),
      ...(input.isActive === undefined ? {} : { isActive: input.isActive })
    },
    select: adminProductSelect
  });
}

export async function findExistingAdminProductForImport(
  prisma: PrismaClient,
  input: Pick<AdminProductImportRow, "id" | "productUrl">
): Promise<{ id: string } | null> {
  const matches: Prisma.ProductWhereInput[] = [{ productUrl: input.productUrl }];

  if (input.id !== undefined) {
    matches.push({ id: input.id });
  }

  return prisma.product.findFirst({
    where: {
      OR: matches
    },
    select: { id: true }
  });
}

export async function createImportedAdminProduct(
  prisma: PrismaClient,
  input: CreateAdminProductRequest & { id?: string }
): Promise<AdminProductRecord> {
  return prisma.product.create({
    data: {
      ...(input.id === undefined ? {} : { id: input.id }),
      title: input.title,
      brandId: input.brandId,
      categoryId: input.categoryId,
      sourcePlatformId: input.sourcePlatformId,
      price: input.price,
      imageUrl: input.imageUrl,
      productUrl: input.productUrl,
      color: input.color,
      ...(input.description === undefined ? {} : { description: input.description }),
      ...(input.availableColors === undefined ? {} : { availableColors: input.availableColors }),
      ...(input.tags === undefined ? {} : { tags: input.tags }),
      ...(input.isActive === undefined ? {} : { isActive: input.isActive })
    },
    select: adminProductSelect
  });
}

export async function updateAdminProduct(
  prisma: PrismaClient,
  productId: string,
  input: UpdateAdminProductRequest
): Promise<AdminProductRecord> {
  return prisma.product.update({
    where: { id: productId },
    data: {
      ...(input.title === undefined ? {} : { title: input.title }),
      ...(input.brandId === undefined ? {} : { brandId: input.brandId }),
      ...(input.categoryId === undefined ? {} : { categoryId: input.categoryId }),
      ...(input.sourcePlatformId === undefined ? {} : { sourcePlatformId: input.sourcePlatformId }),
      ...(input.price === undefined ? {} : { price: input.price }),
      ...(input.imageUrl === undefined ? {} : { imageUrl: input.imageUrl }),
      ...(input.productUrl === undefined ? {} : { productUrl: input.productUrl }),
      ...(input.color === undefined ? {} : { color: input.color }),
      ...(input.description === undefined ? {} : { description: input.description }),
      ...(input.availableColors === undefined ? {} : { availableColors: input.availableColors }),
      ...(input.tags === undefined ? {} : { tags: input.tags }),
      ...(input.isActive === undefined ? {} : { isActive: input.isActive })
    },
    select: adminProductSelect
  });
}

export async function softDeleteAdminProduct(
  prisma: PrismaClient,
  productId: string
): Promise<AdminProductRecord> {
  return prisma.product.update({
    where: { id: productId },
    data: {
      isActive: false
    },
    select: adminProductSelect
  });
}

export async function findBrandForAdminProduct(
  prisma: PrismaClient,
  brandId: string
): Promise<{ id: string } | null> {
  return prisma.brand.findUnique({
    where: { id: brandId },
    select: { id: true }
  });
}

export async function findBrandForAdminProductBySlug(
  prisma: PrismaClient,
  brandSlug: string
): Promise<{ id: string } | null> {
  return prisma.brand.findUnique({
    where: { slug: brandSlug },
    select: { id: true }
  });
}

export async function findCategoryForAdminProduct(
  prisma: PrismaClient,
  categoryId: string
): Promise<{ id: string } | null> {
  return prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true }
  });
}

export async function findCategoryForAdminProductBySlug(
  prisma: PrismaClient,
  categorySlug: string
): Promise<{ id: string } | null> {
  return prisma.category.findUnique({
    where: { slug: categorySlug },
    select: { id: true }
  });
}

export async function findSourcePlatformForAdminProduct(
  prisma: PrismaClient,
  sourcePlatformId: string
): Promise<{ id: string } | null> {
  return prisma.sourcePlatform.findUnique({
    where: { id: sourcePlatformId },
    select: { id: true }
  });
}

export async function findSourcePlatformForAdminProductBySlug(
  prisma: PrismaClient,
  sourcePlatformSlug: string
): Promise<{ id: string } | null> {
  return prisma.sourcePlatform.findUnique({
    where: { slug: sourcePlatformSlug },
    select: { id: true }
  });
}
