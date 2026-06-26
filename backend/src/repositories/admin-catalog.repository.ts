import { Prisma, type PrismaClient } from "@prisma/client";

import type { AdminCatalogListQuery } from "../schemas/admin-catalog.schemas.js";

const catalogRecordSelect = {
  id: true,
  name: true,
  slug: true,
  isActive: true,
  createdAt: true,
  updatedAt: true
} as const;

const sourcePlatformSelect = {
  ...catalogRecordSelect,
  baseUrl: true
} as const;

export type CatalogRecord = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type SourcePlatformRecord = CatalogRecord & {
  baseUrl: string | null;
};

export type CatalogRecordWriteInput = {
  name: string;
  slug: string;
};

export type CatalogRecordUpdateInput = {
  name?: string;
  slug?: string;
  isActive?: boolean;
};

export type SourcePlatformWriteInput = CatalogRecordWriteInput & {
  baseUrl?: string | null;
};

export type SourcePlatformUpdateInput = CatalogRecordUpdateInput & {
  baseUrl?: string | null;
};

type CatalogListResult<T> = {
  items: T[];
  total: number;
};

function buildBrandWhere(query: AdminCatalogListQuery): Prisma.BrandWhereInput {
  if (query.search === undefined) {
    return {};
  }

  return {
    OR: [
      {
        name: {
          contains: query.search,
          mode: "insensitive"
        }
      },
      {
        slug: {
          contains: query.search,
          mode: "insensitive"
        }
      }
    ]
  };
}

function buildCategoryWhere(query: AdminCatalogListQuery): Prisma.CategoryWhereInput {
  if (query.search === undefined) {
    return {};
  }

  return {
    OR: [
      {
        name: {
          contains: query.search,
          mode: "insensitive"
        }
      },
      {
        slug: {
          contains: query.search,
          mode: "insensitive"
        }
      }
    ]
  };
}

function buildSourcePlatformWhere(query: AdminCatalogListQuery): Prisma.SourcePlatformWhereInput {
  if (query.search === undefined) {
    return {};
  }

  return {
    OR: [
      {
        name: {
          contains: query.search,
          mode: "insensitive"
        }
      },
      {
        slug: {
          contains: query.search,
          mode: "insensitive"
        }
      }
    ]
  };
}

export async function listBrands(
  prisma: PrismaClient,
  query: AdminCatalogListQuery
): Promise<CatalogListResult<CatalogRecord>> {
  const where = buildBrandWhere(query);
  const skip = (query.page - 1) * query.pageSize;

  const [items, total] = await prisma.$transaction([
    prisma.brand.findMany({
      where,
      select: catalogRecordSelect,
      orderBy: {
        name: "asc"
      },
      skip,
      take: query.pageSize
    }),
    prisma.brand.count({ where })
  ]);

  return { items, total };
}

export async function createBrand(
  prisma: PrismaClient,
  input: CatalogRecordWriteInput
): Promise<CatalogRecord> {
  return prisma.brand.create({
    data: input,
    select: catalogRecordSelect
  });
}

export async function findBrandById(
  prisma: PrismaClient,
  brandId: string
): Promise<CatalogRecord | null> {
  return prisma.brand.findUnique({
    where: { id: brandId },
    select: catalogRecordSelect
  });
}

export async function updateBrand(
  prisma: PrismaClient,
  brandId: string,
  input: CatalogRecordUpdateInput
): Promise<CatalogRecord> {
  return prisma.brand.update({
    where: { id: brandId },
    data: input,
    select: catalogRecordSelect
  });
}

export async function countActiveProductsByBrandId(
  prisma: PrismaClient,
  brandId: string
): Promise<number> {
  return prisma.product.count({
    where: {
      brandId,
      isActive: true
    }
  });
}

export async function deactivateBrand(
  prisma: PrismaClient,
  brandId: string
): Promise<CatalogRecord> {
  return prisma.brand.update({
    where: { id: brandId },
    data: { isActive: false },
    select: catalogRecordSelect
  });
}

