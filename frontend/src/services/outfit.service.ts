import {
  deleteOutfitResponseSchema,
  outfitDetailResponseSchema,
  outfitListResponseSchema
} from "@/schemas/outfit.schemas";
import { apiClient } from "@/services/api/client";
import { resolveMediaUrl } from "@/services/wardrobe-media.service";
import type {
  CreateOutfitInput,
  MixedOutfitItem,
  OutfitDetail,
  OutfitListResponse,
  OutfitProductInput,
  OutfitSort,
  OutfitSummary,
  OutfitWardrobeItemInput,
  UpdateOutfitInput
} from "@/types/outfit";

type OutfitListInput = {
  sort: OutfitSort;
  page: number;
  pageSize: number;
};

function resolveMixedItems(items: MixedOutfitItem[]): MixedOutfitItem[] {
  return items.map((item) => {
    if (item.type === "catalog_product" || item.wardrobeItem.primaryMedia === null) {
      return item;
    }

    return {
      ...item,
      wardrobeItem: {
        ...item.wardrobeItem,
        primaryMedia: {
          ...item.wardrobeItem.primaryMedia,
          url: resolveMediaUrl(item.wardrobeItem.primaryMedia.url)
        }
      }
    };
  });
}

function resolveOutfitSummaryMedia(outfit: OutfitSummary): OutfitSummary {
  return {
    ...outfit,
    itemsPreview: resolveMixedItems(outfit.itemsPreview)
  };
}

function resolveOutfitDetailMedia(outfit: OutfitDetail): OutfitDetail {
  return {
    ...outfit,
    itemsPreview: resolveMixedItems(outfit.itemsPreview),
    items: resolveMixedItems(outfit.items)
  };
}

export async function getOutfits(input: OutfitListInput): Promise<OutfitListResponse> {
  const response = await apiClient.get("/outfits", {
    params: input
  });
  const result = outfitListResponseSchema.parse(response.data);

  return {
    ...result,
    data: {
      items: result.data.items.map(resolveOutfitSummaryMedia)
    }
  };
}

export async function getOutfit(outfitId: string): Promise<OutfitDetail> {
  const response = await apiClient.get(`/outfits/${outfitId}`);

  return resolveOutfitDetailMedia(outfitDetailResponseSchema.parse(response.data).data);
}

export async function createOutfit(input: CreateOutfitInput): Promise<OutfitDetail> {
  const response = await apiClient.post("/outfits", input);

  return resolveOutfitDetailMedia(outfitDetailResponseSchema.parse(response.data).data);
}

export async function updateOutfit({
  outfitId,
  name
}: UpdateOutfitInput): Promise<OutfitDetail> {
  const response = await apiClient.patch(`/outfits/${outfitId}`, {
    name
  });

  return resolveOutfitDetailMedia(outfitDetailResponseSchema.parse(response.data).data);
}

export async function deleteOutfit(outfitId: string): Promise<boolean> {
  const response = await apiClient.delete(`/outfits/${outfitId}`);

  return deleteOutfitResponseSchema.parse(response.data).data.success;
}

export async function addProductToOutfit({
  outfitId,
  productId
}: OutfitProductInput): Promise<OutfitDetail> {
  const response = await apiClient.post(`/outfits/${outfitId}/products`, {
    productId
  });

  return resolveOutfitDetailMedia(outfitDetailResponseSchema.parse(response.data).data);
}

export async function removeProductFromOutfit({
  outfitId,
  productId
}: OutfitProductInput): Promise<OutfitDetail> {
  const response = await apiClient.delete(
    `/outfits/${outfitId}/products/${productId}`
  );

  return resolveOutfitDetailMedia(outfitDetailResponseSchema.parse(response.data).data);
}

export async function addWardrobeItemToOutfit({
  outfitId,
  wardrobeItemId
}: OutfitWardrobeItemInput): Promise<OutfitDetail> {
  const response = await apiClient.post(`/outfits/${outfitId}/wardrobe-items`, {
    wardrobeItemId
  });

  return resolveOutfitDetailMedia(outfitDetailResponseSchema.parse(response.data).data);
}

export async function removeWardrobeItemFromOutfit({
  outfitId,
  wardrobeItemId
}: OutfitWardrobeItemInput): Promise<OutfitDetail> {
  const response = await apiClient.delete(
    `/outfits/${outfitId}/wardrobe-items/${wardrobeItemId}`
  );

  return resolveOutfitDetailMedia(outfitDetailResponseSchema.parse(response.data).data);
}
