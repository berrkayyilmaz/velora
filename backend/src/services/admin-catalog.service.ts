import type { PrismaClient } from "@prisma/client";

import {
  createBrand as createBrandRecord,
  createCategory as createCategoryRecord,
  createSourcePlatform as createSourcePlatformRecord,
  findBrandById,
  findCategoryById,
  findSourcePlatformById,
  isUniqueConstraintError,
  listBrands as listBrandRecords,
  listCategories as listCategoryRecords,
  listSourcePlatforms as listSourcePlatformRecords,
  updateBrand as updateBrandRecord,
  updateCategory as updateCategoryRecord,
  updateSourcePlatform as updateSourcePlatformRecord,
  type CatalogRecord,
  type CatalogRecordUpdateInput,
  type SourcePlatformRecord,
  type SourcePlatformUpdateInput
} from "../repositories/admin-catalog.repository.js";
import type {
  AdminCatalogListQuery,
  AdminCatalogListResponse,
  AdminSourcePlatformListResponse,
  CatalogRecordResponse,
  CreateCatalogRecordRequest,
  CreateSourcePlatformRequest,
  SourcePlatformResponse,
  UpdateCatalogRecordRequest,
  UpdateSourcePlatformRequest
} from "../schemas/admin-catalog.schemas.js";

export class AdminCatalogServiceError extends Error {
  constructor(
    readonly code: string,
    readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "AdminCatalogServiceError";
  }
}

function createSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function resolveSlug(name: string, providedSlug: string | undefined): string {
  const slug = createSlug(providedSlug ?? name);

  if (slug === "") {
    throw new AdminCatalogServiceError("INVALID_SLUG", 400, "A valid slug could not be generated.");
  }

  return slug;
}

