import { z } from "zod";

const uuidSchema = z.string().uuid();

export const tryOnJobStatusSchema = z.enum([
  "queued",
  "validating",
  "processing",
  "succeeded",
  "failed",
  "cancelled",
  "expired"
]);

const tryOnResultStatusSchema = z.enum(["ready", "failed", "deletion_pending", "deleted"]);

const paginationSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  hasNextPage: z.boolean()
});

const tryOnResultSchema = z.object({
  id: uuidSchema,
  jobId: uuidSchema,
  status: tryOnResultStatusSchema,
  mediaType: z.string(),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  url: z.string().nullable(),
  expiresAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable()
});

const tryOnGarmentSourceSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("catalog_product"),
    productId: uuidSchema
  }),
  z.object({
    type: z.literal("wardrobe_item"),
    wardrobeItemId: uuidSchema
  })
]);

const tryOnPersonImageSchema = z.object({
  type: z.literal("temporary_upload")
});

const tryOnJobSchema = z.object({
  id: uuidSchema,
  status: tryOnJobStatusSchema,
  personImage: tryOnPersonImageSchema,
  garmentSource: tryOnGarmentSourceSchema,
  outfitId: uuidSchema.nullable(),
  provider: z.string().nullable(),
  providerVersion: z.string().nullable(),
  modelVersion: z.string().nullable(),
  attemptCount: z.number().int().nonnegative(),
  failureCode: z.string().nullable(),
  failureMessage: z.string().nullable(),
  result: tryOnResultSchema.nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  expiresAt: z.string().datetime().nullable()
});

export const createTryOnJobRequestSchema = z
  .object({
    personImageAssetId: z.string().trim().min(1).max(500),
    productId: uuidSchema.optional(),
    wardrobeItemId: uuidSchema.optional(),
    outfitId: uuidSchema.optional(),
    idempotencyKey: z.string().trim().min(1).max(120).optional()
  })
  .strict()
  .refine(
    (input) =>
      (input.productId === undefined && input.wardrobeItemId !== undefined) ||
      (input.productId !== undefined && input.wardrobeItemId === undefined),
    {
      message: "Exactly one garment source must be provided."
    }
  );

export const tryOnJobListQuerySchema = z
  .object({
    status: tryOnJobStatusSchema.optional(),
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20)
  })
  .strict();

export const tryOnJobParamsSchema = z.object({
  jobId: uuidSchema
});

export const tryOnJobResponseSchema = z.object({
  data: tryOnJobSchema
});

export const tryOnJobListResponseSchema = z.object({
  data: z.object({
    items: z.array(tryOnJobSchema)
  }),
  meta: z.object({
    pagination: paginationSchema,
    appliedFilters: z.object({
      status: tryOnJobStatusSchema.optional()
    })
  })
});

export const deleteTryOnJobResponseSchema = z.object({
  data: z.object({
    success: z.boolean(),
    deletionPending: z.boolean().optional()
  })
});

export type TryOnJobStatus = z.infer<typeof tryOnJobStatusSchema>;
export type CreateTryOnJobRequest = z.infer<typeof createTryOnJobRequestSchema>;
export type TryOnJobListQuery = z.infer<typeof tryOnJobListQuerySchema>;
export type TryOnJobParams = z.infer<typeof tryOnJobParamsSchema>;
export type TryOnJobResponseData = z.infer<typeof tryOnJobSchema>;
export type TryOnJobResponse = z.infer<typeof tryOnJobResponseSchema>;
export type TryOnJobListResponse = z.infer<typeof tryOnJobListResponseSchema>;
export type DeleteTryOnJobResponse = z.infer<typeof deleteTryOnJobResponseSchema>;
