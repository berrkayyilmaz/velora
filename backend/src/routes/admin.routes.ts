import type { FastifyPluginCallback, FastifyReply, FastifyRequest } from "fastify";
import type { ZodError } from "zod";

import { authRateLimitConfig } from "../config/security.js";
import { requireAdminAuth } from "../middleware/admin-auth.middleware.js";
import {
  adminLoginRequestSchema,
  adminMeResponseSchema,
  adminSessionResponseSchema
} from "../schemas/admin-auth.schemas.js";
import {
  AdminAuthServiceError,
  getAdminProfile,
  loginAdmin
} from "../services/admin-auth.service.js";

function sendValidationError(reply: FastifyReply, error: ZodError): FastifyReply {
  return reply.status(400).send({
    error: {
      code: "VALIDATION_ERROR",
      message: "Invalid request body.",
      details: error.flatten()
    }
  });
}

function sendAdminAuthError(reply: FastifyReply, error: unknown): FastifyReply {
  if (error instanceof AdminAuthServiceError) {
    return reply.status(error.statusCode).send({
      error: {
        code: error.code,
        message: error.message
      }
    });
  }

  throw error;
}

function getAuthenticatedAdminId(request: FastifyRequest): string {
  if (request.admin === undefined) {
    throw new AdminAuthServiceError("UNAUTHORIZED", 401, "Admin authentication is required.");
  }

  return request.admin.id;
}

const adminRoutes: FastifyPluginCallback = (app, _options, done) => {
  app.post(
    "/auth/login",
    { config: { rateLimit: authRateLimitConfig } },
    async (request, reply) => {
      const parsedBody = adminLoginRequestSchema.safeParse(request.body);

      if (!parsedBody.success) {
        return sendValidationError(reply, parsedBody.error);
      }

      try {
        const session = await loginAdmin(app.prisma, parsedBody.data);
        const response = adminSessionResponseSchema.parse({ data: session });

        return reply.status(200).send(response);
      } catch (error) {
        return sendAdminAuthError(reply, error);
      }
    }
  );

  app.get("/me", { preHandler: requireAdminAuth }, async (request, reply) => {
    try {
      const adminUser = await getAdminProfile(app.prisma, getAuthenticatedAdminId(request));
      const response = adminMeResponseSchema.parse({ data: { adminUser } });

      return reply.status(200).send(response);
    } catch (error) {
      return sendAdminAuthError(reply, error);
    }
  });

  done();
};

export default adminRoutes;
