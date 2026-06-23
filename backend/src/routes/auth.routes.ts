import type { FastifyPluginCallback, FastifyReply } from "fastify";
import type { ZodError } from "zod";

import { authRateLimitConfig } from "../config/security.js";
import {
  authSessionResponseSchema,
  loginRequestSchema,
  registerRequestSchema
} from "../schemas/auth.schemas.js";
import { AuthServiceError, loginUser, registerUser } from "../services/auth.service.js";

function sendValidationError(reply: FastifyReply, error: ZodError): FastifyReply {
  return reply.status(400).send({
    error: {
      code: "VALIDATION_ERROR",
      message: "Invalid request body.",
      details: error.flatten()
    }
  });
}

function sendAuthError(reply: FastifyReply, error: unknown): FastifyReply {
  if (error instanceof AuthServiceError) {
    return reply.status(error.statusCode).send({
      error: {
        code: error.code,
        message: error.message
      }
    });
  }

  throw error;
}

const authRoutes: FastifyPluginCallback = (app, _options, done) => {
  app.post("/register", { config: { rateLimit: authRateLimitConfig } }, async (request, reply) => {
    const parsedBody = registerRequestSchema.safeParse(request.body);

    if (!parsedBody.success) {
      return sendValidationError(reply, parsedBody.error);
    }

    try {
      const session = await registerUser(app.prisma, parsedBody.data);
      const response = authSessionResponseSchema.parse({ data: session });

      return reply.status(201).send(response);
    } catch (error) {
      return sendAuthError(reply, error);
    }
  });

  app.post("/login", { config: { rateLimit: authRateLimitConfig } }, async (request, reply) => {
    const parsedBody = loginRequestSchema.safeParse(request.body);

    if (!parsedBody.success) {
      return sendValidationError(reply, parsedBody.error);
    }

    try {
      const session = await loginUser(app.prisma, parsedBody.data);
      const response = authSessionResponseSchema.parse({ data: session });

      return reply.status(200).send(response);
    } catch (error) {
      return sendAuthError(reply, error);
    }
  });

  done();
};

export default authRoutes;
