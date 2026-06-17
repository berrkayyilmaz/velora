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

export function requireUserAuth(
  request: FastifyRequest,
  reply: FastifyReply,
  done: HookHandlerDoneFunction
): void {
  const token = extractBearerToken(request.headers.authorization);

  if (token === null) {
    reply.status(401).send({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication is required."
      }
    });
    return;
  }

  try {
    const payload = verifyAccessToken(token);

    request.user = {
      id: payload.sub,
      email: payload.email
    };

    done();
  } catch {
    reply.status(401).send({
      error: {
        code: "UNAUTHORIZED",
        message: "Invalid or expired access token."
      }
    });
  }
}
