import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAnalytics } from "@/hooks/useAnalytics";
import { productQueryKeys } from "@/hooks/useProducts";
import {
  addWishlistItem,
  getWishlist,
  removeWishlistItem
} from "@/services/wishlist.service";
import type { WishlistSort } from "@/types/wishlist";
import type { AnalyticsSourceScreen } from "@/types/analytics";

export const wishlistQueryKeys = {
  all: ["wishlist"] as const,
  list: (sort: WishlistSort) => [...wishlistQueryKeys.all, "list", sort] as const
};

async function invalidateWishlistAndProducts(
  queryClient: ReturnType<typeof useQueryClient>,
  productId: string
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: wishlistQueryKeys.all }),
    queryClient.invalidateQueries({ queryKey: productQueryKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: productQueryKeys.detail(productId) })
  ]);
}

export function useWishlist(sort: WishlistSort = "newest") {
  return useQuery({
    queryKey: wishlistQueryKeys.list(sort),
    queryFn: () => getWishlist(sort)
  });
}

export function useAddWishlistItem() {
  const queryClient = useQueryClient();
  const { trackEvent } = useAnalytics();

  return useMutation({
    mutationFn: addWishlistItem,
    onSuccess: (_item, productId) => {
      trackEvent({
        eventType: "product_favorited",
        productId,
        sourceScreen: "product_detail"
      });

      return invalidateWishlistAndProducts(queryClient, productId);
    }
  });
}

export function useRemoveWishlistItem(
  sourceScreen: AnalyticsSourceScreen = "product_detail"
) {
  const queryClient = useQueryClient();
  const { trackEvent } = useAnalytics();

  return useMutation({
    mutationFn: removeWishlistItem,
    onSuccess: (_success, productId) => {
      trackEvent({
        eventType: "product_unfavorited",
        productId,
        sourceScreen
      });

      return invalidateWishlistAndProducts(queryClient, productId);
    }
  });
}
