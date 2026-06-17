import { Prisma, type PrismaClient } from "@prisma/client";

import type { WishlistQuery } from "../schemas/wishlist.schemas.js";

const catalogRecordSelect = {
  id: true,
  name: true,
  slug: true
} as const;

const wishlistItemSelect = {
  id: true,
  createdAt: true,
  product: {
    select: {
      id: true,
      title: true,
      price: true,
      imageUrl: true,
      color: true,
      brand: {
        select: catalogRecordSelect
      },
      category: {
        select: catalogRecordSelect
      },
      sourcePlatform: {
        select: catalogRecordSelect
      }
    }
  }
} satisfies Prisma.WishlistItemSelect;

export type WishlistRecord = {
  id: string;
};

export type WishlistItemRecord = Prisma.WishlistItemGetPayload<{
  select: typeof wishlistItemSelect;
}>;

export type ActiveProductRecord = {
  id: string;
};

export async function getOrCreateWishlistForUser(
  prisma: PrismaClient,
  userId: string
): Promise<WishlistRecord> {
  const existingWishlist = await prisma.wishlist.findUnique({
    where: { userId },
    select: { id: true }
  });

  if (existingWishlist !== null) {
    return existingWishlist;
  }

  try {
    return await prisma.wishlist.create({
      data: { userId },
      select: { id: true }
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }

    const wishlist = await prisma.wishlist.findUnique({
      where: { userId },
      select: { id: true }
    });

    if (wishlist === null) {
      throw error;
    }

    return wishlist;
  }
}

export async function findWishlistItems(
  prisma: PrismaClient,
  wishlistId: string,
  sort: WishlistQuery["sort"]
): Promise<WishlistItemRecord[]> {
  return prisma.wishlistItem.findMany({
    where: { wishlistId },
    select: wishlistItemSelect,
    orderBy: {
      createdAt: sort === "newest" ? "desc" : "asc"
    }
  });
}

export async function findActiveProductForWishlist(
  prisma: PrismaClient,
  productId: string
): Promise<ActiveProductRecord | null> {
  return prisma.product.findFirst({
    where: {
      id: productId,
      isActive: true
    },
    select: {
      id: true
    }
  });
}

export async function findWishlistItemByProduct(
  prisma: PrismaClient,
  wishlistId: string,
  productId: string
): Promise<WishlistItemRecord | null> {
  return prisma.wishlistItem.findUnique({
    where: {
      wishlistId_productId: {
        wishlistId,
        productId
      }
    },
    select: wishlistItemSelect
  });
}

export async function createWishlistItem(
  prisma: PrismaClient,
  wishlistId: string,
  productId: string
): Promise<WishlistItemRecord> {
  return prisma.wishlistItem.create({
    data: {
      wishlistId,
      productId
    },
    select: wishlistItemSelect
  });
}

export async function deleteWishlistItemByProduct(
  prisma: PrismaClient,
  wishlistId: string,
  productId: string
): Promise<number> {
  const result = await prisma.wishlistItem.deleteMany({
    where: {
      wishlistId,
      productId
    }
  });

  return result.count;
}

export function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}
