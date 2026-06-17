import type { FastifyPluginCallback } from "fastify";

import { env } from "../config/env.js";
import { getHealthStatus } from "../services/health.service.js";

const healthRoutes: FastifyPluginCallback = (app, _options, done) => {
  app.get("/", async (_request, reply) => {
    const health = await getHealthStatus(app.prisma, env.NODE_ENV);
    const statusCode = health.status === "ok" ? 200 : 503;

    return reply.status(statusCode).send(health);
  });

  done();
};

export default healthRoutes;
