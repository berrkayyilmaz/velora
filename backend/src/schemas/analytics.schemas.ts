import { z } from "zod";

const uuidSchema = z.string().uuid();

export const analyticsEventTypeSchema = z.enum([
  "user_registered",
  "user_logged_in",
  "user_logged_out",
  "password_reset_requested",
  "product_viewed",
  "product_searched",
  "product_filter_applied",
  "product_favorited",
  "product_unfavorited",
  "outfit_created",
  "outfit_saved",
  "outfit_edited",
  "outfit_deleted",
  "product_added_to_outfit",
  "product_removed_from_outfit",
  "retailer_redirect_clicked"
]);

export const createAnalyticsEventRequestSchema = z
  .object({
    eventType: analyticsEventTypeSchema,
    productId: uuidSchema.optional(),
    outfitId: uuidSchema.optional(),
    sourceScreen: z.string().trim().min(1).max(100).optional()
  })
  .strict();

export const analyticsEventResponseSchema = z.object({
  data: z.object({
    accepted: z.boolean(),
    eventId: uuidSchema
  })
});

export type AnalyticsEventType = z.infer<typeof analyticsEventTypeSchema>;
export type CreateAnalyticsEventRequest = z.infer<typeof createAnalyticsEventRequestSchema>;
export type AnalyticsEventResponse = z.infer<typeof analyticsEventResponseSchema>;
