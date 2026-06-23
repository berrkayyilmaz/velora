import fastifyRateLimit from "@fastify/rate-limit";
import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

import { authRateLimitConfig } from "../config/security.js";

const rateLimitPlugin: FastifyPluginAsync = async (app) => {
  await app.register(fastifyRateLimit, {
    global: false,
    ...authRateLimitConfig
  });
};

export default fp(rateLimitPlugin, {
  name: "rate-limit"
});
