import type { FastifyPluginCallback, FastifyReply, FastifyRequest } from "fastify";
import type { ZodError } from "zod";

import { requireUserAuth } from "../middleware/auth.middleware.js";
import {
  analyticsEventResponseSchema,
  createAnalyticsEventRequestSchema
} from "../schemas/analytics.schemas.js";
import { AnalyticsServiceError, recordAnalyticsEvent } from "../services/analytics.service.js";

function sendValidationError(reply: FastifyReply, error: ZodError): FastifyReply {
  return reply.status(400).send({
    error: {
      code: "VALIDATION_ERROR",
      message: "Invalid request.",
      details: error.flatten()
    }
  });
}

function sendAnalyticsError(reply: FastifyReply, error: unknown): FastifyReply {
  if (error instanceof AnalyticsServiceError) {
    return reply.status(error.statusCode).send({
      error: {
        code: error.code,
        message: error.message
      }
    });
  }

  throw error;
}

function getAuthenticatedUserId(request: FastifyRequest): string {
  if (request.user === undefined) {
    throw new AnalyticsServiceError("UNAUTHORIZED", 401, "Authentication is required.");
  }

  return request.user.id;
}

const analyticsRoutes: FastifyPluginCallback = (app, _options, done) => {
  app.post("/events", { preHandler: requireUserAuth }, async (request, reply) => {
    const parsedBody = createAnalyticsEventRequestSchema.safeParse(request.body);

    if (!parsedBody.success) {
      return sendValidationError(reply, parsedBody.error);
    }

    try {
      const event = await recordAnalyticsEvent(
        app.prisma,
        getAuthenticatedUserId(request),
        parsedBody.data
      );
      const response = analyticsEventResponseSchema.parse(event);

      return reply.status(201).send(response);
    } catch (error) {
      return sendAnalyticsError(reply, error);
    }
  });

  done();
};

export default analyticsRoutes;
