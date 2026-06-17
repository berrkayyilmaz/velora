import type { PrismaClient } from "@prisma/client";

import { findUserById, updateUserProfile } from "../repositories/user.repository.js";
import type { UserProfileResponse } from "../schemas/auth.schemas.js";
import type { UpdateProfileRequest } from "../schemas/profile.schemas.js";

type ProfileUserRecord = {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export class ProfileServiceError extends Error {
  constructor(
    readonly code: string,
    readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "ProfileServiceError";
  }
}

function toUserProfile(user: ProfileUserRecord): UserProfileResponse {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  };
}

export async function getUserProfile(
  prisma: PrismaClient,
  userId: string
): Promise<UserProfileResponse> {
  const user = await findUserById(prisma, userId);

  if (user === null) {
    throw new ProfileServiceError("PROFILE_NOT_FOUND", 404, "Profile was not found.");
  }

  return toUserProfile(user);
}

export async function updateProfile(
  prisma: PrismaClient,
  userId: string,
  input: UpdateProfileRequest
): Promise<UserProfileResponse> {
  const user = await updateUserProfile(prisma, userId, input);

  return toUserProfile(user);
}
