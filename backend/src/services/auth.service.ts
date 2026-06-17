import type { PrismaClient } from "@prisma/client";

import {
  createUserWithDefaultWishlist,
  findUserByEmail,
  isUniqueConstraintError,
  type AuthUserRecord
} from "../repositories/user.repository.js";
import type {
  LoginRequest,
  RegisterRequest,
  UserProfileResponse
} from "../schemas/auth.schemas.js";
import { signAccessToken } from "../utils/jwt.js";
import { hashPassword, verifyPassword } from "../utils/password.js";

export type AuthSession = {
  user: UserProfileResponse;
  authToken: string;
};

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
      tokenType: "access"
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
