import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAnalytics } from "@/hooks/useAnalytics";
import {
  addProductToOutfit,
  addWardrobeItemToOutfit,
  createOutfit,
  deleteOutfit,
  getOutfit,
  getOutfits,
  removeProductFromOutfit,
  removeWardrobeItemFromOutfit,
  updateOutfit
} from "@/services/outfit.service";
import type { OutfitSort } from "@/types/outfit";

const OUTFIT_PAGE_SIZE = 20;

export const outfitQueryKeys = {
  all: ["outfits"] as const,
  lists: () => [...outfitQueryKeys.all, "list"] as const,
  list: (sort: OutfitSort) => [...outfitQueryKeys.lists(), sort] as const,
  details: () => [...outfitQueryKeys.all, "detail"] as const,
  detail: (outfitId: string) => [...outfitQueryKeys.details(), outfitId] as const
};

export function useOutfits(sort: OutfitSort = "newest") {
  return useInfiniteQuery({
    queryKey: outfitQueryKeys.list(sort),
    queryFn: ({ pageParam }) =>
      getOutfits({
        sort,
        page: pageParam,
        pageSize: OUTFIT_PAGE_SIZE
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const pagination = lastPage.meta.pagination;

      return pagination.hasNextPage ? pagination.page + 1 : undefined;
    }
  });
}

export function useOutfit(outfitId: string | undefined) {
  return useQuery({
    queryKey: outfitQueryKeys.detail(outfitId ?? "missing"),
    queryFn: () => {
      if (outfitId === undefined) {
        throw new Error("Outfit ID is required.");
      }

      return getOutfit(outfitId);
    },
    enabled: outfitId !== undefined
  });
}

export function useCreateOutfit() {
  const queryClient = useQueryClient();
  const { trackEvent } = useAnalytics();

  return useMutation({
    mutationFn: createOutfit,
    onSuccess: async (outfit, input) => {
      trackEvent({
        eventType: "outfit_created",
        outfitId: outfit.id,
        sourceScreen: "outfit_builder"
      });
      trackEvent({
        eventType: "outfit_saved",
        outfitId: outfit.id,
        sourceScreen: "outfit_builder"
      });
      input.productIds?.forEach((productId) => {
        trackEvent({
          eventType: "product_added_to_outfit",
          productId,
          outfitId: outfit.id,
          sourceScreen: "outfit_builder"
        });
      });

      queryClient.setQueryData(outfitQueryKeys.detail(outfit.id), outfit);
      await queryClient.invalidateQueries({ queryKey: outfitQueryKeys.lists() });
    }
  });
}

export function useUpdateOutfit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateOutfit,
    onSuccess: async (outfit) => {
      queryClient.setQueryData(outfitQueryKeys.detail(outfit.id), outfit);
      await queryClient.invalidateQueries({ queryKey: outfitQueryKeys.lists() });
    }
  });
}

export function useDeleteOutfit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteOutfit,
    onSuccess: async (_success, outfitId) => {
      queryClient.removeQueries({ queryKey: outfitQueryKeys.detail(outfitId) });
      await queryClient.invalidateQueries({ queryKey: outfitQueryKeys.lists() });
    }
  });
}

export function useAddProductToOutfit() {
  const queryClient = useQueryClient();
  const { trackEvent } = useAnalytics();

  return useMutation({
    mutationFn: addProductToOutfit,
    onSuccess: async (outfit, input) => {
      trackEvent({
        eventType: "product_added_to_outfit",
        productId: input.productId,
        outfitId: outfit.id,
        sourceScreen: "product_detail"
      });

      queryClient.setQueryData(outfitQueryKeys.detail(outfit.id), outfit);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: outfitQueryKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: outfitQueryKeys.detail(outfit.id) })
      ]);
    }
  });
}

export function useRemoveProductFromOutfit() {
  const queryClient = useQueryClient();
  const { trackEvent } = useAnalytics();

  return useMutation({
    mutationFn: removeProductFromOutfit,
    onSuccess: async (outfit, input) => {
      trackEvent({
        eventType: "product_removed_from_outfit",
        productId: input.productId,
        outfitId: outfit.id,
        sourceScreen: "outfit"
      });

      queryClient.setQueryData(outfitQueryKeys.detail(outfit.id), outfit);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: outfitQueryKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: outfitQueryKeys.detail(outfit.id) })
      ]);
    }
  });
}

export function useAddWardrobeItemToOutfit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addWardrobeItemToOutfit,
    onSuccess: async (outfit) => {
      queryClient.setQueryData(outfitQueryKeys.detail(outfit.id), outfit);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: outfitQueryKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: outfitQueryKeys.detail(outfit.id) })
      ]);
    }
  });
}

export function useRemoveWardrobeItemFromOutfit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeWardrobeItemFromOutfit,
    onSuccess: async (outfit) => {
      queryClient.setQueryData(outfitQueryKeys.detail(outfit.id), outfit);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: outfitQueryKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: outfitQueryKeys.detail(outfit.id) })
      ]);
    }
  });
}
