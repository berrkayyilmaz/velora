import { z } from "zod";

import { userProfileResponseSchema } from "./auth.schemas.js";

export const updateProfileRequestSchema = z
  .object({
    displayName: z.string().trim().min(1).max(100).nullable().optional()
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one profile field is required."
  });

export const profileResponseSchema = z.object({
  data: userProfileResponseSchema
});

export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>;
export type ProfileResponse = z.infer<typeof profileResponseSchema>;
