import { z } from "zod";

const uuidSchema = z.string().uuid();

export const redirectSourceScreenSchema = z.enum([
  "catalog",
  "product_detail",
  "wishlist",
  "outfit"
]);

export const createRedirectRequestSchema = z
  .object({
    productId: uuidSchema,
    outfitId: uuidSchema.optional(),
    sourceScreen: redirectSourceScreenSchema
  })
  .strict();

export const redirectResponseSchema = z.object({
  data: z.object({
    redirectId: uuidSchema,
    productUrl: z.string().url()
  })
});

export type CreateRedirectRequest = z.infer<typeof createRedirectRequestSchema>;
export type RedirectSourceScreen = z.infer<typeof redirectSourceScreenSchema>;
export type RedirectResponse = z.infer<typeof redirectResponseSchema>;
