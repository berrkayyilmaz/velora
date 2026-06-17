import type { PrismaClient } from "@prisma/client";

import {
  createWishlistItem,
  deleteWishlistItemByProduct,
  findActiveProductForWishlist,
  findWishlistItemByProduct,
  findWishlistItems,
  getOrCreateWishlistForUser,
  isUniqueConstraintError,
  type WishlistItemRecord
} from "../repositories/wishlist.repository.js";
import type {
  DeleteWishlistItemResponse,
  WishlistItemResponse,
  WishlistItemResponseData,
  WishlistQuery,
  WishlistResponse
} from "../schemas/wishlist.schemas.js";

export class WishlistServiceError extends Error {
  constructor(
    readonly code: string,
    readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "WishlistServiceError";
  }
}

export type AddWishlistItemResult = {
  response: WishlistItemResponse;
  created: boolean;
};

function toWishlistItem(item: WishlistItemRecord): WishlistItemResponseData {
  return {
    id: item.id,
    product: {
      id: item.product.id,
      title: item.product.title,
      brand: item.product.brand,
      category: item.product.category,
      sourcePlatform: item.product.sourcePlatform,
      price: item.product.price.toString(),
      imageUrl: item.product.imageUrl,
      color: item.product.color,
      isFavorited: true
    },
    createdAt: item.createdAt.toISOString()
  };
}

export async function getWishlist(
  prisma: PrismaClient,
  userId: string,
  query: WishlistQuery
): Promise<WishlistResponse> {
  const wishlist = await getOrCreateWishlistForUser(prisma, userId);
  const items = await findWishlistItems(prisma, wishlist.id, query.sort);

  return {
    data: {
      items: items.map(toWishlistItem)
    },
    meta: {
      sort: query.sort
    }
  };
}

export async function addWishlistItem(
  prisma: PrismaClient,
  userId: string,
  productId: string
): Promise<AddWishlistItemResult> {
  const activeProduct = await findActiveProductForWishlist(prisma, productId);

  if (activeProduct === null) {
    throw new WishlistServiceError("PRODUCT_NOT_FOUND", 404, "Product was not found.");
  }

  const wishlist = await getOrCreateWishlistForUser(prisma, userId);
  const existingItem = await findWishlistItemByProduct(prisma, wishlist.id, productId);

  if (existingItem !== null) {
    return {
      response: {
        data: toWishlistItem(existingItem)
      },
      created: false
    };
  }

  try {
    const item = await createWishlistItem(prisma, wishlist.id, productId);

    return {
      response: {
        data: toWishlistItem(item)
      },
      created: true
    };
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }

    const item = await findWishlistItemByProduct(prisma, wishlist.id, productId);

    if (item === null) {
      throw error;
    }

    return {
      response: {
        data: toWishlistItem(item)
      },
      created: false
    };
  }
}

export async function removeWishlistItem(
  prisma: PrismaClient,
  userId: string,
  productId: string
): Promise<DeleteWishlistItemResponse> {
  const wishlist = await getOrCreateWishlistForUser(prisma, userId);
  const deletedCount = await deleteWishlistItemByProduct(prisma, wishlist.id, productId);

  if (deletedCount === 0) {
    throw new WishlistServiceError(
      "WISHLIST_ITEM_NOT_FOUND",
      404,
      "Product was not found in the wishlist."
    );
  }

  return {
    data: {
      success: true
    }
  };
}
