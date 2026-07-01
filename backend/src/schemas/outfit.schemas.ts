import { z } from "zod";

const uuidSchema = z.string().uuid();
const outfitNameSchema = z.string().trim().min(1).max(100);

const catalogRecordSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  slug: z.string()
});

const productSummarySchema = z.object({
  id: uuidSchema,
  title: z.string(),
  brand: catalogRecordSchema,
  category: catalogRecordSchema,
  sourcePlatform: catalogRecordSchema,
  price: z.string(),
  imageUrl: z.string(),
  color: z.string(),
  isFavorited: z.boolean()
});

const paginationSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  hasNextPage: z.boolean()
});

const outfitSummarySchema = z.object({
  id: uuidSchema,
  name: z.string(),
  productCount: z.number().int().nonnegative(),
  productsPreview: z.array(productSummarySchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

const outfitDetailSchema = outfitSummarySchema.extend({
  products: z.array(productSummarySchema),
  includedCategories: z.array(catalogRecordSchema),
  missingCategoryHints: z.array(z.string())
});

export const outfitListQuerySchema = z
  .object({
    sort: z.enum(["newest", "oldest"]).default("newest"),
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20)
  })
  .strict();

export const outfitParamsSchema = z.object({
  id: uuidSchema
});

export const outfitProductParamsSchema = z.object({
  id: uuidSchema,
  productId: uuidSchema
});

export const outfitWardrobeItemParamsSchema = z.object({
  id: uuidSchema,
  wardrobeItemId: uuidSchema
});

const productIdsSchema = z
  .array(uuidSchema)
  .default([])
  .refine((productIds) => new Set(productIds).size === productIds.length, {
    message: "productIds must not contain duplicates."
  });

export const createOutfitRequestSchema = z
  .object({
    name: outfitNameSchema,
    productIds: productIdsSchema.optional()
  })
  .strict();

export const updateOutfitRequestSchema = z
  .object({
    name: outfitNameSchema.optional()
  })
  .strict();

export const addOutfitProductRequestSchema = z
  .object({
    productId: uuidSchema
  })
  .strict();

export const addOutfitWardrobeItemRequestSchema = z
  .object({
    wardrobeItemId: uuidSchema
  })
  .strict();

export const outfitListResponseSchema = z.object({
  data: z.object({
    items: z.array(outfitSummarySchema)
  }),
  meta: z.object({
    pagination: paginationSchema
  })
});

export const outfitDetailResponseSchema = z.object({
  data: outfitDetailSchema
});

export const deleteOutfitResponseSchema = z.object({
  data: z.object({
    success: z.boolean()
  })
});

export type OutfitListQuery = z.infer<typeof outfitListQuerySchema>;
export type OutfitParams = z.infer<typeof outfitParamsSchema>;
export type OutfitProductParams = z.infer<typeof outfitProductParamsSchema>;
export type OutfitWardrobeItemParams = z.infer<typeof outfitWardrobeItemParamsSchema>;
export type CreateOutfitRequest = z.infer<typeof createOutfitRequestSchema>;
export type UpdateOutfitRequest = z.infer<typeof updateOutfitRequestSchema>;
export type AddOutfitProductRequest = z.infer<typeof addOutfitProductRequestSchema>;
export type AddOutfitWardrobeItemRequest = z.infer<typeof addOutfitWardrobeItemRequestSchema>;
export type ProductSummaryResponse = z.infer<typeof productSummarySchema>;
export type CatalogRecordResponse = z.infer<typeof catalogRecordSchema>;
export type OutfitSummaryResponse = z.infer<typeof outfitSummarySchema>;
export type OutfitDetailResponse = z.infer<typeof outfitDetailSchema>;
export type OutfitListResponse = z.infer<typeof outfitListResponseSchema>;
export type DeleteOutfitResponse = z.infer<typeof deleteOutfitResponseSchema>;
