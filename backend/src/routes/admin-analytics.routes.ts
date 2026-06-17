import type { FastifyPluginCallback, FastifyReply } from "fastify";
import type { ZodError } from "zod";

import { requireAdminAuth } from "../middleware/admin-auth.middleware.js";
import {
  adminAnalyticsEventsQuerySchema,
  adminAnalyticsEventsResponseSchema,
  adminAnalyticsRedirectsQuerySchema,
  adminAnalyticsRedirectsResponseSchema,
  adminAnalyticsSummaryQuerySchema,
  adminAnalyticsSummaryResponseSchema
} from "../schemas/admin-analytics.schemas.js";
import {
  getAdminAnalyticsSummary,
  listAdminAnalyticsEvents,
  listAdminAnalyticsRedirects
} from "../services/admin-analytics.service.js";

function sendValidationError(reply: FastifyReply, error: ZodError): FastifyReply {
  return reply.status(400).send({
    error: {
      code: "VALIDATION_ERROR",
      message: "Invalid request.",
      details: error.flatten()
    }
  });
}

const adminAnalyticsRoutes: FastifyPluginCallback = (app, _options, done) => {
  app.addHook("preHandler", requireAdminAuth);

  app.get("/summary", async (request, reply) => {
    const parsedQuery = adminAnalyticsSummaryQuerySchema.safeParse(request.query);

    if (!parsedQuery.success) {
      return sendValidationError(reply, parsedQuery.error);
    }

    const summary = await getAdminAnalyticsSummary(app.prisma, parsedQuery.data);
    const response = adminAnalyticsSummaryResponseSchema.parse(summary);

    return reply.status(200).send(response);
  });

  app.get("/events", async (request, reply) => {
    const parsedQuery = adminAnalyticsEventsQuerySchema.safeParse(request.query);

    if (!parsedQuery.success) {
      return sendValidationError(reply, parsedQuery.error);
    }

    const events = await listAdminAnalyticsEvents(app.prisma, parsedQuery.data);
    const response = adminAnalyticsEventsResponseSchema.parse(events);

    return reply.status(200).send(response);
  });

  app.get("/redirects", async (request, reply) => {
    const parsedQuery = adminAnalyticsRedirectsQuerySchema.safeParse(request.query);

    if (!parsedQuery.success) {
      return sendValidationError(reply, parsedQuery.error);
    }

    const redirects = await listAdminAnalyticsRedirects(app.prisma, parsedQuery.data);
    const response = adminAnalyticsRedirectsResponseSchema.parse(redirects);

    return reply.status(200).send(response);
  });

  done();
};

export default adminAnalyticsRoutes;
