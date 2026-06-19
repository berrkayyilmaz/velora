import { z } from "zod";

const publicEnvSchema = z.object({
  EXPO_PUBLIC_API_BASE_URL: z.string().url()
});

const parsedEnv = publicEnvSchema.safeParse({
  EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL
});

if (!parsedEnv.success) {
  throw new Error("Invalid public environment configuration.");
}

export const env = parsedEnv.data;
