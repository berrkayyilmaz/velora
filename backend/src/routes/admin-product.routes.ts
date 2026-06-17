import type { FastifyPluginCallback, FastifyReply } from "fastify";
import type { ZodError } from "zod";

import { requireAdminAuth } from "../middleware/admin-auth.middleware.js";
import {
  adminProductDetailResponseSchema,
  adminProductListQuerySchema,
  adminProductListResponseSchema,
  adminProductParamsSchema,
  createAdminProductRequestSchema,
  deleteAdminProductResponseSchema,
  updateAdminProductRequestSchema
} from "../schemas/admin-product.schemas.js";
import {
  AdminProductServiceError,
  createAdminProduct,
  deleteAdminProduct,
  getAdminProduct,
  listAdminProducts,
  updateAdminProduct
} from "../services/admin-product.service.js";

function sendValidationError(reply: FastifyReply, error: ZodError): FastifyReply {
  return reply.status(400).send({
    error: {
      code: "VALIDATION_ERROR",
      message: "Invalid request.",
      details: error.flatten()
    }
  });
}

function sendAdminProductError(reply: FastifyReply, error: unknown): FastifyReply {
  if (error instanceof AdminProductServiceError) {
    return reply.status(error.statusCode).send({
      error: {
        code: error.code,
        message: error.message
      }
    });
  }

  throw error;
}

const adminProductRoutes: FastifyPluginCallback = (app, _options, done) => {
  app.addHook("preHandler", requireAdminAuth);

  app.get("/", async (request, reply) => {
    const parsedQuery = adminProductListQuerySchema.safeParse(request.query);

    if (!parsedQuery.success) {
      return sendValidationError(reply, parsedQuery.error);
    }

    try {
      const products = await listAdminProducts(app.prisma, parsedQuery.data);
      const response = adminProductListResponseSchema.parse(products);

      return reply.status(200).send(response);
    } catch (error) {
      return sendAdminProductError(reply, error);
    }
  });

  app.post("/", async (request, reply) => {
    const parsedBody = createAdminProductRequestSchema.safeParse(request.body);

    if (!parsedBody.success) {
      return sendValidationError(reply, parsedBody.error);
    }

    try {
      const product = await createAdminProduct(app.prisma, parsedBody.data);
      const response = adminProductDetailResponseSchema.parse({ data: product });

      return reply.status(201).send(response);
    } catch (error) {
      return sendAdminProductError(reply, error);
    }
  });

  app.get("/:id", async (request, reply) => {
    const parsedParams = adminProductParamsSchema.safeParse(request.params);

    if (!parsedParams.success) {
      return sendValidationError(reply, parsedParams.error);
    }

    try {
      const product = await getAdminProduct(app.prisma, parsedParams.data.id);
      const response = adminProductDetailResponseSchema.parse({ data: product });

      return reply.status(200).send(response);
    } catch (error) {
      return sendAdminProductError(reply, error);
    }
  });

  app.patch("/:id", async (request, reply) => {
    const parsedParams = adminProductParamsSchema.safeParse(request.params);

    if (!parsedParams.success) {
      return sendValidationError(reply, parsedParams.error);
    }

    const parsedBody = updateAdminProductRequestSchema.safeParse(request.body);

    if (!parsedBody.success) {
      return sendValidationError(reply, parsedBody.error);
    }

    try {
      const product = await updateAdminProduct(app.prisma, parsedParams.data.id, parsedBody.data);
      const response = adminProductDetailResponseSchema.parse({ data: product });

      return reply.status(200).send(response);
    } catch (error) {
      return sendAdminProductError(reply, error);
    }
  });

  app.delete("/:id", async (request, reply) => {
    const parsedParams = adminProductParamsSchema.safeParse(request.params);

    if (!parsedParams.success) {
      return sendValidationError(reply, parsedParams.error);
    }

    try {
      const result = await deleteAdminProduct(app.prisma, parsedParams.data.id);
      const response = deleteAdminProductResponseSchema.parse(result);

      return reply.status(200).send(response);
    } catch (error) {
      return sendAdminProductError(reply, error);
    }
  });

  done();
};

export default adminProductRoutes;
