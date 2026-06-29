import type { FastifyPluginCallback, FastifyReply, FastifyRequest } from "fastify";
import type { ZodError } from "zod";

import { requireUserAuth } from "../middleware/auth.middleware.js";
import {
  deleteWardrobeMediaResponseSchema,
  wardrobeMediaItemParamsSchema,
  wardrobeMediaParamsSchema,
  wardrobeMediaResponseSchema,
  wardrobeMediaTypeSchema
} from "../schemas/wardrobe-media.schemas.js";
import {
  deleteWardrobeMedia,
  uploadWardrobeMedia,
  WardrobeMediaServiceError
} from "../services/wardrobe-media.service.js";

function sendValidationError(reply: FastifyReply, error?: ZodError): FastifyReply {
  return reply.status(400).send({
    error: {
      code: "VALIDATION_ERROR",
      message: "Invalid request.",
      ...(error === undefined ? {} : { details: error.flatten() })
    }
  });
}

function sendWardrobeMediaError(reply: FastifyReply, error: unknown): FastifyReply {
  if (error instanceof WardrobeMediaServiceError) {
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
    throw new WardrobeMediaServiceError("UNAUTHORIZED", 401, "Authentication is required.");
  }

  return request.user.id;
}

const wardrobeMediaRoutes: FastifyPluginCallback = (app, _options, done) => {
  app.post("/:id/media", { preHandler: requireUserAuth }, async (request, reply) => {
    const parsedParams = wardrobeMediaItemParamsSchema.safeParse(request.params);

    if (!parsedParams.success) {
      return sendValidationError(reply, parsedParams.error);
    }

    if (!request.isMultipart()) {
      return reply.status(415).send({
        error: {
          code: "UNSUPPORTED_MEDIA_TYPE",
          message: "A multipart image upload is required."
        }
      });
    }

    const file = await request.file();

    if (file === undefined) {
      return sendValidationError(reply);
    }

    const parsedMediaType = wardrobeMediaTypeSchema.safeParse(file.mimetype);

    if (!parsedMediaType.success) {
      file.file.resume();
      return reply.status(415).send({
        error: {
          code: "UNSUPPORTED_MEDIA_TYPE",
          message: "Only JPEG, PNG, and WebP images are supported."
        }
      });
    }

    const data = await file.toBuffer();

    try {
      const response = await uploadWardrobeMedia(
        app.prisma,
        app.wardrobeMediaStorage,
        getAuthenticatedUserId(request),
        parsedParams.data.id,
        {
          data,
          mediaType: parsedMediaType.data
        }
      );

      return reply.status(201).send(wardrobeMediaResponseSchema.parse(response));
    } catch (error) {
      return sendWardrobeMediaError(reply, error);
    }
  });

  app.delete("/:id/media/:mediaId", { preHandler: requireUserAuth }, async (request, reply) => {
    const parsedParams = wardrobeMediaParamsSchema.safeParse(request.params);

    if (!parsedParams.success) {
      return sendValidationError(reply, parsedParams.error);
    }

    try {
      const response = await deleteWardrobeMedia(
        app.prisma,
        app.wardrobeMediaStorage,
        getAuthenticatedUserId(request),
        parsedParams.data.id,
        parsedParams.data.mediaId
      );

      return reply.status(200).send(deleteWardrobeMediaResponseSchema.parse(response));
    } catch (error) {
      return sendWardrobeMediaError(reply, error);
    }
  });

  done();
};

export default wardrobeMediaRoutes;
