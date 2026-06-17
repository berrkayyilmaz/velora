import type { FastifyPluginCallback, FastifyReply, FastifyRequest } from "fastify";
import type { ZodError } from "zod";

import { requireUserAuth } from "../middleware/auth.middleware.js";
import {
  productDetailResponseSchema,
  productListQuerySchema,
  productListResponseSchema,
  productParamsSchema
} from "../schemas/product.schemas.js";
import {
  getProductDetail,
  listProducts,
  ProductServiceError
} from "../services/product.service.js";

function sendValidationError(reply: FastifyReply, error: ZodError): FastifyReply {
  return reply.status(400).send({
    error: {
      code: "VALIDATION_ERROR",
      message: "Invalid request.",
      details: error.flatten()
    }
  });
}

function sendProductError(reply: FastifyReply, error: unknown): FastifyReply {
  if (error instanceof ProductServiceError) {
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
    throw new ProductServiceError("UNAUTHORIZED", 401, "Authentication is required.");
  }

  return request.user.id;
}

const productRoutes: FastifyPluginCallback = (app, _options, done) => {
  app.get("/", { preHandler: requireUserAuth }, async (request, reply) => {
    const parsedQuery = productListQuerySchema.safeParse(request.query);

    if (!parsedQuery.success) {
      return sendValidationError(reply, parsedQuery.error);
    }

    try {
      const products = await listProducts(
        app.prisma,
        getAuthenticatedUserId(request),
        parsedQuery.data
      );
      const response = productListResponseSchema.parse(products);

      return reply.status(200).send(response);
    } catch (error) {
      return sendProductError(reply, error);
    }
  });

  app.get("/:id", { preHandler: requireUserAuth }, async (request, reply) => {
    const parsedParams = productParamsSchema.safeParse(request.params);

    if (!parsedParams.success) {
      return sendValidationError(reply, parsedParams.error);
    }

    try {
      const product = await getProductDetail(
        app.prisma,
        getAuthenticatedUserId(request),
        parsedParams.data.id
      );
      const response = productDetailResponseSchema.parse({ data: product });

      return reply.status(200).send(response);
    } catch (error) {
      return sendProductError(reply, error);
    }
  });

  done();
};

export default productRoutes;
