import {
  createWardrobeItemInputSchema,
  deleteWardrobeItemResponseSchema,
  updateWardrobeItemInputSchema,
  wardrobeItemResponseSchema,
  wardrobeListQuerySchema,
  wardrobeListResponseSchema
} from "@/schemas/wardrobe.schemas";
import { apiClient } from "@/services/api/client";
import { resolveMediaUrl } from "@/services/wardrobe-media.service";
import type {
  CreateWardrobeItemInput,
  UpdateWardrobeItemInput,
  WardrobeItem,
  WardrobeListQuery,
  WardrobeListResponse
} from "@/types/wardrobe";

type WardrobeListRequest = WardrobeListQuery & {
  page: number;
  pageSize: number;
};

function resolveWardrobeMedia(item: WardrobeItem): WardrobeItem {
  if (item.primaryMedia === null) {
    return item;
  }

  return {
    ...item,
    primaryMedia: {
      ...item.primaryMedia,
      url: resolveMediaUrl(item.primaryMedia.url)
    }
  };
}

export async function getWardrobeItems(
  input: WardrobeListRequest
): Promise<WardrobeListResponse> {
  const query = wardrobeListQuerySchema.parse(input);
  const response = await apiClient.get("/wardrobe", {
    params: {
      ...query,
      page: input.page,
      pageSize: input.pageSize
    }
  });

  const result = wardrobeListResponseSchema.parse(response.data);

  return {
    ...result,
    data: {
      items: result.data.items.map(resolveWardrobeMedia)
    }
  };
}

export async function getWardrobeItem(wardrobeItemId: string): Promise<WardrobeItem> {
  const response = await apiClient.get(`/wardrobe/${wardrobeItemId}`);

  return resolveWardrobeMedia(wardrobeItemResponseSchema.parse(response.data).data);
}

export async function createWardrobeItem(
  input: CreateWardrobeItemInput
): Promise<WardrobeItem> {
  const body = createWardrobeItemInputSchema.parse(input);
  const response = await apiClient.post("/wardrobe", body);

  return resolveWardrobeMedia(wardrobeItemResponseSchema.parse(response.data).data);
}

export async function updateWardrobeItem(
  input: UpdateWardrobeItemInput
): Promise<WardrobeItem> {
  const { wardrobeItemId, ...body } = updateWardrobeItemInputSchema.parse(input);
  const response = await apiClient.patch(`/wardrobe/${wardrobeItemId}`, body);

  return resolveWardrobeMedia(wardrobeItemResponseSchema.parse(response.data).data);
}

export async function deleteWardrobeItem(wardrobeItemId: string): Promise<boolean> {
  const response = await apiClient.delete(`/wardrobe/${wardrobeItemId}`);

  return deleteWardrobeItemResponseSchema.parse(response.data).data.success;
}
