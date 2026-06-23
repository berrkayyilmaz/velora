import type { PrismaClient } from "@prisma/client";

import {
  createAdminProduct as createAdminProductRecord,
  createImportedAdminProduct,
  findAdminProductById,
  findBrandForAdminProduct,
  findBrandForAdminProductBySlug,
  findCategoryForAdminProduct,
  findCategoryForAdminProductBySlug,
  findExistingAdminProductForImport,
  findSourcePlatformForAdminProduct,
  findSourcePlatformForAdminProductBySlug,
  listAdminProducts as listAdminProductRecords,
  softDeleteAdminProduct,
  updateAdminProduct as updateAdminProductRecord,
  type AdminProductRecord
} from "../repositories/admin-product.repository.js";
import type {
  AdminProductImportRequest,
  AdminProductImportResponse,
  AdminProductImportRow,
  AdminProductListQuery,
  AdminProductListResponse,
  AdminProductResponse,
  CreateAdminProductRequest,
  DeleteAdminProductResponse,
  UpdateAdminProductRequest
} from "../schemas/admin-product.schemas.js";
import { adminProductImportRowSchema } from "../schemas/admin-product.schemas.js";

export class AdminProductServiceError extends Error {
  constructor(
    readonly code: string,
    readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "AdminProductServiceError";
  }
}

function toAdminProductResponse(product: AdminProductRecord): AdminProductResponse {
  return {
    id: product.id,
    title: product.title,
    brand: product.brand,
    category: product.category,
    sourcePlatform: product.sourcePlatform,
    price: product.price.toString(),
    imageUrl: product.imageUrl,
    productUrl: product.productUrl,
    color: product.color,
    description: product.description,
    availableColors: product.availableColors,
    tags: product.tags,
    isActive: product.isActive,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString()
  };
}

async function ensureProductExists(
  prisma: PrismaClient,
  productId: string
): Promise<AdminProductRecord> {
  const product = await findAdminProductById(prisma, productId);

  if (product === null) {
    throw new AdminProductServiceError("PRODUCT_NOT_FOUND", 404, "Product was not found.");
  }

  return product;
}

async function validateCatalogReferences(
  prisma: PrismaClient,
  input: {
    brandId?: string;
    categoryId?: string;
    sourcePlatformId?: string;
  }
): Promise<void> {
  if (input.brandId !== undefined) {
    const brand = await findBrandForAdminProduct(prisma, input.brandId);

    if (brand === null) {
      throw new AdminProductServiceError("BRAND_NOT_FOUND", 404, "Brand was not found.");
    }
  }

  if (input.categoryId !== undefined) {
    const category = await findCategoryForAdminProduct(prisma, input.categoryId);

    if (category === null) {
      throw new AdminProductServiceError("CATEGORY_NOT_FOUND", 404, "Category was not found.");
    }
  }

  if (input.sourcePlatformId !== undefined) {
    const sourcePlatform = await findSourcePlatformForAdminProduct(prisma, input.sourcePlatformId);

    if (sourcePlatform === null) {
      throw new AdminProductServiceError(
        "SOURCE_PLATFORM_NOT_FOUND",
        404,
        "Source platform was not found."
      );
    }
  }
}

function formatImportValidationReason(issues: { path: PropertyKey[]; message: string }[]): string {
  return issues
    .map((issue) => {
      const field = issue.path.length === 0 ? "row" : issue.path.join(".");

      return `${field}: ${issue.message}`;
    })
    .join("; ");
}

async function resolveImportCatalogReferences(
  prisma: PrismaClient,
  row: AdminProductImportRow
): Promise<CreateAdminProductRequest> {
  const [brand, category, sourcePlatform] = await Promise.all([
    row.brandId === undefined
      ? findBrandForAdminProductBySlug(prisma, row.brandSlug ?? "")
      : findBrandForAdminProduct(prisma, row.brandId),
    row.categoryId === undefined
      ? findCategoryForAdminProductBySlug(prisma, row.categorySlug ?? "")
      : findCategoryForAdminProduct(prisma, row.categoryId),
    row.sourcePlatformId === undefined
      ? findSourcePlatformForAdminProductBySlug(prisma, row.sourcePlatformSlug ?? "")
      : findSourcePlatformForAdminProduct(prisma, row.sourcePlatformId)
  ]);

  if (brand === null) {
    throw new AdminProductServiceError("BRAND_NOT_FOUND", 400, "Brand was not found.");
  }

  if (category === null) {
    throw new AdminProductServiceError("CATEGORY_NOT_FOUND", 400, "Category was not found.");
  }

  if (sourcePlatform === null) {
    throw new AdminProductServiceError(
      "SOURCE_PLATFORM_NOT_FOUND",
      400,
      "Source platform was not found."
    );
  }

  return {
    title: row.title,
    brandId: brand.id,
    categoryId: category.id,
    sourcePlatformId: sourcePlatform.id,
    price: row.price,
    imageUrl: row.imageUrl,
    productUrl: row.productUrl,
    color: row.color,
    ...(row.description === undefined ? {} : { description: row.description }),
    ...(row.availableColors === undefined ? {} : { availableColors: row.availableColors }),
    ...(row.tags === undefined ? {} : { tags: row.tags }),
    ...(row.isActive === undefined ? {} : { isActive: row.isActive })
  };
}

