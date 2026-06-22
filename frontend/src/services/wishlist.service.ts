import { apiClient } from "@/services/api/client";
import type {
  DeleteWishlistItemResponse,
  WishlistItem,
  WishlistItemResponse,
  WishlistResponse,
  WishlistSort
} from "@/types/wishlist";

export async function getWishlist(sort: WishlistSort): Promise<WishlistResponse> {
  const response = await apiClient.get<WishlistResponse>("/wishlist", {
    params: { sort }
  });

  return response.data;
}

export async function addWishlistItem(productId: string): Promise<WishlistItem> {
  const response = await apiClient.post<WishlistItemResponse>("/wishlist/items", {
    productId
  });

  return response.data.data;
}

export async function removeWishlistItem(productId: string): Promise<boolean> {
  const response = await apiClient.delete<DeleteWishlistItemResponse>(
    `/wishlist/items/${productId}`
  );

  return response.data.data.success;
}
