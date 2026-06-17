import type { PrismaClient } from "@prisma/client";

import {
  createRedirectEvent,
  findActiveProductForRedirect,
  findOwnedOutfitForRedirect
} from "../repositories/redirect.repository.js";
import type { CreateRedirectRequest, RedirectResponse } from "../schemas/redirect.schemas.js";

export class RedirectServiceError extends Error {
  constructor(
    readonly code: string,
    readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "RedirectServiceError";
  }
}

export async function createRetailerRedirect(
  prisma: PrismaClient,
  userId: string,
  input: CreateRedirectRequest
): Promise<RedirectResponse> {
  const product = await findActiveProductForRedirect(prisma, input.productId);

  if (product === null) {
    throw new RedirectServiceError("PRODUCT_NOT_FOUND", 404, "Product was not found.");
  }

  if (input.outfitId !== undefined) {
    const outfit = await findOwnedOutfitForRedirect(prisma, userId, input.outfitId);

    if (outfit === null) {
      throw new RedirectServiceError("OUTFIT_NOT_FOUND", 404, "Outfit was not found.");
    }
  }

  const redirectEvent = await createRedirectEvent(prisma, {
    userId,
    productId: product.id,
    ...(input.outfitId === undefined ? {} : { outfitId: input.outfitId }),
    sourcePlatformId: product.sourcePlatformId,
    sourceScreen: input.sourceScreen
  });

  return {
    data: {
      redirectId: redirectEvent.id,
      productUrl: product.productUrl
    }
  };
}
