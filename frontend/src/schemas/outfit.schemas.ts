import { z } from "zod";

import { wardrobeMediaSchema } from "@/schemas/wardrobe-media.schemas";

const uuidSchema = z.string().uuid();

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

export const outfitWardrobeItemSummarySchema = z.object({
  id: uuidSchema,
  title: z.string(),
  category: catalogRecordSchema,
  color: z.string().nullable(),
  status: z.enum(["draft", "active", "archived", "deletion_pending"]),
  primaryMedia: wardrobeMediaSchema.nullable()
});

const mixedCatalogProductSchema = z.object({
  type: z.literal("catalog_product"),
  id: uuidSchema,
  addedAt: z.string().datetime(),
  catalogProduct: productSummarySchema
});

const mixedWardrobeItemSchema = z.object({
  type: z.literal("wardrobe_item"),
  id: uuidSchema,
  addedAt: z.string().datetime(),
  wardrobeItem: outfitWardrobeItemSummarySchema
});

export const mixedOutfitItemSchema = z.discriminatedUnion("type", [
  mixedCatalogProductSchema,
  mixedWardrobeItemSchema
]);

export const outfitSummarySchema = z.object({
  id: uuidSchema,
  name: z.string(),
  productCount: z.number().int().nonnegative(),
  wardrobeItemCount: z.number().int().nonnegative(),
  itemCount: z.number().int().nonnegative(),
  productsPreview: z.array(productSummarySchema),
  itemsPreview: z.array(mixedOutfitItemSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const outfitDetailSchema = outfitSummarySchema.extend({
  products: z.array(productSummarySchema),
  items: z.array(mixedOutfitItemSchema),
  includedCategories: z.array(catalogRecordSchema),
  missingCategoryHints: z.array(z.string())
});

export const outfitListResponseSchema = z.object({
  data: z.object({
    items: z.array(outfitSummarySchema)
  }),
  meta: z.object({
    pagination: z.object({
      page: z.number().int().positive(),
      pageSize: z.number().int().positive(),
      total: z.number().int().nonnegative(),
      hasNextPage: z.boolean()
    })
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

export const outfitNameFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Outfit name is required.")
    .max(100, "Outfit name must be 100 characters or fewer.")
});

export type OutfitNameFormValues = z.infer<typeof outfitNameFormSchema>;
