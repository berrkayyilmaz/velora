import type { Prisma, PrismaClient } from "@prisma/client";

import type { AnalyticsEventType } from "../schemas/analytics.schemas.js";

const analyticsEventSelect = {
  id: true,
  createdAt: true
} satisfies Prisma.AnalyticsEventSelect;

export type AnalyticsEventRecord = Prisma.AnalyticsEventGetPayload<{
  select: typeof analyticsEventSelect;
}>;

type CreateAnalyticsEventInput = {
  userId: string;
  eventType: AnalyticsEventType;
  productId?: string;
  outfitId?: string;
  sourceScreen?: string;
};

export async function findProductForAnalytics(
  prisma: PrismaClient,
  productId: string
): Promise<{ id: string } | null> {
  return prisma.product.findUnique({
    where: { id: productId },
    select: { id: true }
  });
}

export async function findOwnedOutfitForAnalytics(
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

export async function createAnalyticsEvent(
  prisma: PrismaClient,
  input: CreateAnalyticsEventInput
): Promise<AnalyticsEventRecord> {
  return prisma.analyticsEvent.create({
    data: {
      userId: input.userId,
      eventType: input.eventType,
      ...(input.productId === undefined ? {} : { productId: input.productId }),
      ...(input.outfitId === undefined ? {} : { outfitId: input.outfitId }),
      ...(input.sourceScreen === undefined ? {} : { sourceScreen: input.sourceScreen })
    },
    select: analyticsEventSelect
  });
}
