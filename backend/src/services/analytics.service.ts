import type { PrismaClient } from "@prisma/client";

import {
  createAnalyticsEvent,
  findOwnedOutfitForAnalytics,
  findProductForAnalytics
} from "../repositories/analytics.repository.js";
import type {
  AnalyticsEventResponse,
  CreateAnalyticsEventRequest
} from "../schemas/analytics.schemas.js";

export class AnalyticsServiceError extends Error {
  constructor(
    readonly code: string,
    readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "AnalyticsServiceError";
  }
}

export async function recordAnalyticsEvent(
  prisma: PrismaClient,
  userId: string,
  input: CreateAnalyticsEventRequest
): Promise<AnalyticsEventResponse> {
  if (input.productId !== undefined) {
    const product = await findProductForAnalytics(prisma, input.productId);

    if (product === null) {
      throw new AnalyticsServiceError("PRODUCT_NOT_FOUND", 404, "Product was not found.");
    }
  }

  if (input.outfitId !== undefined) {
    const outfit = await findOwnedOutfitForAnalytics(prisma, userId, input.outfitId);

    if (outfit === null) {
      throw new AnalyticsServiceError("OUTFIT_NOT_FOUND", 404, "Outfit was not found.");
    }
  }

  const event = await createAnalyticsEvent(prisma, {
    userId,
    eventType: input.eventType,
    ...(input.productId === undefined ? {} : { productId: input.productId }),
    ...(input.outfitId === undefined ? {} : { outfitId: input.outfitId }),
    ...(input.sourceScreen === undefined ? {} : { sourceScreen: input.sourceScreen })
  });

  return {
    data: {
      accepted: true,
      eventId: event.id
    }
  };
}
