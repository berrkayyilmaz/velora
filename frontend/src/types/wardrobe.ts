import { z } from "zod";

import {
  createWardrobeItemInputSchema,
  updateWardrobeItemFieldsSchema,
  wardrobeItemSchema,
  wardrobeItemStatusSchema,
  wardrobeListQuerySchema,
  wardrobeListResponseSchema,
  wardrobeSortSchema
} from "@/schemas/wardrobe.schemas";

export type WardrobeItemStatus = z.infer<typeof wardrobeItemStatusSchema>;
export type WardrobeSort = z.infer<typeof wardrobeSortSchema>;
export type WardrobeListQuery = z.infer<typeof wardrobeListQuerySchema>;
export type WardrobeItem = z.infer<typeof wardrobeItemSchema>;
export type WardrobeListResponse = z.infer<typeof wardrobeListResponseSchema>;
export type CreateWardrobeItemInput = z.infer<typeof createWardrobeItemInputSchema>;
export type UpdateWardrobeItemFields = z.infer<typeof updateWardrobeItemFieldsSchema>;

export type UpdateWardrobeItemInput = UpdateWardrobeItemFields & {
  wardrobeItemId: string;
};
