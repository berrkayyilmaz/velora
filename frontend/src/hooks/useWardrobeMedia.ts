import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  deleteWardrobeMedia,
  uploadWardrobeMedia
} from "@/services/wardrobe-media.service";
import type { WardrobeMedia } from "@/types/wardrobe-media";

const wardrobeMediaQueryKey = (wardrobeItemId: string) =>
  ["wardrobe", "detail", wardrobeItemId, "media"] as const;

export function useWardrobeMedia(wardrobeItemId: string | undefined) {
  return useQuery<WardrobeMedia | null>({
    queryKey: wardrobeMediaQueryKey(wardrobeItemId ?? "missing"),
    queryFn: async () => null,
    enabled: false,
    initialData: null,
    staleTime: Infinity,
    gcTime: Infinity
  });
}

export function useUploadWardrobeMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadWardrobeMedia,
    onSuccess: (media) => {
      queryClient.setQueryData(wardrobeMediaQueryKey(media.wardrobeItemId), media);
    }
  });
}

export function useDeleteWardrobeMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteWardrobeMedia,
    onSuccess: (_success, input) => {
      queryClient.setQueryData(wardrobeMediaQueryKey(input.wardrobeItemId), null);
    }
  });
}
