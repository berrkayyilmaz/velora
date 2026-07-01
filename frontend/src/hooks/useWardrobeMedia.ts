import { useMutation, useQueryClient } from "@tanstack/react-query";

import { outfitQueryKeys } from "@/hooks/useOutfits";
import { wardrobeQueryKeys } from "@/hooks/useWardrobe";
import {
  deleteWardrobeMedia,
  uploadWardrobeMedia,
} from "@/services/wardrobe-media.service";
import type { WardrobeItem } from "@/types/wardrobe";

export function useUploadWardrobeMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadWardrobeMedia,
    onSuccess: async (media) => {
      queryClient.setQueryData<WardrobeItem>(
        wardrobeQueryKeys.detail(media.wardrobeItemId),
        (item) =>
          item === undefined ? item : { ...item, primaryMedia: media },
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: wardrobeQueryKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: outfitQueryKeys.all }),
      ]);
    },
  });
}

export function useDeleteWardrobeMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteWardrobeMedia,
    onSuccess: async (_success, input) => {
      queryClient.setQueryData<WardrobeItem>(
        wardrobeQueryKeys.detail(input.wardrobeItemId),
        (item) =>
          item === undefined
            ? item
            : {
                ...item,
                primaryMedia: null,
                status: item.status === "active" ? "draft" : item.status,
              },
      );
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: wardrobeQueryKeys.detail(input.wardrobeItemId),
        }),
        queryClient.invalidateQueries({ queryKey: wardrobeQueryKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: outfitQueryKeys.all }),
      ]);
    },
  });
}
