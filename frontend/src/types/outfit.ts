import { z } from "zod";

import {
  mixedOutfitItemSchema,
  outfitDetailResponseSchema,
  outfitDetailSchema,
  outfitListResponseSchema,
  outfitSummarySchema,
  outfitWardrobeItemSummarySchema
} from "@/schemas/outfit.schemas";

export type OutfitSort = "newest" | "oldest";
export type OutfitWardrobeItemSummary = z.infer<
  typeof outfitWardrobeItemSummarySchema
>;
export type MixedOutfitItem = z.infer<typeof mixedOutfitItemSchema>;
export type OutfitSummary = z.infer<typeof outfitSummarySchema>;
export type OutfitDetail = z.infer<typeof outfitDetailSchema>;
export type OutfitListResponse = z.infer<typeof outfitListResponseSchema>;
export type OutfitDetailResponse = z.infer<typeof outfitDetailResponseSchema>;

export type CreateOutfitInput = {
  name: string;
  productIds?: string[];
};

export type UpdateOutfitInput = {
  outfitId: string;
  name: string;
};

export type OutfitProductInput = {
  outfitId: string;
  productId: string;
};

export type OutfitWardrobeItemInput = {
  outfitId: string;
  wardrobeItemId: string;
};
