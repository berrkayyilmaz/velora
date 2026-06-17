import { Prisma, type PrismaClient } from "@prisma/client";

const authUserSelect = {
  id: true,
  email: true,
  passwordHash: true,
  displayName: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.UserSelect;

export type AuthUserRecord = Prisma.UserGetPayload<{
  select: typeof authUserSelect;
}>;

type CreateUserInput = {
  email: string;
  passwordHash: string;
  displayName?: string;
};

type UpdateUserProfileInput = {
  displayName?: string | null;
};

export async function findUserByEmail(
  prisma: PrismaClient,
  email: string
): Promise<AuthUserRecord | null> {
  return prisma.user.findUnique({
    where: { email },
    select: authUserSelect
  });
}

export async function findUserById(
  prisma: PrismaClient,
  userId: string
): Promise<AuthUserRecord | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: authUserSelect
  });
}

export async function createUserWithDefaultWishlist(
  prisma: PrismaClient,
  input: CreateUserInput
): Promise<AuthUserRecord> {
  return prisma.user.create({
    data: {
      email: input.email,
      passwordHash: input.passwordHash,
      ...(input.displayName === undefined ? {} : { displayName: input.displayName }),
      wishlist: {
        create: {}
      }
    },
    select: authUserSelect
  });
}

export async function updateUserProfile(
  prisma: PrismaClient,
  userId: string,
  input: UpdateUserProfileInput
): Promise<AuthUserRecord> {
  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.displayName === undefined ? {} : { displayName: input.displayName })
    },
    select: authUserSelect
  });
}

export function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}
