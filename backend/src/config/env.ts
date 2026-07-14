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
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(60_000),
  TRY_ON_EXECUTOR_MODE: z.enum(["disabled", "local-cli", "remote-http"]).default("disabled"),
  TRY_ON_ML_ENABLED: z
    .string()
    .trim()
    .transform((value) => value.toLowerCase() === "true")
    .default("false"),
  TRY_ON_ML_PYTHON_COMMAND: z.string().trim().default("python"),
  TRY_ON_ML_COMMAND_ARGS: z
    .string()
    .trim()
    .transform((value) =>
      value
        .split(",")
        .map((arg) => arg.trim())
        .filter((arg) => arg.length > 0)
    )
    .pipe(z.array(z.string()).min(1))
    .default("-m,src.main,catvton-research"),
  TRY_ON_ML_WORKING_DIRECTORY: z.string().trim().optional(),
  TRY_ON_ML_PERSON_IMAGE_ROOT: z.string().trim().optional(),
  TRY_ON_ML_CATALOG_GARMENT_ROOT: z.string().trim().optional(),
  TRY_ON_ML_WARDROBE_GARMENT_ROOT: z.string().trim().optional(),
  TRY_ON_ML_OUTPUT_DIRECTORY: z.string().trim().optional(),
  TRY_ON_ML_PERSON_IMAGE_PATH_TEMPLATE: z.string().trim().default("{personImageAssetId}"),
  TRY_ON_ML_CATALOG_GARMENT_PATH_TEMPLATE: z.string().trim().default("{productId}.png"),
  TRY_ON_ML_WARDROBE_GARMENT_PATH_TEMPLATE: z.string().trim().default("{wardrobeItemId}.png"),
  TRY_ON_ML_CLOTH_TYPE: z.enum(["upper", "lower", "overall"]).default("upper"),
  TRY_ON_ML_SEED: z.coerce.number().int().nonnegative().default(42),
  TRY_ON_ML_INFERENCE_STEPS: z.coerce.number().int().positive().default(30),
  TRY_ON_ML_GUIDANCE_SCALE: z.coerce.number().positive().default(2.5),
  TRY_ON_ML_WIDTH: z.coerce.number().int().positive().default(768),
  TRY_ON_ML_HEIGHT: z.coerce.number().int().positive().default(1024),
  TRY_ON_ML_DEVICE: z.string().trim().default("cuda"),
  TRY_ON_ML_BASE_MODEL_PATH: z.string().trim().default("runwayml/stable-diffusion-inpainting"),
  TRY_ON_ML_RESUME_PATH: z.string().trim().default("zhengchong/CatVTON"),
  TRY_ON_ML_TIMEOUT_MS: z.coerce.number().int().positive().default(600_000),
  TRY_ON_REMOTE_WORKER_BASE_URL: z.string().trim().optional(),
  TRY_ON_REMOTE_WORKER_API_KEY: z.string().trim().optional(),
  TRY_ON_REMOTE_WORKER_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
  TRY_ON_REMOTE_WORKER_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(1_000),
  TRY_ON_REMOTE_WORKER_MAX_WAIT_MS: z.coerce.number().int().positive().default(600_000),
  TRY_ON_REMOTE_WORKER_SUBMIT_PATH: z.string().trim().default("/try-on/jobs"),
  TRY_ON_REMOTE_WORKER_STATUS_PATH: z.string().trim().default("/try-on/jobs/{workerJobId}/status"),
  TRY_ON_REMOTE_WORKER_CANCEL_PATH: z.string().trim().default("/try-on/jobs/{workerJobId}/cancel"),
  TRY_ON_REMOTE_WORKER_RESULT_PATH: z.string().trim().default("/try-on/jobs/{workerJobId}/result")
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw new Error(`Invalid environment configuration: ${parsedEnv.error.message}`);
}

export const env = parsedEnv.data;
