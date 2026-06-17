import type { FastifyPluginCallback, FastifyReply, FastifyRequest } from "fastify";
import type { ZodError } from "zod";

import { requireUserAuth } from "../middleware/auth.middleware.js";
import {
  addOutfitProductRequestSchema,
  createOutfitRequestSchema,
  deleteOutfitResponseSchema,
  outfitDetailResponseSchema,
  outfitListQuerySchema,
  outfitListResponseSchema,
  outfitParamsSchema,
  outfitProductParamsSchema,
  updateOutfitRequestSchema
} from "../schemas/outfit.schemas.js";
import {
  addProductToOutfit,
  createOutfit,
  deleteOutfit,
  getOutfitDetail,
  listOutfits,
  OutfitServiceError,
  removeProductFromOutfit,
  updateOutfit
} from "../services/outfit.service.js";

function sendValidationError(reply: FastifyReply, error: ZodError): FastifyReply {
  return reply.status(400).send({
    error: {
      code: "VALIDATION_ERROR",
      message: "Invalid request.",
      details: error.flatten()
    }
  });
}

function sendOutfitError(reply: FastifyReply, error: unknown): FastifyReply {
  if (error instanceof OutfitServiceError) {
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
    throw new OutfitServiceError("UNAUTHORIZED", 401, "Authentication is required.");
  }

  return request.user.id;
}

const outfitRoutes: FastifyPluginCallback = (app, _options, done) => {
  app.get("/", { preHandler: requireUserAuth }, async (request, reply) => {
    const parsedQuery = outfitListQuerySchema.safeParse(request.query);

    if (!parsedQuery.success) {
      return sendValidationError(reply, parsedQuery.error);
    }

    try {
      const outfits = await listOutfits(
        app.prisma,
        getAuthenticatedUserId(request),
        parsedQuery.data
      );
      const response = outfitListResponseSchema.parse(outfits);

      return reply.status(200).send(response);
    } catch (error) {
      return sendOutfitError(reply, error);
    }
  });

  app.post("/", { preHandler: requireUserAuth }, async (request, reply) => {
    const parsedBody = createOutfitRequestSchema.safeParse(request.body);

    if (!parsedBody.success) {
      return sendValidationError(reply, parsedBody.error);
    }

    try {
      const outfit = await createOutfit(
        app.prisma,
        getAuthenticatedUserId(request),
        parsedBody.data
      );
      const response = outfitDetailResponseSchema.parse({ data: outfit });

      return reply.status(201).send(response);
    } catch (error) {
      return sendOutfitError(reply, error);
    }
  });

  app.get("/:id", { preHandler: requireUserAuth }, async (request, reply) => {
    const parsedParams = outfitParamsSchema.safeParse(request.params);

    if (!parsedParams.success) {
      return sendValidationError(reply, parsedParams.error);
    }

    try {
      const outfit = await getOutfitDetail(
        app.prisma,
        getAuthenticatedUserId(request),
        parsedParams.data.id
      );
      const response = outfitDetailResponseSchema.parse({ data: outfit });

      return reply.status(200).send(response);
    } catch (error) {
      return sendOutfitError(reply, error);
    }
  });

  app.patch("/:id", { preHandler: requireUserAuth }, async (request, reply) => {
    const parsedParams = outfitParamsSchema.safeParse(request.params);

    if (!parsedParams.success) {
      return sendValidationError(reply, parsedParams.error);
    }

    const parsedBody = updateOutfitRequestSchema.safeParse(request.body);

    if (!parsedBody.success) {
      return sendValidationError(reply, parsedBody.error);
    }

    try {
      const outfit = await updateOutfit(
        app.prisma,
        getAuthenticatedUserId(request),
        parsedParams.data.id,
        parsedBody.data
      );
      const response = outfitDetailResponseSchema.parse({ data: outfit });

      return reply.status(200).send(response);
    } catch (error) {
      return sendOutfitError(reply, error);
    }
  });

  app.delete("/:id", { preHandler: requireUserAuth }, async (request, reply) => {
    const parsedParams = outfitParamsSchema.safeParse(request.params);

    if (!parsedParams.success) {
      return sendValidationError(reply, parsedParams.error);
    }

    try {
      const result = await deleteOutfit(
        app.prisma,
        getAuthenticatedUserId(request),
        parsedParams.data.id
      );
      const response = deleteOutfitResponseSchema.parse(result);

      return reply.status(200).send(response);
    } catch (error) {
      return sendOutfitError(reply, error);
    }
  });

  app.post("/:id/products", { preHandler: requireUserAuth }, async (request, reply) => {
    const parsedParams = outfitParamsSchema.safeParse(request.params);

    if (!parsedParams.success) {
      return sendValidationError(reply, parsedParams.error);
    }

    const parsedBody = addOutfitProductRequestSchema.safeParse(request.body);

    if (!parsedBody.success) {
      return sendValidationError(reply, parsedBody.error);
    }

    try {
      const result = await addProductToOutfit(
        app.prisma,
        getAuthenticatedUserId(request),
        parsedParams.data.id,
        parsedBody.data.productId
      );
      const response = outfitDetailResponseSchema.parse({ data: result.response });

      return reply.status(result.created ? 201 : 200).send(response);
    } catch (error) {
      return sendOutfitError(reply, error);
    }
  });

  app.delete(
    "/:id/products/:productId",
    { preHandler: requireUserAuth },
    async (request, reply) => {
      const parsedParams = outfitProductParamsSchema.safeParse(request.params);

      if (!parsedParams.success) {
        return sendValidationError(reply, parsedParams.error);
      }

      try {
        const outfit = await removeProductFromOutfit(
          app.prisma,
          getAuthenticatedUserId(request),
          parsedParams.data.id,
          parsedParams.data.productId
        );
        const response = outfitDetailResponseSchema.parse({ data: outfit });

        return reply.status(200).send(response);
      } catch (error) {
        return sendOutfitError(reply, error);
      }
    }
  );

  done();
};

export default outfitRoutes;
