import "dotenv/config";

import { z } from "zod";

const corsAllowedOriginsSchema = z
  .string()
  .trim()
  .min(1)
  .transform((value) =>
    value
      .split(",")
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0)
  )
  .pipe(z.array(z.string().url()).min(1))
  .transform((origins) => [...new Set(origins.map((origin) => new URL(origin).origin))]);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_TOKEN_EXPIRES_IN: z.string().default("1h"),
  CORS_ALLOWED_ORIGINS: corsAllowedOriginsSchema.default(
    "http://localhost:5173,http://localhost:8081"
  ),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(60_000)
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw new Error(`Invalid environment configuration: ${parsedEnv.error.message}`);
}

export const env = parsedEnv.data;
