import { z } from "zod";

const uuidSchema = z.string().uuid();
const catalogNameSchema = z.string().trim().min(1).max(120);
const catalogSlugInputSchema = z.string().trim().min(1).max(120);
const optionalUrlSchema = z.string().trim().url().nullable().optional();

const paginationSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  hasNextPage: z.boolean()
});

const appliedFiltersSchema = z.object({
  search: z.string().optional()
});

export const adminCatalogListQuerySchema = z
  .object({
    search: z.string().trim().min(1).max(100).optional(),
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20)
  })
  .strict();

export const adminCatalogParamsSchema = z.object({
  id: uuidSchema
});

export const createCatalogRecordRequestSchema = z
  .object({
    name: catalogNameSchema,
    slug: catalogSlugInputSchema.optional()
  })
  .strict();

export const updateCatalogRecordRequestSchema = createCatalogRecordRequestSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided."
  });

export const createSourcePlatformRequestSchema = z
  .object({
    name: catalogNameSchema,
    slug: catalogSlugInputSchema.optional(),
    baseUrl: optionalUrlSchema
  })
  .strict();

export const updateSourcePlatformRequestSchema = createSourcePlatformRequestSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided."
  });

export const catalogRecordResponseSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  slug: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const sourcePlatformResponseSchema = catalogRecordResponseSchema.extend({
  baseUrl: z.string().url().nullable()
});

export const adminCatalogListResponseSchema = z.object({
  data: z.object({
    items: z.array(catalogRecordResponseSchema)
  }),
  meta: z.object({
    pagination: paginationSchema,
    appliedFilters: appliedFiltersSchema
  })
});

export const adminCatalogDetailResponseSchema = z.object({
  data: catalogRecordResponseSchema
});

export const adminSourcePlatformListResponseSchema = z.object({
  data: z.object({
    items: z.array(sourcePlatformResponseSchema)
  }),
  meta: z.object({
    pagination: paginationSchema,
    appliedFilters: appliedFiltersSchema
  })
});

export const adminSourcePlatformDetailResponseSchema = z.object({
  data: sourcePlatformResponseSchema
});

export type AdminCatalogListQuery = z.infer<typeof adminCatalogListQuerySchema>;
export type AdminCatalogParams = z.infer<typeof adminCatalogParamsSchema>;
export type CreateCatalogRecordRequest = z.infer<typeof createCatalogRecordRequestSchema>;
export type UpdateCatalogRecordRequest = z.infer<typeof updateCatalogRecordRequestSchema>;
export type CreateSourcePlatformRequest = z.infer<typeof createSourcePlatformRequestSchema>;
export type UpdateSourcePlatformRequest = z.infer<typeof updateSourcePlatformRequestSchema>;
export type CatalogRecordResponse = z.infer<typeof catalogRecordResponseSchema>;
export type SourcePlatformResponse = z.infer<typeof sourcePlatformResponseSchema>;
export type AdminCatalogListResponse = z.infer<typeof adminCatalogListResponseSchema>;
export type AdminSourcePlatformListResponse = z.infer<typeof adminSourcePlatformListResponseSchema>;
