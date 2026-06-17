import type { FastifyPluginCallback, FastifyReply, FastifyRequest } from "fastify";
import type { ZodError } from "zod";

import { requireUserAuth } from "../middleware/auth.middleware.js";
import {
  createRedirectRequestSchema,
  redirectResponseSchema
} from "../schemas/redirect.schemas.js";
import { createRetailerRedirect, RedirectServiceError } from "../services/redirect.service.js";

function sendValidationError(reply: FastifyReply, error: ZodError): FastifyReply {
  return reply.status(400).send({
    error: {
      code: "VALIDATION_ERROR",
      message: "Invalid request.",
      details: error.flatten()
    }
  });
}

function sendRedirectError(reply: FastifyReply, error: unknown): FastifyReply {
  if (error instanceof RedirectServiceError) {
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
    throw new RedirectServiceError("UNAUTHORIZED", 401, "Authentication is required.");
  }

  return request.user.id;
}

const redirectRoutes: FastifyPluginCallback = (app, _options, done) => {
  app.post("/", { preHandler: requireUserAuth }, async (request, reply) => {
    const parsedBody = createRedirectRequestSchema.safeParse(request.body);

    if (!parsedBody.success) {
      return sendValidationError(reply, parsedBody.error);
    }

    try {
      const redirect = await createRetailerRedirect(
        app.prisma,
        getAuthenticatedUserId(request),
        parsedBody.data
      );
      const response = redirectResponseSchema.parse(redirect);

      return reply.status(201).send(response);
    } catch (error) {
      return sendRedirectError(reply, error);
    }
  });

  done();
};

export default redirectRoutes;
