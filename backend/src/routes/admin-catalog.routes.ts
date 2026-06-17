import type { FastifyPluginCallback, FastifyReply } from "fastify";
import type { ZodError } from "zod";

import { requireAdminAuth } from "../middleware/admin-auth.middleware.js";
import {
  adminCatalogDetailResponseSchema,
  adminCatalogListQuerySchema,
  adminCatalogListResponseSchema,
  adminCatalogParamsSchema,
  adminSourcePlatformDetailResponseSchema,
  adminSourcePlatformListResponseSchema,
  createCatalogRecordRequestSchema,
  createSourcePlatformRequestSchema,
  updateCatalogRecordRequestSchema,
  updateSourcePlatformRequestSchema
} from "../schemas/admin-catalog.schemas.js";
import {
  AdminCatalogServiceError,
  createAdminBrand,
  createAdminCategory,
  createAdminSourcePlatform,
  listAdminBrands,
  listAdminCategories,
  listAdminSourcePlatforms,
  updateAdminBrand,
  updateAdminCategory,
  updateAdminSourcePlatform
} from "../services/admin-catalog.service.js";

function sendValidationError(reply: FastifyReply, error: ZodError): FastifyReply {
  return reply.status(400).send({
    error: {
      code: "VALIDATION_ERROR",
      message: "Invalid request.",
      details: error.flatten()
    }
  });
}

function sendAdminCatalogError(reply: FastifyReply, error: unknown): FastifyReply {
  if (error instanceof AdminCatalogServiceError) {
    return reply.status(error.statusCode).send({
      error: {
        code: error.code,
        message: error.message
      }
    });
  }

  throw error;
}

const adminCatalogRoutes: FastifyPluginCallback = (app, _options, done) => {
  app.addHook("preHandler", requireAdminAuth);

  app.get("/brands", async (request, reply) => {
    const parsedQuery = adminCatalogListQuerySchema.safeParse(request.query);

    if (!parsedQuery.success) {
      return sendValidationError(reply, parsedQuery.error);
    }

    try {
      const brands = await listAdminBrands(app.prisma, parsedQuery.data);
      const response = adminCatalogListResponseSchema.parse(brands);

      return reply.status(200).send(response);
    } catch (error) {
      return sendAdminCatalogError(reply, error);
    }
  });

  app.post("/brands", async (request, reply) => {
    const parsedBody = createCatalogRecordRequestSchema.safeParse(request.body);

    if (!parsedBody.success) {
      return sendValidationError(reply, parsedBody.error);
    }

    try {
      const brand = await createAdminBrand(app.prisma, parsedBody.data);
      const response = adminCatalogDetailResponseSchema.parse({ data: brand });

      return reply.status(201).send(response);
    } catch (error) {
      return sendAdminCatalogError(reply, error);
    }
  });

  app.patch("/brands/:id", async (request, reply) => {
    const parsedParams = adminCatalogParamsSchema.safeParse(request.params);

    if (!parsedParams.success) {
      return sendValidationError(reply, parsedParams.error);
    }

    const parsedBody = updateCatalogRecordRequestSchema.safeParse(request.body);

    if (!parsedBody.success) {
      return sendValidationError(reply, parsedBody.error);
    }

    try {
      const brand = await updateAdminBrand(app.prisma, parsedParams.data.id, parsedBody.data);
      const response = adminCatalogDetailResponseSchema.parse({ data: brand });

      return reply.status(200).send(response);
    } catch (error) {
      return sendAdminCatalogError(reply, error);
    }
  });

  app.get("/categories", async (request, reply) => {
    const parsedQuery = adminCatalogListQuerySchema.safeParse(request.query);

    if (!parsedQuery.success) {
      return sendValidationError(reply, parsedQuery.error);
    }

    try {
      const categories = await listAdminCategories(app.prisma, parsedQuery.data);
      const response = adminCatalogListResponseSchema.parse(categories);

      return reply.status(200).send(response);
    } catch (error) {
      return sendAdminCatalogError(reply, error);
    }
  });

  app.post("/categories", async (request, reply) => {
    const parsedBody = createCatalogRecordRequestSchema.safeParse(request.body);

    if (!parsedBody.success) {
      return sendValidationError(reply, parsedBody.error);
    }

    try {
      const category = await createAdminCategory(app.prisma, parsedBody.data);
      const response = adminCatalogDetailResponseSchema.parse({ data: category });

      return reply.status(201).send(response);
    } catch (error) {
      return sendAdminCatalogError(reply, error);
    }
  });

  app.patch("/categories/:id", async (request, reply) => {
    const parsedParams = adminCatalogParamsSchema.safeParse(request.params);

    if (!parsedParams.success) {
      return sendValidationError(reply, parsedParams.error);
    }

    const parsedBody = updateCatalogRecordRequestSchema.safeParse(request.body);

    if (!parsedBody.success) {
      return sendValidationError(reply, parsedBody.error);
    }

    try {
      const category = await updateAdminCategory(app.prisma, parsedParams.data.id, parsedBody.data);
      const response = adminCatalogDetailResponseSchema.parse({ data: category });

      return reply.status(200).send(response);
    } catch (error) {
      return sendAdminCatalogError(reply, error);
    }
  });

  app.get("/source-platforms", async (request, reply) => {
    const parsedQuery = adminCatalogListQuerySchema.safeParse(request.query);

    if (!parsedQuery.success) {
      return sendValidationError(reply, parsedQuery.error);
    }

    try {
      const sourcePlatforms = await listAdminSourcePlatforms(app.prisma, parsedQuery.data);
      const response = adminSourcePlatformListResponseSchema.parse(sourcePlatforms);

      return reply.status(200).send(response);
    } catch (error) {
      return sendAdminCatalogError(reply, error);
    }
  });

  app.post("/source-platforms", async (request, reply) => {
    const parsedBody = createSourcePlatformRequestSchema.safeParse(request.body);

    if (!parsedBody.success) {
      return sendValidationError(reply, parsedBody.error);
    }

    try {
      const sourcePlatform = await createAdminSourcePlatform(app.prisma, parsedBody.data);
      const response = adminSourcePlatformDetailResponseSchema.parse({ data: sourcePlatform });

      return reply.status(201).send(response);
    } catch (error) {
      return sendAdminCatalogError(reply, error);
    }
  });

  app.patch("/source-platforms/:id", async (request, reply) => {
    const parsedParams = adminCatalogParamsSchema.safeParse(request.params);

    if (!parsedParams.success) {
      return sendValidationError(reply, parsedParams.error);
    }

    const parsedBody = updateSourcePlatformRequestSchema.safeParse(request.body);

    if (!parsedBody.success) {
      return sendValidationError(reply, parsedBody.error);
    }

    try {
      const sourcePlatform = await updateAdminSourcePlatform(
        app.prisma,
        parsedParams.data.id,
        parsedBody.data
      );
      const response = adminSourcePlatformDetailResponseSchema.parse({ data: sourcePlatform });

      return reply.status(200).send(response);
    } catch (error) {
      return sendAdminCatalogError(reply, error);
    }
  });

  done();
};

export default adminCatalogRoutes;
