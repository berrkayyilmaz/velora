import { env } from "@/config/env";
import {
  deleteWardrobeMediaResponseSchema,
  wardrobeMediaResponseSchema
} from "@/schemas/wardrobe-media.schemas";
import { apiClient } from "@/services/api/client";
import type {
  DeleteWardrobeMediaInput,
  WardrobeMedia,
  WardrobeMediaUploadInput
} from "@/types/wardrobe-media";

export function resolveMediaUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const apiOrigin = env.EXPO_PUBLIC_API_BASE_URL.replace(/\/api\/v1\/?$/, "");

  return `${apiOrigin}${url.startsWith("/") ? "" : "/"}${url}`;
}

export async function uploadWardrobeMedia(
  input: WardrobeMediaUploadInput
): Promise<WardrobeMedia> {
  const formData = new FormData();

  if (input.webFile !== undefined) {
    formData.append("file", input.webFile, input.fileName);
  } else {
    formData.append(
      "file",
      {
        uri: input.uri,
        name: input.fileName,
        type: input.mediaType
      } as unknown as Blob
    );
  }

  const response = await apiClient.post(
    `/wardrobe/${input.wardrobeItemId}/media`,
    formData,
    {
      timeout: 30_000
    }
  );
  const media = wardrobeMediaResponseSchema.parse(response.data).data;

  return {
    ...media,
    url: resolveMediaUrl(media.url)
  };
}

export async function deleteWardrobeMedia(
  input: DeleteWardrobeMediaInput
): Promise<boolean> {
  const response = await apiClient.delete(
    `/wardrobe/${input.wardrobeItemId}/media/${input.mediaId}`
  );

  return deleteWardrobeMediaResponseSchema.parse(response.data).data.success;
}
