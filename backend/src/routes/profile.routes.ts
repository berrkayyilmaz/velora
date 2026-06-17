import type { FastifyPluginCallback, FastifyReply, FastifyRequest } from "fastify";
import type { ZodError } from "zod";

import { requireUserAuth } from "../middleware/auth.middleware.js";
import { profileResponseSchema, updateProfileRequestSchema } from "../schemas/profile.schemas.js";
import { getUserProfile, ProfileServiceError, updateProfile } from "../services/profile.service.js";

function sendValidationError(reply: FastifyReply, error: ZodError): FastifyReply {
  return reply.status(400).send({
    error: {
      code: "VALIDATION_ERROR",
      message: "Invalid request body.",
      details: error.flatten()
    }
  });
}

function sendProfileError(reply: FastifyReply, error: unknown): FastifyReply {
  if (error instanceof ProfileServiceError) {
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
    throw new ProfileServiceError("UNAUTHORIZED", 401, "Authentication is required.");
  }

  return request.user.id;
}

const profileRoutes: FastifyPluginCallback = (app, _options, done) => {
  app.get("/", { preHandler: requireUserAuth }, async (request, reply) => {
    try {
      const profile = await getUserProfile(app.prisma, getAuthenticatedUserId(request));
      const response = profileResponseSchema.parse({ data: profile });

      return reply.status(200).send(response);
    } catch (error) {
      return sendProfileError(reply, error);
    }
  });

  app.patch("/", { preHandler: requireUserAuth }, async (request, reply) => {
    const parsedBody = updateProfileRequestSchema.safeParse(request.body);

    if (!parsedBody.success) {
      return sendValidationError(reply, parsedBody.error);
    }

    try {
      const profile = await updateProfile(
        app.prisma,
        getAuthenticatedUserId(request),
        parsedBody.data
      );
      const response = profileResponseSchema.parse({ data: profile });

      return reply.status(200).send(response);
    } catch (error) {
      return sendProfileError(reply, error);
    }
  });

  done();
};

export default profileRoutes;
