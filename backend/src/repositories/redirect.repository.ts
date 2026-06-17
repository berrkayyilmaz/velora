import type { Prisma, PrismaClient } from "@prisma/client";

import type { RedirectSourceScreen } from "../schemas/redirect.schemas.js";

const activeProductRedirectSelect = {
  id: true,
  productUrl: true,
  sourcePlatformId: true
} satisfies Prisma.ProductSelect;

const redirectEventSelect = {
  id: true,
  createdAt: true
} satisfies Prisma.RedirectEventSelect;

export type ActiveProductRedirectRecord = Prisma.ProductGetPayload<{
  select: typeof activeProductRedirectSelect;
}>;

export type RedirectEventRecord = Prisma.RedirectEventGetPayload<{
  select: typeof redirectEventSelect;
}>;

type CreateRedirectEventInput = {
  userId: string;
  productId: string;
  outfitId?: string;
  sourcePlatformId: string;
  sourceScreen: RedirectSourceScreen;
};

export async function findActiveProductForRedirect(
  prisma: PrismaClient,
  productId: string
): Promise<ActiveProductRedirectRecord | null> {
  return prisma.product.findFirst({
    where: {
      id: productId,
      isActive: true
    },
    select: activeProductRedirectSelect
  });
}

export async function findOwnedOutfitForRedirect(
  prisma: PrismaClient,
  userId: string,
  outfitId: string
): Promise<{ id: string } | null> {
  return prisma.outfit.findFirst({
    where: {
      id: outfitId,
      userId
    },
    select: {
      id: true
    }
  });
}

export async function createRedirectEvent(
  prisma: PrismaClient,
  input: CreateRedirectEventInput
): Promise<RedirectEventRecord> {
  return prisma.redirectEvent.create({
    data: {
      userId: input.userId,
      productId: input.productId,
      ...(input.outfitId === undefined ? {} : { outfitId: input.outfitId }),
      sourcePlatformId: input.sourcePlatformId,
      sourceScreen: input.sourceScreen
    },
    select: redirectEventSelect
  });
}
