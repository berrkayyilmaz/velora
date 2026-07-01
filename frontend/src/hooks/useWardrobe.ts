import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { outfitQueryKeys } from "@/hooks/useOutfits";
import {
  createWardrobeItem,
  deleteWardrobeItem,
  getWardrobeItem,
  getWardrobeItems,
  updateWardrobeItem,
} from "@/services/wardrobe.service";
import type { WardrobeListQuery } from "@/types/wardrobe";

const WARDROBE_PAGE_SIZE = 20;

export const wardrobeQueryKeys = {
  all: ["wardrobe"] as const,
  lists: () => [...wardrobeQueryKeys.all, "list"] as const,
  list: (query: WardrobeListQuery) =>
    [...wardrobeQueryKeys.lists(), query] as const,
  details: () => [...wardrobeQueryKeys.all, "detail"] as const,
  detail: (wardrobeItemId: string) =>
    [...wardrobeQueryKeys.details(), wardrobeItemId] as const,
};

export function useWardrobeItems(query: WardrobeListQuery = {}) {
  return useInfiniteQuery({
    queryKey: wardrobeQueryKeys.list(query),
    queryFn: ({ pageParam }) =>
      getWardrobeItems({
        ...query,
        page: pageParam,
        pageSize: WARDROBE_PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const pagination = lastPage.meta.pagination;

      return pagination.hasNextPage ? pagination.page + 1 : undefined;
    },
  });
}

export function useWardrobeItem(wardrobeItemId: string | undefined) {
  return useQuery({
    queryKey: wardrobeQueryKeys.detail(wardrobeItemId ?? "missing"),
    queryFn: () => {
      if (wardrobeItemId === undefined) {
        throw new Error("Wardrobe item ID is required.");
      }

      return getWardrobeItem(wardrobeItemId);
    },
    enabled: wardrobeItemId !== undefined,
  });
}

export function useCreateWardrobeItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createWardrobeItem,
    onSuccess: async (item) => {
      queryClient.setQueryData(wardrobeQueryKeys.detail(item.id), item);
      await queryClient.invalidateQueries({
        queryKey: wardrobeQueryKeys.lists(),
      });
    },
  });
}

export function useUpdateWardrobeItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateWardrobeItem,
    onSuccess: async (item) => {
      queryClient.setQueryData(wardrobeQueryKeys.detail(item.id), item);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: wardrobeQueryKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: outfitQueryKeys.all }),
      ]);
    },
  });
}

export function useDeleteWardrobeItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteWardrobeItem,
    onSuccess: async (_success, wardrobeItemId) => {
      queryClient.removeQueries({
        queryKey: wardrobeQueryKeys.detail(wardrobeItemId),
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: wardrobeQueryKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: outfitQueryKeys.all }),
      ]);
    },
  });
}
