import type { FastifyPluginCallback, FastifyReply, FastifyRequest } from "fastify";
import type { ZodError } from "zod";

import { requireUserAuth } from "../middleware/auth.middleware.js";
import {
  createTryOnJobRequestSchema,
  deleteTryOnJobResponseSchema,
  tryOnJobListQuerySchema,
  tryOnJobListResponseSchema,
  tryOnJobParamsSchema,
  tryOnJobResponseSchema
} from "../schemas/try-on.schemas.js";
import {
  cancelTryOnJob,
  createTryOnJob,
  deleteTryOnJob,
  getTryOnJob,
  listTryOnJobs,
  TryOnServiceError
} from "../services/try-on.service.js";

function sendValidationError(reply: FastifyReply, error: ZodError): FastifyReply {
  return reply.status(400).send({
    error: {
      code: "VALIDATION_ERROR",
      message: "Invalid request.",
      details: error.flatten()
    }
  });
}

function sendTryOnError(reply: FastifyReply, error: unknown): FastifyReply {
  if (error instanceof TryOnServiceError) {
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
    throw new TryOnServiceError("UNAUTHORIZED", 401, "Authentication is required.");
  }

  return request.user.id;
}

function getIdempotencyHeader(request: FastifyRequest): string | undefined {
  const value = request.headers["idempotency-key"];

  if (typeof value === "string") {
    return value;
  }

  return undefined;
}

const tryOnRoutes: FastifyPluginCallback = (app, _options, done) => {
  app.post("/jobs", { preHandler: requireUserAuth }, async (request, reply) => {
    const parsedBody = createTryOnJobRequestSchema.safeParse(request.body);

    if (!parsedBody.success) {
      return sendValidationError(reply, parsedBody.error);
    }

    try {
      const result = await createTryOnJob(
        app.prisma,
        getAuthenticatedUserId(request),
        parsedBody.data,
        getIdempotencyHeader(request)
      );

      return reply
        .status(result.created ? 202 : 200)
        .send(tryOnJobResponseSchema.parse(result.response));
    } catch (error) {
      return sendTryOnError(reply, error);
    }
  });

  app.get("/jobs", { preHandler: requireUserAuth }, async (request, reply) => {
    const parsedQuery = tryOnJobListQuerySchema.safeParse(request.query);

    if (!parsedQuery.success) {
      return sendValidationError(reply, parsedQuery.error);
    }

    try {
      const response = await listTryOnJobs(
        app.prisma,
        getAuthenticatedUserId(request),
        parsedQuery.data
      );

      return reply.status(200).send(tryOnJobListResponseSchema.parse(response));
    } catch (error) {
      return sendTryOnError(reply, error);
    }
  });

  app.get("/jobs/:jobId", { preHandler: requireUserAuth }, async (request, reply) => {
    const parsedParams = tryOnJobParamsSchema.safeParse(request.params);

    if (!parsedParams.success) {
      return sendValidationError(reply, parsedParams.error);
    }

    try {
      const response = await getTryOnJob(
        app.prisma,
        getAuthenticatedUserId(request),
        parsedParams.data.jobId
      );

      return reply.status(200).send(tryOnJobResponseSchema.parse(response));
    } catch (error) {
      return sendTryOnError(reply, error);
    }
  });

  app.post("/jobs/:jobId/cancel", { preHandler: requireUserAuth }, async (request, reply) => {
    const parsedParams = tryOnJobParamsSchema.safeParse(request.params);

    if (!parsedParams.success) {
      return sendValidationError(reply, parsedParams.error);
    }

    try {
      const response = await cancelTryOnJob(
        app.prisma,
        getAuthenticatedUserId(request),
        parsedParams.data.jobId
      );

      return reply.status(200).send(tryOnJobResponseSchema.parse(response));
    } catch (error) {
      return sendTryOnError(reply, error);
    }
  });

  app.delete("/jobs/:jobId", { preHandler: requireUserAuth }, async (request, reply) => {
    const parsedParams = tryOnJobParamsSchema.safeParse(request.params);

    if (!parsedParams.success) {
      return sendValidationError(reply, parsedParams.error);
    }

    try {
      const response = await deleteTryOnJob(
        app.prisma,
        getAuthenticatedUserId(request),
        parsedParams.data.jobId
      );

      return reply.status(200).send(deleteTryOnJobResponseSchema.parse(response));
    } catch (error) {
      return sendTryOnError(reply, error);
    }
  });

  done();
};

export default tryOnRoutes;
