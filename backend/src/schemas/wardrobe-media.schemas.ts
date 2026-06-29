import { z } from "zod";

const uuidSchema = z.string().uuid();

export const wardrobeMediaTypeSchema = z.enum(["image/jpeg", "image/png", "image/webp"]);

export const wardrobeMediaItemParamsSchema = z.object({
  id: uuidSchema
});

export const wardrobeMediaParamsSchema = z.object({
  id: uuidSchema,
  mediaId: uuidSchema
});

export const wardrobeMediaSchema = z.object({
  id: uuidSchema,
  wardrobeItemId: uuidSchema,
  mediaType: wardrobeMediaTypeSchema,
  purpose: z.literal("primary"),
  status: z.enum(["uploading", "ready", "failed", "deletion_pending"]),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  fileSize: z.number().int().nonnegative().nullable(),
  createdAt: z.string().datetime(),
  url: z.string()
});

export const wardrobeMediaResponseSchema = z.object({
  data: wardrobeMediaSchema
});

export const deleteWardrobeMediaResponseSchema = z.object({
  data: z.object({
    success: z.boolean()
  })
});

export type WardrobeMediaResponseData = z.infer<typeof wardrobeMediaSchema>;
export type WardrobeMediaResponse = z.infer<typeof wardrobeMediaResponseSchema>;
export type DeleteWardrobeMediaResponse = z.infer<typeof deleteWardrobeMediaResponseSchema>;
