import type { FastifyPluginCallback, FastifyReply, FastifyRequest } from "fastify";
import type { ZodError } from "zod";

import { requireUserAuth } from "../middleware/auth.middleware.js";
import {
  addWishlistItemRequestSchema,
  deleteWishlistItemResponseSchema,
  wishlistItemParamsSchema,
  wishlistItemResponseSchema,
  wishlistQuerySchema,
  wishlistResponseSchema
} from "../schemas/wishlist.schemas.js";
import {
  addWishlistItem,
  getWishlist,
  removeWishlistItem,
  WishlistServiceError
} from "../services/wishlist.service.js";

function sendValidationError(reply: FastifyReply, error: ZodError): FastifyReply {
  return reply.status(400).send({
    error: {
      code: "VALIDATION_ERROR",
      message: "Invalid request.",
      details: error.flatten()
    }
  });
}

function sendWishlistError(reply: FastifyReply, error: unknown): FastifyReply {
  if (error instanceof WishlistServiceError) {
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
    throw new WishlistServiceError("UNAUTHORIZED", 401, "Authentication is required.");
  }

  return request.user.id;
}

const wishlistRoutes: FastifyPluginCallback = (app, _options, done) => {
  app.get("/", { preHandler: requireUserAuth }, async (request, reply) => {
    const parsedQuery = wishlistQuerySchema.safeParse(request.query);

    if (!parsedQuery.success) {
      return sendValidationError(reply, parsedQuery.error);
    }

    try {
      const wishlist = await getWishlist(
        app.prisma,
        getAuthenticatedUserId(request),
        parsedQuery.data
      );
      const response = wishlistResponseSchema.parse(wishlist);

      return reply.status(200).send(response);
    } catch (error) {
      return sendWishlistError(reply, error);
    }
  });

  app.post("/items", { preHandler: requireUserAuth }, async (request, reply) => {
    const parsedBody = addWishlistItemRequestSchema.safeParse(request.body);

    if (!parsedBody.success) {
      return sendValidationError(reply, parsedBody.error);
    }

    try {
      const result = await addWishlistItem(
        app.prisma,
        getAuthenticatedUserId(request),
        parsedBody.data.productId
      );
      const response = wishlistItemResponseSchema.parse(result.response);

      return reply.status(result.created ? 201 : 200).send(response);
    } catch (error) {
      return sendWishlistError(reply, error);
    }
  });

  app.delete("/items/:productId", { preHandler: requireUserAuth }, async (request, reply) => {
    const parsedParams = wishlistItemParamsSchema.safeParse(request.params);

    if (!parsedParams.success) {
      return sendValidationError(reply, parsedParams.error);
    }

    try {
      const result = await removeWishlistItem(
        app.prisma,
        getAuthenticatedUserId(request),
        parsedParams.data.productId
      );
      const response = deleteWishlistItemResponseSchema.parse(result);

      return reply.status(200).send(response);
    } catch (error) {
      return sendWishlistError(reply, error);
    }
  });

  done();
};

export default wishlistRoutes;
