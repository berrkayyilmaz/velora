import { type PrismaClient, WardrobeItemStatus } from "@prisma/client";

import { findFavoritedProductIds } from "../repositories/product.repository.js";
import {
  createOutfitProduct,
  createOutfitWardrobeItem,
  createUserOutfit,
  deleteOutfitProductByProduct,
  deleteOutfitWardrobeItem,
  deleteUserOutfit,
  findActiveProductsForOutfit,
  findOutfitProductByProduct,
  findOutfitWardrobeItem,
  findUserWardrobeItemForOutfit,
  findUserOutfitById,
  isUniqueConstraintError,
  listUserOutfits,
  updateUserOutfit,
  type OutfitDetailRecord,
  type OutfitSummaryRecord,
  type ProductSummaryRecord
} from "../repositories/outfit.repository.js";
import type {
  CatalogRecordResponse,
  CreateOutfitRequest,
  DeleteOutfitResponse,
  OutfitDetailResponse,
  OutfitListQuery,
  OutfitListResponse,
  OutfitSummaryResponse,
  ProductSummaryResponse,
  UpdateOutfitRequest
} from "../schemas/outfit.schemas.js";

export class OutfitServiceError extends Error {
  constructor(
    readonly code: string,
    readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "OutfitServiceError";
  }
}

export type OutfitProductMutationResult = {
  response: OutfitDetailResponse;
  created: boolean;
};

export type OutfitWardrobeItemMutationResult = {
  response: OutfitDetailResponse;
  created: boolean;
};

function toProductSummary(
  product: ProductSummaryRecord,
  favoritedProductIds: Set<string>
): ProductSummaryResponse {
  return {
    id: product.id,
    title: product.title,
    brand: product.brand,
    category: product.category,
    sourcePlatform: product.sourcePlatform,
    price: product.price.toString(),
    imageUrl: product.imageUrl,
    color: product.color,
    isFavorited: favoritedProductIds.has(product.id)
  };
}

function uniqueCategories(products: ProductSummaryRecord[]): CatalogRecordResponse[] {
  const categories = new Map<string, CatalogRecordResponse>();

  for (const product of products) {
    categories.set(product.category.id, product.category);
  }

  return [...categories.values()];
}

function buildMissingCategoryHints(products: ProductSummaryRecord[]): string[] {
  if (products.length === 0) {
    return [];
  }

  const includedCategoryNames = new Set(
    products.map((product) => product.category.name.toLowerCase())
  );
  const hints: string[] = [];

  if (!includedCategoryNames.has("shoes")) {
    hints.push("No shoes added");
  }

  if (!includedCategoryNames.has("bags")) {
    hints.push("No bag added");
  }

  return hints;
}

function getOutfitProducts(
  outfit: OutfitDetailRecord | OutfitSummaryRecord
): ProductSummaryRecord[] {
  return outfit.products.map((outfitProduct) => outfitProduct.product);
}

function toOutfitSummary(
  outfit: OutfitSummaryRecord,
  favoritedProductIds: Set<string>
): OutfitSummaryResponse {
  const products = getOutfitProducts(outfit);

  return {
    id: outfit.id,
    name: outfit.name,
    productCount: outfit._count.products,
    productsPreview: products.map((product) => toProductSummary(product, favoritedProductIds)),
    createdAt: outfit.createdAt.toISOString(),
    updatedAt: outfit.updatedAt.toISOString()
  };
}

function toOutfitDetail(
  outfit: OutfitDetailRecord,
  favoritedProductIds: Set<string>
): OutfitDetailResponse {
  const products = getOutfitProducts(outfit);

  return {
    id: outfit.id,
    name: outfit.name,
    productCount: outfit._count.products,
    productsPreview: products
      .slice(0, 4)
      .map((product) => toProductSummary(product, favoritedProductIds)),
    products: products.map((product) => toProductSummary(product, favoritedProductIds)),
    includedCategories: uniqueCategories(products),
    missingCategoryHints: buildMissingCategoryHints(products),
    createdAt: outfit.createdAt.toISOString(),
    updatedAt: outfit.updatedAt.toISOString()
  };
}

