import type { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from "fastify";

import { verifyAccessToken } from "../utils/jwt.js";

function extractBearerToken(authorizationHeader: string | undefined): string | null {
  if (authorizationHeader === undefined) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme !== "Bearer" || token === undefined || token.trim() === "") {
    return null;
  }

  return token;
}

export function requireAdminAuth(
  request: FastifyRequest,
  reply: FastifyReply,
  done: HookHandlerDoneFunction
): void {
  const token = extractBearerToken(request.headers.authorization);

  if (token === null) {
    reply.status(401).send({
      error: {
        code: "UNAUTHORIZED",
        message: "Admin authentication is required."
      }
    });
    return;
  }

  try {
    const payload = verifyAccessToken(token);

    if (payload.subjectType !== "admin") {
      reply.status(401).send({
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid or expired admin access token."
        }
      });
      return;
    }

    request.admin = {
      id: payload.sub,
      email: payload.email
    };

    done();
  } catch {
    reply.status(401).send({
      error: {
        code: "UNAUTHORIZED",
        message: "Invalid or expired admin access token."
      }
    });
  }
}
