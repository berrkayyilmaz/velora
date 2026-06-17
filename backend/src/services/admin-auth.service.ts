import type { PrismaClient } from "@prisma/client";

import {
  findAdminUserByEmail,
  findAdminUserById,
  type AdminUserRecord
} from "../repositories/admin.repository.js";
import type { AdminLoginRequest, AdminUserResponse } from "../schemas/admin-auth.schemas.js";
import { signAccessToken } from "../utils/jwt.js";
import { verifyPassword } from "../utils/password.js";

export type AdminSession = {
  adminUser: AdminUserResponse;
  authToken: string;
};

export class AdminAuthServiceError extends Error {
  constructor(
    readonly code: string,
    readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "AdminAuthServiceError";
  }
}

function toAdminUserResponse(adminUser: AdminUserRecord): AdminUserResponse {
  return {
    id: adminUser.id,
    email: adminUser.email,
    createdAt: adminUser.createdAt.toISOString(),
    updatedAt: adminUser.updatedAt.toISOString()
  };
}

function createAdminSession(adminUser: AdminUserRecord): AdminSession {
  return {
    adminUser: toAdminUserResponse(adminUser),
    authToken: signAccessToken({
      sub: adminUser.id,
      email: adminUser.email,
      tokenType: "access",
      subjectType: "admin"
    })
  };
}

export async function loginAdmin(
  prisma: PrismaClient,
  input: AdminLoginRequest
): Promise<AdminSession> {
  const adminUser = await findAdminUserByEmail(prisma, input.email);

  if (adminUser === null) {
    throw new AdminAuthServiceError("INVALID_CREDENTIALS", 401, "Invalid email or password.");
  }

  const isValidPassword = await verifyPassword(input.password, adminUser.passwordHash);

  if (!isValidPassword) {
    throw new AdminAuthServiceError("INVALID_CREDENTIALS", 401, "Invalid email or password.");
  }

  return createAdminSession(adminUser);
}

export async function getAdminProfile(
  prisma: PrismaClient,
  adminUserId: string
): Promise<AdminUserResponse> {
  const adminUser = await findAdminUserById(prisma, adminUserId);

  if (adminUser === null) {
    throw new AdminAuthServiceError("ADMIN_NOT_FOUND", 404, "Admin user was not found.");
  }

  return toAdminUserResponse(adminUser);
}
