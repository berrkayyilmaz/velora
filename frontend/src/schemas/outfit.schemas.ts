import { z } from "zod";

export const outfitNameFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Outfit name is required.")
    .max(100, "Outfit name must be 100 characters or fewer.")
});

export type OutfitNameFormValues = z.infer<typeof outfitNameFormSchema>;