async function findFavoritedIdsForProducts(
  prisma: PrismaClient,
  userId: string,
  products: ProductSummaryRecord[]
): Promise<Set<string>> {
  return new Set(
    await findFavoritedProductIds(
      prisma,
      userId,
      products.map((product) => product.id)
    )
  );
}

async function validateActiveProducts(prisma: PrismaClient, productIds: string[]): Promise<void> {
  if (productIds.length === 0) {
    return;
  }

  const activeProducts = await findActiveProductsForOutfit(prisma, productIds);

  if (activeProducts.length !== productIds.length) {
    throw new OutfitServiceError("PRODUCT_NOT_FOUND", 404, "One or more products were not found.");
  }
}

async function getOwnedOutfitOrThrow(
  prisma: PrismaClient,
  userId: string,
  outfitId: string
): Promise<OutfitDetailRecord> {
  const outfit = await findUserOutfitById(prisma, userId, outfitId);

  if (outfit === null) {
    throw new OutfitServiceError("OUTFIT_NOT_FOUND", 404, "Outfit was not found.");
  }

  return outfit;
}

export async function listOutfits(
  prisma: PrismaClient,
  userId: string,
  query: OutfitListQuery
): Promise<OutfitListResponse> {
  const { outfits, total } = await listUserOutfits(prisma, userId, query);
  const products = outfits.flatMap(getOutfitProducts);
  const favoritedProductIds = await findFavoritedIdsForProducts(prisma, userId, products);

  return {
    data: {
      items: outfits.map((outfit) => toOutfitSummary(outfit, favoritedProductIds))
    },
    meta: {
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        hasNextPage: query.page * query.pageSize < total
      }
    }
  };
}

export async function createOutfit(
  prisma: PrismaClient,
  userId: string,
  input: CreateOutfitRequest
): Promise<OutfitDetailResponse> {
  const productIds = input.productIds ?? [];
  await validateActiveProducts(prisma, productIds);

  const outfit = await createUserOutfit(prisma, userId, {
    name: input.name,
    productIds
  });
  const products = getOutfitProducts(outfit);
  const favoritedProductIds = await findFavoritedIdsForProducts(prisma, userId, products);

  return toOutfitDetail(outfit, favoritedProductIds);
}

export async function getOutfitDetail(
  prisma: PrismaClient,
  userId: string,
  outfitId: string
): Promise<OutfitDetailResponse> {
  const outfit = await getOwnedOutfitOrThrow(prisma, userId, outfitId);
  const products = getOutfitProducts(outfit);
  const favoritedProductIds = await findFavoritedIdsForProducts(prisma, userId, products);

  return toOutfitDetail(outfit, favoritedProductIds);
}

export async function updateOutfit(
  prisma: PrismaClient,
  userId: string,
  outfitId: string,
  input: UpdateOutfitRequest
): Promise<OutfitDetailResponse> {
  const outfit = await updateUserOutfit(prisma, userId, outfitId, input);

  if (outfit === null) {
    throw new OutfitServiceError("OUTFIT_NOT_FOUND", 404, "Outfit was not found.");
  }

  const products = getOutfitProducts(outfit);
  const favoritedProductIds = await findFavoritedIdsForProducts(prisma, userId, products);

  return toOutfitDetail(outfit, favoritedProductIds);
}

export async function deleteOutfit(
  prisma: PrismaClient,
  userId: string,
  outfitId: string
): Promise<DeleteOutfitResponse> {
  const deletedCount = await deleteUserOutfit(prisma, userId, outfitId);

  if (deletedCount === 0) {
    throw new OutfitServiceError("OUTFIT_NOT_FOUND", 404, "Outfit was not found.");
  }

  return {
    data: {
      success: true
    }
  };
}

