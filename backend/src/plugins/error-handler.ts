import type { FastifyPluginCallback } from "fastify";
import fp from "fastify-plugin";

const clientErrorDetails: Partial<Record<number, { code: string; message: string }>> = {
  400: { code: "BAD_REQUEST", message: "Invalid request." },
  401: { code: "UNAUTHORIZED", message: "Authentication is required." },
  403: { code: "FORBIDDEN", message: "Access is forbidden." },
  404: { code: "NOT_FOUND", message: "Resource was not found." },
  409: { code: "CONFLICT", message: "The request conflicts with current data." },
  413: { code: "PAYLOAD_TOO_LARGE", message: "Request payload is too large." },
  415: { code: "UNSUPPORTED_MEDIA_TYPE", message: "Unsupported media type." },
  429: { code: "RATE_LIMIT_EXCEEDED", message: "Too many requests. Please try again later." }
};

function getStatusCode(error: unknown): number {
  const statusCode =
    typeof error === "object" && error !== null && "statusCode" in error
      ? error.statusCode
      : undefined;

  if (typeof statusCode === "number" && statusCode >= 400 && statusCode <= 599) {
    return statusCode;
  }

  return 500;
}

const errorHandlerPlugin: FastifyPluginCallback = (app, _options, done) => {
  app.setErrorHandler((error, request, reply) => {
    const statusCode = getStatusCode(error);

    if (statusCode >= 500) {
      request.log.error({ err: error }, "Unhandled request error");
    } else {
      request.log.warn({ err: error, statusCode }, "Request rejected");
    }

    const details =
      clientErrorDetails[statusCode] ??
      (statusCode >= 500
        ? { code: "INTERNAL_SERVER_ERROR", message: "Internal server error." }
        : { code: "REQUEST_FAILED", message: "Request could not be completed." });

    return reply.status(statusCode).send({ error: details });
  });

  app.setNotFoundHandler((_request, reply) =>
    reply.status(404).send({
      error: {
        code: "ROUTE_NOT_FOUND",
        message: "Route was not found."
      }
    })
  );

  done();
};

export default fp(errorHandlerPlugin, {
  name: "error-handler"
});
