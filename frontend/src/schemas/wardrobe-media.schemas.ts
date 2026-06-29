import { z } from "zod";

export const wardrobeMediaTypeSchema = z.enum(["image/jpeg", "image/png", "image/webp"]);

export const wardrobeMediaSchema = z.object({
  id: z.string().uuid(),
  wardrobeItemId: z.string().uuid(),
  mediaType: wardrobeMediaTypeSchema,
  purpose: z.literal("primary"),
  status: z.enum(["uploading", "ready", "failed", "deletion_pending"]),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  fileSize: z.number().int().nonnegative().nullable(),
  createdAt: z.string().datetime(),
  url: z.string().min(1)
});

export const wardrobeMediaResponseSchema = z.object({
  data: wardrobeMediaSchema
});

export const deleteWardrobeMediaResponseSchema = z.object({
  data: z.object({
    success: z.boolean()
  })
});
