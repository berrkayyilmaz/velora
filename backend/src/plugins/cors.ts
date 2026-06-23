import fastifyCors from "@fastify/cors";
import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

import { env } from "../config/env.js";

const corsPlugin: FastifyPluginAsync = async (app) => {
  await app.register(fastifyCors, {
    origin: env.CORS_ALLOWED_ORIGINS,
    methods: ["GET", "HEAD", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 600
  });
};

export default fp(corsPlugin, {
  name: "cors"
});
