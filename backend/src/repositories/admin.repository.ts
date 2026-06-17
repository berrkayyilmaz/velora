import type { Prisma, PrismaClient } from "@prisma/client";

const adminUserSelect = {
  id: true,
  email: true,
  passwordHash: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.AdminUserSelect;

export type AdminUserRecord = Prisma.AdminUserGetPayload<{
  select: typeof adminUserSelect;
}>;

export async function findAdminUserByEmail(
  prisma: PrismaClient,
  email: string
): Promise<AdminUserRecord | null> {
  return prisma.adminUser.findUnique({
    where: { email },
    select: adminUserSelect
  });
}

export async function findAdminUserById(
  prisma: PrismaClient,
  adminUserId: string
): Promise<AdminUserRecord | null> {
  return prisma.adminUser.findUnique({
    where: { id: adminUserId },
    select: adminUserSelect
  });
}
