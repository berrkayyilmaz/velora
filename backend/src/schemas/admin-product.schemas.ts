import { z } from "zod";

const uuidSchema = z.string().uuid();
const nonEmptyTextSchema = z.string().trim().min(1);
const priceSchema = z.coerce.number().finite().nonnegative();
const optionalTextSchema = z.string().trim().max(2000).nullable().optional();
const stringListSchema = z.array(z.string().trim().min(1).max(100)).max(50);
const catalogSlugSchema = z.string().trim().min(1).max(120);

const booleanQuerySchema = z.union([
  z.boolean(),
  z.enum(["true", "false"]).transform((value) => value === "true")
]);

const catalogRecordSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  slug: z.string()
});

const adminProductSchema = z.object({
  id: uuidSchema,
  title: z.string(),
  brand: catalogRecordSchema,
  category: catalogRecordSchema,
  sourcePlatform: catalogRecordSchema,
  price: z.string(),
  imageUrl: z.string().url(),
  productUrl: z.string().url(),
  color: z.string(),
  description: z.string().nullable(),
  availableColors: z.array(z.string()),
  tags: z.array(z.string()),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

const paginationSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  hasNextPage: z.boolean()
});

export const adminProductListQuerySchema = z
  .object({
    search: z.string().trim().min(1).max(100).optional(),
    brandId: uuidSchema.optional(),
    categoryId: uuidSchema.optional(),
    sourcePlatformId: uuidSchema.optional(),
    color: z.string().trim().min(1).max(100).optional(),
    isActive: booleanQuerySchema.optional(),
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20)
  })
  .strict();

export const adminProductParamsSchema = z.object({
  id: uuidSchema
});

const adminProductWriteShape = {
  title: nonEmptyTextSchema.max(200),
  price: priceSchema,
  imageUrl: z.string().trim().url(),
  productUrl: z.string().trim().url(),
  color: nonEmptyTextSchema.max(100),
  description: optionalTextSchema,
  availableColors: stringListSchema.optional(),
  tags: stringListSchema.optional(),
  isActive: z.boolean().optional()
} as const;

export const createAdminProductRequestSchema = z
  .object({
    ...adminProductWriteShape,
    brandId: uuidSchema,
    categoryId: uuidSchema,
    sourcePlatformId: uuidSchema
  })
  .strict();

export const updateAdminProductRequestSchema = createAdminProductRequestSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided."
  });

export const adminProductListResponseSchema = z.object({
  data: z.object({
    items: z.array(adminProductSchema)
  }),
  meta: z.object({
    pagination: paginationSchema,
    appliedFilters: z.object({
      search: z.string().optional(),
      brandId: uuidSchema.optional(),
      categoryId: uuidSchema.optional(),
      sourcePlatformId: uuidSchema.optional(),
      color: z.string().optional(),
      isActive: z.boolean().optional()
    })
  })
});

export const adminProductDetailResponseSchema = z.object({
  data: adminProductSchema
});

export const deleteAdminProductResponseSchema = z.object({
  data: z.object({
    success: z.boolean(),
    deactivated: z.boolean()
  })
});

export const adminProductImportRequestSchema = z
  .object({
    products: z.array(z.unknown()).min(1).max(100)
  })
  .strict();

export const adminProductImportRowSchema = z
  .object({
    id: uuidSchema.optional(),
    ...adminProductWriteShape,
    brandId: uuidSchema.optional(),
    brandSlug: catalogSlugSchema.optional(),
    categoryId: uuidSchema.optional(),
    categorySlug: catalogSlugSchema.optional(),
    sourcePlatformId: uuidSchema.optional(),
    sourcePlatformSlug: catalogSlugSchema.optional()
  })
  .strict()
  .superRefine((value, context) => {
    const referencePairs = [
      ["brandId", value.brandId, "brandSlug", value.brandSlug],
      ["categoryId", value.categoryId, "categorySlug", value.categorySlug],
      ["sourcePlatformId", value.sourcePlatformId, "sourcePlatformSlug", value.sourcePlatformSlug]
    ] as const;

    for (const [idField, id, slugField, slug] of referencePairs) {
      if ((id === undefined) === (slug === undefined)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Provide exactly one of ${idField} or ${slugField}.`,
          path: [idField]
        });
      }
    }
  });

const failedImportRowSchema = z.object({
  row: z.number().int().positive(),
  reason: z.string().min(1)
});

export const adminProductImportResponseSchema = z.object({
  data: z.object({
    createdCount: z.number().int().nonnegative(),
    skippedCount: z.number().int().nonnegative(),
    failedRows: z.array(failedImportRowSchema)
  })
});

export type AdminProductListQuery = z.infer<typeof adminProductListQuerySchema>;
export type AdminProductParams = z.infer<typeof adminProductParamsSchema>;
export type CreateAdminProductRequest = z.infer<typeof createAdminProductRequestSchema>;
export type UpdateAdminProductRequest = z.infer<typeof updateAdminProductRequestSchema>;
export type AdminProductResponse = z.infer<typeof adminProductSchema>;
export type AdminProductListResponse = z.infer<typeof adminProductListResponseSchema>;
export type AdminProductDetailResponse = z.infer<typeof adminProductDetailResponseSchema>;
export type DeleteAdminProductResponse = z.infer<typeof deleteAdminProductResponseSchema>;
export type AdminProductImportRequest = z.infer<typeof adminProductImportRequestSchema>;
export type AdminProductImportRow = z.infer<typeof adminProductImportRowSchema>;
export type AdminProductImportResponse = z.infer<typeof adminProductImportResponseSchema>;
