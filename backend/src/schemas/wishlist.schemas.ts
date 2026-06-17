import { z } from "zod";

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

const wishlistItemSchema = z.object({
  id: uuidSchema,
  product: productSummarySchema,
  createdAt: z.string().datetime()
});

export const wishlistQuerySchema = z
  .object({
    sort: z.enum(["newest", "oldest"]).default("newest")
  })
  .strict();

export const addWishlistItemRequestSchema = z
  .object({
    productId: uuidSchema
  })
  .strict();

export const wishlistItemParamsSchema = z.object({
  productId: uuidSchema
});

export const wishlistResponseSchema = z.object({
  data: z.object({
    items: z.array(wishlistItemSchema)
  }),
  meta: z.object({
    sort: z.enum(["newest", "oldest"])
  })
});

export const wishlistItemResponseSchema = z.object({
  data: wishlistItemSchema
});

export const deleteWishlistItemResponseSchema = z.object({
  data: z.object({
    success: z.boolean()
  })
});

export type WishlistQuery = z.infer<typeof wishlistQuerySchema>;
export type AddWishlistItemRequest = z.infer<typeof addWishlistItemRequestSchema>;
export type WishlistItemParams = z.infer<typeof wishlistItemParamsSchema>;
export type WishlistResponse = z.infer<typeof wishlistResponseSchema>;
export type WishlistItemResponse = z.infer<typeof wishlistItemResponseSchema>;
export type DeleteWishlistItemResponse = z.infer<typeof deleteWishlistItemResponseSchema>;
export type WishlistItemResponseData = z.infer<typeof wishlistItemSchema>;