export async function addProductToOutfit(
  prisma: PrismaClient,
  userId: string,
  outfitId: string,
  productId: string
): Promise<OutfitProductMutationResult> {
  await getOwnedOutfitOrThrow(prisma, userId, outfitId);
  await validateActiveProducts(prisma, [productId]);

  const existingOutfitProduct = await findOutfitProductByProduct(prisma, outfitId, productId);

  if (existingOutfitProduct !== null) {
    return {
      response: await getOutfitDetail(prisma, userId, outfitId),
      created: false
    };
  }

  try {
    await createOutfitProduct(prisma, outfitId, productId);
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }

    return {
      response: await getOutfitDetail(prisma, userId, outfitId),
      created: false
    };
  }

  return {
    response: await getOutfitDetail(prisma, userId, outfitId),
    created: true
  };
}

export async function removeProductFromOutfit(
  prisma: PrismaClient,
  userId: string,
  outfitId: string,
  productId: string
): Promise<OutfitDetailResponse> {
  await getOwnedOutfitOrThrow(prisma, userId, outfitId);

  const deletedCount = await deleteOutfitProductByProduct(prisma, outfitId, productId);

  if (deletedCount === 0) {
    throw new OutfitServiceError(
      "OUTFIT_PRODUCT_NOT_FOUND",
      404,
      "Product was not found in the outfit."
    );
  }

  return getOutfitDetail(prisma, userId, outfitId);
}

async function getOwnedWardrobeItemOrThrow(
  prisma: PrismaClient,
  userId: string,
  wardrobeItemId: string
) {
  const wardrobeItem = await findUserWardrobeItemForOutfit(prisma, userId, wardrobeItemId);

  if (wardrobeItem === null) {
    throw new OutfitServiceError("WARDROBE_ITEM_NOT_FOUND", 404, "Wardrobe item was not found.");
  }

  return wardrobeItem;
}

export async function addWardrobeItemToOutfit(
  prisma: PrismaClient,
  userId: string,
  outfitId: string,
  wardrobeItemId: string
): Promise<OutfitWardrobeItemMutationResult> {
  await getOwnedOutfitOrThrow(prisma, userId, outfitId);
  const wardrobeItem = await getOwnedWardrobeItemOrThrow(prisma, userId, wardrobeItemId);

  if (wardrobeItem.status !== WardrobeItemStatus.ACTIVE || wardrobeItem.media.length === 0) {
    throw new OutfitServiceError(
      "WARDROBE_ITEM_NOT_ELIGIBLE",
      409,
      "Only active wardrobe items with primary media can be added to outfits."
    );
  }

  const existingItem = await findOutfitWardrobeItem(prisma, outfitId, wardrobeItemId);

  if (existingItem !== null) {
    return {
      response: await getOutfitDetail(prisma, userId, outfitId),
      created: false
    };
  }

  try {
    await createOutfitWardrobeItem(prisma, outfitId, wardrobeItemId);
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }

    return {
      response: await getOutfitDetail(prisma, userId, outfitId),
      created: false
    };
  }

  return {
    response: await getOutfitDetail(prisma, userId, outfitId),
    created: true
  };
}

export async function removeWardrobeItemFromOutfit(
  prisma: PrismaClient,
  userId: string,
  outfitId: string,
  wardrobeItemId: string
): Promise<OutfitDetailResponse> {
  await getOwnedOutfitOrThrow(prisma, userId, outfitId);
  await getOwnedWardrobeItemOrThrow(prisma, userId, wardrobeItemId);

  const deletedCount = await deleteOutfitWardrobeItem(prisma, outfitId, wardrobeItemId);

  if (deletedCount === 0) {
    throw new OutfitServiceError(
      "OUTFIT_WARDROBE_ITEM_NOT_FOUND",
      404,
      "Wardrobe item was not found in the outfit."
    );
  }

  return getOutfitDetail(prisma, userId, outfitId);
}