export async function listCategories(
  prisma: PrismaClient,
  query: AdminCatalogListQuery
): Promise<CatalogListResult<CatalogRecord>> {
  const where = buildCategoryWhere(query);
  const skip = (query.page - 1) * query.pageSize;

  const [items, total] = await prisma.$transaction([
    prisma.category.findMany({
      where,
      select: catalogRecordSelect,
      orderBy: {
        name: "asc"
      },
      skip,
      take: query.pageSize
    }),
    prisma.category.count({ where })
  ]);

  return { items, total };
}

export async function createCategory(
  prisma: PrismaClient,
  input: CatalogRecordWriteInput
): Promise<CatalogRecord> {
  return prisma.category.create({
    data: input,
    select: catalogRecordSelect
  });
}

export async function findCategoryById(
  prisma: PrismaClient,
  categoryId: string
): Promise<CatalogRecord | null> {
  return prisma.category.findUnique({
    where: { id: categoryId },
    select: catalogRecordSelect
  });
}

export async function updateCategory(
  prisma: PrismaClient,
  categoryId: string,
  input: CatalogRecordUpdateInput
): Promise<CatalogRecord> {
  return prisma.category.update({
    where: { id: categoryId },
    data: input,
    select: catalogRecordSelect
  });
}

export async function countActiveProductsByCategoryId(
  prisma: PrismaClient,
  categoryId: string
): Promise<number> {
  return prisma.product.count({
    where: {
      categoryId,
      isActive: true
    }
  });
}

export async function deactivateCategory(
  prisma: PrismaClient,
  categoryId: string
): Promise<CatalogRecord> {
  return prisma.category.update({
    where: { id: categoryId },
    data: { isActive: false },
    select: catalogRecordSelect
  });
}

export async function listSourcePlatforms(
  prisma: PrismaClient,
  query: AdminCatalogListQuery
): Promise<CatalogListResult<SourcePlatformRecord>> {
  const where = buildSourcePlatformWhere(query);
  const skip = (query.page - 1) * query.pageSize;

  const [items, total] = await prisma.$transaction([
    prisma.sourcePlatform.findMany({
      where,
      select: sourcePlatformSelect,
      orderBy: {
        name: "asc"
      },
      skip,
      take: query.pageSize
    }),
    prisma.sourcePlatform.count({ where })
  ]);

  return { items, total };
}

export async function createSourcePlatform(
  prisma: PrismaClient,
  input: SourcePlatformWriteInput
): Promise<SourcePlatformRecord> {
  return prisma.sourcePlatform.create({
    data: input,
    select: sourcePlatformSelect
  });
}

export async function findSourcePlatformById(
  prisma: PrismaClient,
  sourcePlatformId: string
): Promise<SourcePlatformRecord | null> {
  return prisma.sourcePlatform.findUnique({
    where: { id: sourcePlatformId },
    select: sourcePlatformSelect
  });
}

export async function updateSourcePlatform(
  prisma: PrismaClient,
  sourcePlatformId: string,
  input: SourcePlatformUpdateInput
): Promise<SourcePlatformRecord> {
  return prisma.sourcePlatform.update({
    where: { id: sourcePlatformId },
    data: input,
    select: sourcePlatformSelect
  });
}

export async function countActiveProductsBySourcePlatformId(
  prisma: PrismaClient,
  sourcePlatformId: string
): Promise<number> {
  return prisma.product.count({
    where: {
      sourcePlatformId,
      isActive: true
    }
  });
}

export async function deactivateSourcePlatform(
  prisma: PrismaClient,
  sourcePlatformId: string
): Promise<SourcePlatformRecord> {
  return prisma.sourcePlatform.update({
    where: { id: sourcePlatformId },
    data: { isActive: false },
    select: sourcePlatformSelect
  });
}

export function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}
