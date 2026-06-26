import type { Prisma, PrismaClient } from "@prisma/client";

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

const passwordResetTokenSelect = {
  id: true,
  userId: true,
  expiresAt: true,
  usedAt: true
} satisfies Prisma.PasswordResetTokenSelect;

export type PasswordResetTokenRecord = Prisma.PasswordResetTokenGetPayload<{
  select: typeof passwordResetTokenSelect;
}>;

type CreatePasswordResetTokenInput = {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
};

export async function createPasswordResetToken(
  prisma: PrismaClient,
  input: CreatePasswordResetTokenInput
): Promise<PasswordResetTokenRecord> {
  return prisma.passwordResetToken.create({
    data: input,
    select: passwordResetTokenSelect
  });
}

export async function findPasswordResetTokenByHash(
  prisma: PrismaClient,
  tokenHash: string
): Promise<PasswordResetTokenRecord | null> {
  return prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: passwordResetTokenSelect
  });
}

export async function markPasswordResetTokenUsed(
  prisma: PrismaExecutor,
  tokenId: string,
  usedAt: Date
): Promise<void> {
  await prisma.passwordResetToken.update({
    where: { id: tokenId },
    data: { usedAt }
  });
}

export async function markUnusedPasswordResetTokensUsedForUser(
  prisma: PrismaExecutor,
  userId: string,
  usedAt: Date
): Promise<void> {
  await prisma.passwordResetToken.updateMany({
    where: {
      userId,
      usedAt: null
    },
    data: { usedAt }
  });
}
