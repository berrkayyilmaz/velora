import { createHash, randomBytes } from "node:crypto";

const RESET_TOKEN_BYTE_LENGTH = 32;

export function generatePasswordResetToken(): string {
  return randomBytes(RESET_TOKEN_BYTE_LENGTH).toString("base64url");
}

export function hashPasswordResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
