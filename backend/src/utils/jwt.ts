import jwt, { type SignOptions } from "jsonwebtoken";
import { z } from "zod";

import { env } from "../config/env.js";

const accessTokenPayloadSchema = z.object({
  sub: z.string().uuid(),
  email: z.string().email(),
  tokenType: z.literal("access"),
  subjectType: z.enum(["user", "admin"]).default("user")
});

export type AccessTokenPayload = {
  sub: string;
  email: string;
  tokenType: "access";
  subjectType: "user" | "admin";
};

export class JwtVerificationError extends Error {
  constructor() {
    super("Invalid access token.");
    this.name = "JwtVerificationError";
  }
}

export function signAccessToken(payload: AccessTokenPayload): string {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_TOKEN_EXPIRES_IN as SignOptions["expiresIn"]
  };

  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const parsedPayload = accessTokenPayloadSchema.safeParse(decoded);

    if (!parsedPayload.success) {
      throw new JwtVerificationError();
    }

    return parsedPayload.data;
  } catch (error) {
    if (error instanceof JwtVerificationError) {
      throw error;
    }

    throw new JwtVerificationError();
  }
}