function toCatalogRecordResponse(record: CatalogRecord): CatalogRecordResponse {
  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

function toSourcePlatformResponse(record: SourcePlatformRecord): SourcePlatformResponse {
  return {
    ...toCatalogRecordResponse(record),
    baseUrl: record.baseUrl
  };
}

function buildPagination(query: AdminCatalogListQuery, total: number) {
  return {
    page: query.page,
    pageSize: query.pageSize,
    total,
    hasNextPage: query.page * query.pageSize < total
  };
}

function buildAppliedFilters(query: AdminCatalogListQuery) {
  return {
    ...(query.search === undefined ? {} : { search: query.search })
  };
}

function handleUniqueConstraintError(error: unknown, code: string, message: string): never {
  if (isUniqueConstraintError(error)) {
    throw new AdminCatalogServiceError(code, 409, message);
  }

  throw error;
}

function buildCreateCatalogInput(input: CreateCatalogRecordRequest) {
  return {
    name: input.name,
    slug: resolveSlug(input.name, input.slug)
  };
}

function buildUpdateCatalogInput(input: UpdateCatalogRecordRequest): CatalogRecordUpdateInput {
  return {
    ...(input.name === undefined ? {} : { name: input.name }),
    ...(input.slug === undefined ? {} : { slug: resolveSlug(input.slug, input.slug) })
  };
}

function buildCreateSourcePlatformInput(input: CreateSourcePlatformRequest) {
  return {
    name: input.name,
    slug: resolveSlug(input.name, input.slug),
    ...(input.baseUrl === undefined ? {} : { baseUrl: input.baseUrl })
  };
}

function buildUpdateSourcePlatformInput(
  input: UpdateSourcePlatformRequest
): SourcePlatformUpdateInput {
  return {
    ...(input.name === undefined ? {} : { name: input.name }),
    ...(input.slug === undefined ? {} : { slug: resolveSlug(input.slug, input.slug) }),
    ...(input.baseUrl === undefined ? {} : { baseUrl: input.baseUrl })
  };
}

async function ensureBrandExists(prisma: PrismaClient, brandId: string): Promise<void> {
  const brand = await findBrandById(prisma, brandId);

  if (brand === null) {
    throw new AdminCatalogServiceError("BRAND_NOT_FOUND", 404, "Brand was not found.");
  }
}

async function ensureCategoryExists(prisma: PrismaClient, categoryId: string): Promise<void> {
  const category = await findCategoryById(prisma, categoryId);

  if (category === null) {
    throw new AdminCatalogServiceError("CATEGORY_NOT_FOUND", 404, "Category was not found.");
  }
}

async function ensureSourcePlatformExists(
  prisma: PrismaClient,
  sourcePlatformId: string
): Promise<void> {
  const sourcePlatform = await findSourcePlatformById(prisma, sourcePlatformId);

  if (sourcePlatform === null) {
    throw new AdminCatalogServiceError(
      "SOURCE_PLATFORM_NOT_FOUND",
      404,
      "Source platform was not found."
    );
  }
}

export async function listAdminBrands(
  prisma: PrismaClient,
  query: AdminCatalogListQuery
): Promise<AdminCatalogListResponse> {
  const { items, total } = await listBrandRecords(prisma, query);

  return {
    data: {
      items: items.map(toCatalogRecordResponse)
    },
    meta: {
      pagination: buildPagination(query, total),
      appliedFilters: buildAppliedFilters(query)
    }
  };
}

export async function createAdminBrand(
  prisma: PrismaClient,
  input: CreateCatalogRecordRequest
): Promise<CatalogRecordResponse> {
  try {
    const brand = await createBrandRecord(prisma, buildCreateCatalogInput(input));

    return toCatalogRecordResponse(brand);
  } catch (error) {
    return handleUniqueConstraintError(
      error,
      "BRAND_ALREADY_EXISTS",
      "Brand name or slug is already in use."
    );
  }
}

export async function updateAdminBrand(
  prisma: PrismaClient,
  brandId: string,
  input: UpdateCatalogRecordRequest
): Promise<CatalogRecordResponse> {
  await ensureBrandExists(prisma, brandId);

  try {
    const brand = await updateBrandRecord(prisma, brandId, buildUpdateCatalogInput(input));

    return toCatalogRecordResponse(brand);
  } catch (error) {
    return handleUniqueConstraintError(
      error,
      "BRAND_ALREADY_EXISTS",
      "Brand name or slug is already in use."
    );
  }
}

export async function listAdminCategories(
  prisma: PrismaClient,
  query: AdminCatalogListQuery
): Promise<AdminCatalogListResponse> {
  const { items, total } = await listCategoryRecords(prisma, query);

  return {
    data: {
      items: items.map(toCatalogRecordResponse)
    },
    meta: {
      pagination: buildPagination(query, total),
      appliedFilters: buildAppliedFilters(query)
    }
  };
}

export async function createAdminCategory(
  prisma: PrismaClient,
  input: CreateCatalogRecordRequest
): Promise<CatalogRecordResponse> {
  try {
    const category = await createCategoryRecord(prisma, buildCreateCatalogInput(input));

    return toCatalogRecordResponse(category);
  } catch (error) {
    return handleUniqueConstraintError(
      error,
      "CATEGORY_ALREADY_EXISTS",
      "Category name or slug is already in use."
    );
  }
}

export async function updateAdminCategory(
  prisma: PrismaClient,
  categoryId: string,
  input: UpdateCatalogRecordRequest
): Promise<CatalogRecordResponse> {
  await ensureCategoryExists(prisma, categoryId);

  try {
    const category = await updateCategoryRecord(prisma, categoryId, buildUpdateCatalogInput(input));

    return toCatalogRecordResponse(category);
  } catch (error) {
    return handleUniqueConstraintError(
      error,
      "CATEGORY_ALREADY_EXISTS",
      "Category name or slug is already in use."
    );
  }
}

export async function listAdminSourcePlatforms(
  prisma: PrismaClient,
  query: AdminCatalogListQuery
): Promise<AdminSourcePlatformListResponse> {
  const { items, total } = await listSourcePlatformRecords(prisma, query);

  return {
    data: {
      items: items.map(toSourcePlatformResponse)
    },
    meta: {
      pagination: buildPagination(query, total),
      appliedFilters: buildAppliedFilters(query)
    }
  };
}

export async function createAdminSourcePlatform(
  prisma: PrismaClient,
  input: CreateSourcePlatformRequest
): Promise<SourcePlatformResponse> {
  try {
    const sourcePlatform = await createSourcePlatformRecord(
      prisma,
      buildCreateSourcePlatformInput(input)
    );

    return toSourcePlatformResponse(sourcePlatform);
  } catch (error) {
    return handleUniqueConstraintError(
      error,
      "SOURCE_PLATFORM_ALREADY_EXISTS",
      "Source platform name or slug is already in use."
    );
  }
}

export async function updateAdminSourcePlatform(
  prisma: PrismaClient,
  sourcePlatformId: string,
  input: UpdateSourcePlatformRequest
): Promise<SourcePlatformResponse> {
  await ensureSourcePlatformExists(prisma, sourcePlatformId);

  try {
    const sourcePlatform = await updateSourcePlatformRecord(
      prisma,
      sourcePlatformId,
      buildUpdateSourcePlatformInput(input)
    );

    return toSourcePlatformResponse(sourcePlatform);
  } catch (error) {
    return handleUniqueConstraintError(
      error,
      "SOURCE_PLATFORM_ALREADY_EXISTS",
      "Source platform name or slug is already in use."
    );
  }
}
