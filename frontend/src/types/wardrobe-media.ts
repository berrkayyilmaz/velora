import { z } from "zod";

import {
  wardrobeMediaSchema,
  wardrobeMediaTypeSchema
} from "@/schemas/wardrobe-media.schemas";

export type WardrobeMediaType = z.infer<typeof wardrobeMediaTypeSchema>;
export type WardrobeMedia = z.infer<typeof wardrobeMediaSchema>;

export type WardrobeMediaUploadInput = {
  wardrobeItemId: string;
  uri: string;
  fileName: string;
  mediaType: WardrobeMediaType;
  webFile?: Blob;
};

export type DeleteWardrobeMediaInput = {
  wardrobeItemId: string;
  mediaId: string;
};
