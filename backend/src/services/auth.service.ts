import type { PrismaClient } from "@prisma/client";

import { createAnalyticsEvent } from "../repositories/analytics.repository.js";
import {
  createPasswordResetToken,
  findPasswordResetTokenByHash,
  markPasswordResetTokenUsed,
  markUnusedPasswordResetTokensUsedForUser
} from "../repositories/password-reset.repository.js";
import {
  createUserWithDefaultWishlist,
  findUserByEmail,
  isUniqueConstraintError,
  updateUserPasswordHash,
  type AuthUserRecord
} from "../repositories/user.repository.js";
import type {
  LoginRequest,
  PasswordResetConfirmRequest,
  PasswordResetConfirmResponse,
  PasswordResetRequest,
  PasswordResetRequestResponse,
  RegisterRequest,
  UserProfileResponse
} from "../schemas/auth.schemas.js";
import { env } from "../config/env.js";
import { signAccessToken } from "../utils/jwt.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import {
  generatePasswordResetToken,
  hashPasswordResetToken
} from "../utils/password-reset-token.js";

export type AuthSession = {
  user: UserProfileResponse;
  authToken: string;
};

const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export class AuthServiceError extends Error {
  constructor(
    readonly code: string,
    readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "AuthServiceError";
  }
}

function toUserProfile(user: AuthUserRecord): UserProfileResponse {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  };
}

function createAuthSession(user: AuthUserRecord): AuthSession {
  return {
    user: toUserProfile(user),
    authToken: signAccessToken({
      sub: user.id,
      email: user.email,
      tokenType: "access",
      subjectType: "user"
    })
  };
}

export async function registerUser(
  prisma: PrismaClient,
  input: RegisterRequest
): Promise<AuthSession> {
  const existingUser = await findUserByEmail(prisma, input.email);

  if (existingUser !== null) {
    throw new AuthServiceError("EMAIL_ALREADY_REGISTERED", 409, "Email is already registered.");
  }

  const passwordHash = await hashPassword(input.password);

  try {
    const user = await createUserWithDefaultWishlist(prisma, {
      email: input.email,
      passwordHash,
      ...(input.displayName === undefined ? {} : { displayName: input.displayName })
    });

    return createAuthSession(user);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AuthServiceError("EMAIL_ALREADY_REGISTERED", 409, "Email is already registered.");
    }

    throw error;
  }
}

export async function loginUser(prisma: PrismaClient, input: LoginRequest): Promise<AuthSession> {
  const user = await findUserByEmail(prisma, input.email);

  if (user === null) {
    throw new AuthServiceError("INVALID_CREDENTIALS", 401, "Invalid email or password.");
  }

  const isValidPassword = await verifyPassword(input.password, user.passwordHash);

  if (!isValidPassword) {
    throw new AuthServiceError("INVALID_CREDENTIALS", 401, "Invalid email or password.");
  }

  return createAuthSession(user);
}

async function recordPasswordResetRequested(prisma: PrismaClient, userId: string): Promise<void> {
  try {
    await createAnalyticsEvent(prisma, {
      userId,
      eventType: "password_reset_requested"
    });
  } catch {
    // Password reset must remain available even if analytics storage fails.
  }
}

export async function requestPasswordReset(
  prisma: PrismaClient,
  input: PasswordResetRequest
): Promise<PasswordResetRequestResponse> {
  const user = await findUserByEmail(prisma, input.email);

  if (user === null) {
    return {
      data: {
        accepted: true
      }
    };
  }

  const resetToken = generatePasswordResetToken();
  const tokenHash = hashPasswordResetToken(resetToken);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS);

  await markUnusedPasswordResetTokensUsedForUser(prisma, user.id, new Date());
  await createPasswordResetToken(prisma, {
    userId: user.id,
    tokenHash,
    expiresAt
  });
  await recordPasswordResetRequested(prisma, user.id);

  return {
    data: {
      accepted: true,
      ...(env.NODE_ENV === "development" ? { resetToken } : {})
    }
  };
}

export async function confirmPasswordReset(
  prisma: PrismaClient,
  input: PasswordResetConfirmRequest
): Promise<PasswordResetConfirmResponse> {
  const tokenHash = hashPasswordResetToken(input.token);
  const resetToken = await findPasswordResetTokenByHash(prisma, tokenHash);
  const now = new Date();

  if (resetToken === null || resetToken.usedAt !== null || resetToken.expiresAt <= now) {
    throw new AuthServiceError("INVALID_RESET_TOKEN", 400, "Reset token is invalid or expired.");
  }

  const passwordHash = await hashPassword(input.newPassword);

  await prisma.$transaction(async (tx) => {
    await updateUserPasswordHash(tx, resetToken.userId, passwordHash);
    await markPasswordResetTokenUsed(tx, resetToken.id, now);
    await markUnusedPasswordResetTokensUsedForUser(tx, resetToken.userId, now);
  });

  return {
    data: {
      success: true
    }
  };
}
