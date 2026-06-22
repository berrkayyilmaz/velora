import { apiClient } from "@/services/api/client";
import type {
  CreateOutfitInput,
  DeleteOutfitResponse,
  OutfitDetail,
  OutfitDetailResponse,
  OutfitListResponse,
  OutfitProductInput,
  OutfitSort,
  UpdateOutfitInput
} from "@/types/outfit";

type OutfitListInput = {
  sort: OutfitSort;
  page: number;
  pageSize: number;
};

export async function getOutfits(input: OutfitListInput): Promise<OutfitListResponse> {
  const response = await apiClient.get<OutfitListResponse>("/outfits", {
    params: input
  });

  return response.data;
}

export async function getOutfit(outfitId: string): Promise<OutfitDetail> {
  const response = await apiClient.get<OutfitDetailResponse>(`/outfits/${outfitId}`);

  return response.data.data;
}

export async function createOutfit(input: CreateOutfitInput): Promise<OutfitDetail> {
  const response = await apiClient.post<OutfitDetailResponse>("/outfits", input);

  return response.data.data;
}

export async function updateOutfit({
  outfitId,
  name
}: UpdateOutfitInput): Promise<OutfitDetail> {
  const response = await apiClient.patch<OutfitDetailResponse>(`/outfits/${outfitId}`, {
    name
  });

  return response.data.data;
}

export async function deleteOutfit(outfitId: string): Promise<boolean> {
  const response = await apiClient.delete<DeleteOutfitResponse>(`/outfits/${outfitId}`);

  return response.data.data.success;
}

export async function addProductToOutfit({
  outfitId,
  productId
}: OutfitProductInput): Promise<OutfitDetail> {
  const response = await apiClient.post<OutfitDetailResponse>(`/outfits/${outfitId}/products`, {
    productId
  });

  return response.data.data;
}

export async function removeProductFromOutfit({
  outfitId,
  productId
}: OutfitProductInput): Promise<OutfitDetail> {
  const response = await apiClient.delete<OutfitDetailResponse>(
    `/outfits/${outfitId}/products/${productId}`
  );

  return response.data.data;
}
