import { env } from "./env.js";

export const authRateLimitConfig = {
  max: env.AUTH_RATE_LIMIT_MAX,
  timeWindow: env.AUTH_RATE_LIMIT_WINDOW_MS
} as const;