export async function listAdminProducts(
  prisma: PrismaClient,
  query: AdminProductListQuery
): Promise<AdminProductListResponse> {
  const { products, total } = await listAdminProductRecords(prisma, query);

  return {
    data: {
      items: products.map(toAdminProductResponse)
    },
    meta: {
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        hasNextPage: query.page * query.pageSize < total
      },
      appliedFilters: {
        ...(query.search === undefined ? {} : { search: query.search }),
        ...(query.brandId === undefined ? {} : { brandId: query.brandId }),
        ...(query.categoryId === undefined ? {} : { categoryId: query.categoryId }),
        ...(query.sourcePlatformId === undefined
          ? {}
          : { sourcePlatformId: query.sourcePlatformId }),
        ...(query.color === undefined ? {} : { color: query.color }),
        ...(query.isActive === undefined ? {} : { isActive: query.isActive })
      }
    }
  };
}

export async function getAdminProduct(
  prisma: PrismaClient,
  productId: string
): Promise<AdminProductResponse> {
  const product = await ensureProductExists(prisma, productId);

  return toAdminProductResponse(product);
}

export async function createAdminProduct(
  prisma: PrismaClient,
  input: CreateAdminProductRequest
): Promise<AdminProductResponse> {
  await validateCatalogReferences(prisma, input);

  const product = await createAdminProductRecord(prisma, input);

  return toAdminProductResponse(product);
}

export async function importAdminProducts(
  prisma: PrismaClient,
  input: AdminProductImportRequest
): Promise<AdminProductImportResponse> {
  let createdCount = 0;
  let skippedCount = 0;
  const failedRows: AdminProductImportResponse["data"]["failedRows"] = [];

  for (const [index, rawRow] of input.products.entries()) {
    const rowNumber = index + 1;
    const parsedRow = adminProductImportRowSchema.safeParse(rawRow);

    if (!parsedRow.success) {
      failedRows.push({
        row: rowNumber,
        reason: formatImportValidationReason(parsedRow.error.issues)
      });
      continue;
    }

    const existingProduct = await findExistingAdminProductForImport(prisma, parsedRow.data);

    if (existingProduct !== null) {
      skippedCount += 1;
      continue;
    }

    try {
      const productInput = await resolveImportCatalogReferences(prisma, parsedRow.data);

      await createImportedAdminProduct(prisma, {
        ...productInput,
        ...(parsedRow.data.id === undefined ? {} : { id: parsedRow.data.id })
      });
      createdCount += 1;
    } catch (error) {
      if (error instanceof AdminProductServiceError) {
        failedRows.push({ row: rowNumber, reason: error.message });
        continue;
      }

      throw error;
    }
  }

  return {
    data: {
      createdCount,
      skippedCount,
      failedRows
    }
  };
}

export async function updateAdminProduct(
  prisma: PrismaClient,
  productId: string,
  input: UpdateAdminProductRequest
): Promise<AdminProductResponse> {
  await ensureProductExists(prisma, productId);
  await validateCatalogReferences(prisma, input);

  const product = await updateAdminProductRecord(prisma, productId, input);

  return toAdminProductResponse(product);
}

export async function deleteAdminProduct(
  prisma: PrismaClient,
  productId: string
): Promise<DeleteAdminProductResponse> {
  const existingProduct = await ensureProductExists(prisma, productId);
  await softDeleteAdminProduct(prisma, productId);

  return {
    data: {
      success: true,
      deactivated: existingProduct.isActive
    }
  };
}
