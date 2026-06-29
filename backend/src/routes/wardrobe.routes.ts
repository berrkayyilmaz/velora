import type { FastifyPluginCallback, FastifyReply, FastifyRequest } from "fastify";
import type { ZodError } from "zod";

import { requireUserAuth } from "../middleware/auth.middleware.js";
import {
  createWardrobeItemRequestSchema,
  deleteWardrobeItemResponseSchema,
  updateWardrobeItemRequestSchema,
  wardrobeItemParamsSchema,
  wardrobeItemResponseSchema,
  wardrobeListQuerySchema,
  wardrobeListResponseSchema
} from "../schemas/wardrobe.schemas.js";
import {
  createWardrobeItem,
  deleteWardrobeItem,
  getWardrobeItem,
  listWardrobeItems,
  updateWardrobeItem,
  WardrobeServiceError
} from "../services/wardrobe.service.js";

function sendValidationError(reply: FastifyReply, error: ZodError): FastifyReply {
  return reply.status(400).send({
    error: {
      code: "VALIDATION_ERROR",
      message: "Invalid request.",
      details: error.flatten()
    }
  });
}

function sendWardrobeError(reply: FastifyReply, error: unknown): FastifyReply {
  if (error instanceof WardrobeServiceError) {
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
    throw new WardrobeServiceError("UNAUTHORIZED", 401, "Authentication is required.");
  }

  return request.user.id;
}

const wardrobeRoutes: FastifyPluginCallback = (app, _options, done) => {
  app.get("/", { preHandler: requireUserAuth }, async (request, reply) => {
    const parsedQuery = wardrobeListQuerySchema.safeParse(request.query);

    if (!parsedQuery.success) {
      return sendValidationError(reply, parsedQuery.error);
    }

    try {
      const response = await listWardrobeItems(
        app.prisma,
        app.wardrobeMediaStorage,
        getAuthenticatedUserId(request),
        parsedQuery.data
      );

      return reply.status(200).send(wardrobeListResponseSchema.parse(response));
    } catch (error) {
      return sendWardrobeError(reply, error);
    }
  });

  app.post("/", { preHandler: requireUserAuth }, async (request, reply) => {
    const parsedBody = createWardrobeItemRequestSchema.safeParse(request.body);

    if (!parsedBody.success) {
      return sendValidationError(reply, parsedBody.error);
    }

    try {
      const response = await createWardrobeItem(
        app.prisma,
        app.wardrobeMediaStorage,
        getAuthenticatedUserId(request),
        parsedBody.data
      );

      return reply.status(201).send(wardrobeItemResponseSchema.parse(response));
    } catch (error) {
      return sendWardrobeError(reply, error);
    }
  });

  app.get("/:id", { preHandler: requireUserAuth }, async (request, reply) => {
    const parsedParams = wardrobeItemParamsSchema.safeParse(request.params);

    if (!parsedParams.success) {
      return sendValidationError(reply, parsedParams.error);
    }

    try {
      const response = await getWardrobeItem(
        app.prisma,
        app.wardrobeMediaStorage,
        getAuthenticatedUserId(request),
        parsedParams.data.id
      );

      return reply.status(200).send(wardrobeItemResponseSchema.parse(response));
    } catch (error) {
      return sendWardrobeError(reply, error);
    }
  });

  app.patch("/:id", { preHandler: requireUserAuth }, async (request, reply) => {
    const parsedParams = wardrobeItemParamsSchema.safeParse(request.params);

    if (!parsedParams.success) {
      return sendValidationError(reply, parsedParams.error);
    }

    const parsedBody = updateWardrobeItemRequestSchema.safeParse(request.body);

    if (!parsedBody.success) {
      return sendValidationError(reply, parsedBody.error);
    }

    try {
      const response = await updateWardrobeItem(
        app.prisma,
        app.wardrobeMediaStorage,
        getAuthenticatedUserId(request),
        parsedParams.data.id,
        parsedBody.data
      );

      return reply.status(200).send(wardrobeItemResponseSchema.parse(response));
    } catch (error) {
      return sendWardrobeError(reply, error);
    }
  });

  app.delete("/:id", { preHandler: requireUserAuth }, async (request, reply) => {
    const parsedParams = wardrobeItemParamsSchema.safeParse(request.params);

    if (!parsedParams.success) {
      return sendValidationError(reply, parsedParams.error);
    }

    try {
      const response = await deleteWardrobeItem(
        app.prisma,
        getAuthenticatedUserId(request),
        parsedParams.data.id
      );

      return reply.status(200).send(deleteWardrobeItemResponseSchema.parse(response));
    } catch (error) {
      return sendWardrobeError(reply, error);
    }
  });

  done();
};

export default wardrobeRoutes;
