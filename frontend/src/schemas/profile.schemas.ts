import { z } from "zod";

export const profileFormSchema = z.object({
  displayName: z
    .string()
    .trim()
    .max(100, "Display name must be 100 characters or fewer.")
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
