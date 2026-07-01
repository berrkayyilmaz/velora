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
  type ProductSummaryRecord,
  type WardrobeItemSummaryRecord
} from "../repositories/outfit.repository.js";
import type {
  CatalogRecordResponse,
  CreateOutfitRequest,
  DeleteOutfitResponse,
  OutfitDetailResponse,
  OutfitListQuery,
  OutfitListResponse,
  OutfitSummaryResponse,
  MixedOutfitItemResponse,
  ProductSummaryResponse,
  UpdateOutfitRequest
} from "../schemas/outfit.schemas.js";
import type { WardrobeMediaStorage } from "./storage/wardrobe-media-storage.js";
import { toWardrobeMedia } from "./wardrobe-media.service.js";

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

function toWardrobeItemSummary(
  wardrobeItem: WardrobeItemSummaryRecord,
  storage: WardrobeMediaStorage
) {
  return {
    id: wardrobeItem.id,
    title: wardrobeItem.title,
    category: wardrobeItem.category,
    color: wardrobeItem.color,
    status: wardrobeItem.status.toLowerCase() as
      | "draft"
      | "active"
      | "archived"
      | "deletion_pending",
    primaryMedia:
      wardrobeItem.media[0] === undefined ? null : toWardrobeMedia(wardrobeItem.media[0], storage)
  };
}

function uniqueCategories(
  products: ProductSummaryRecord[],
  wardrobeItems: WardrobeItemSummaryRecord[]
): CatalogRecordResponse[] {
  const categories = new Map<string, CatalogRecordResponse>();

  for (const product of products) {
    categories.set(product.category.id, product.category);
  }

  for (const wardrobeItem of wardrobeItems) {
    categories.set(wardrobeItem.category.id, wardrobeItem.category);
  }

  return [...categories.values()];
}

function buildMissingCategoryHints(categories: CatalogRecordResponse[]): string[] {
  if (categories.length === 0) {
    return [];
  }

  const includedCategoryNames = new Set(categories.map((category) => category.name.toLowerCase()));
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

function getOutfitWardrobeItems(
  outfit: OutfitDetailRecord | OutfitSummaryRecord
): WardrobeItemSummaryRecord[] {
  return outfit.wardrobeItems.map((outfitWardrobeItem) => outfitWardrobeItem.wardrobeItem);
}

function getMixedOutfitItems(
  outfit: OutfitDetailRecord | OutfitSummaryRecord,
  favoritedProductIds: Set<string>,
  storage: WardrobeMediaStorage
): MixedOutfitItemResponse[] {
  const catalogItems: MixedOutfitItemResponse[] = outfit.products.map((outfitProduct) => ({
    type: "catalog_product",
    id: outfitProduct.id,
    addedAt: outfitProduct.createdAt.toISOString(),
    catalogProduct: toProductSummary(outfitProduct.product, favoritedProductIds)
  }));
  const wardrobeItems: MixedOutfitItemResponse[] = outfit.wardrobeItems.map(
    (outfitWardrobeItem) => ({
      type: "wardrobe_item",
      id: outfitWardrobeItem.id,
      addedAt: outfitWardrobeItem.createdAt.toISOString(),
      wardrobeItem: toWardrobeItemSummary(outfitWardrobeItem.wardrobeItem, storage)
    })
  );

  return [...catalogItems, ...wardrobeItems].sort(
    (left, right) => new Date(left.addedAt).getTime() - new Date(right.addedAt).getTime()
  );
}

function toOutfitSummary(
  outfit: OutfitSummaryRecord,
  favoritedProductIds: Set<string>,
  storage: WardrobeMediaStorage
): OutfitSummaryResponse {
  const products = getOutfitProducts(outfit);
  const itemsPreview = getMixedOutfitItems(outfit, favoritedProductIds, storage).slice(0, 4);

  return {
    id: outfit.id,
    name: outfit.name,
    productCount: outfit._count.products,
    wardrobeItemCount: outfit._count.wardrobeItems,
    itemCount: outfit._count.products + outfit._count.wardrobeItems,
    productsPreview: products.map((product) => toProductSummary(product, favoritedProductIds)),
    itemsPreview,
    createdAt: outfit.createdAt.toISOString(),
    updatedAt: outfit.updatedAt.toISOString()
  };
}

function toOutfitDetail(
  outfit: OutfitDetailRecord,
  favoritedProductIds: Set<string>,
  storage: WardrobeMediaStorage
): OutfitDetailResponse {
  const products = getOutfitProducts(outfit);
  const wardrobeItems = getOutfitWardrobeItems(outfit);
  const categories = uniqueCategories(products, wardrobeItems);
  const items = getMixedOutfitItems(outfit, favoritedProductIds, storage);

  return {
    id: outfit.id,
    name: outfit.name,
    productCount: outfit._count.products,
    wardrobeItemCount: outfit._count.wardrobeItems,
    itemCount: outfit._count.products + outfit._count.wardrobeItems,
    productsPreview: products
      .slice(0, 4)
      .map((product) => toProductSummary(product, favoritedProductIds)),
    itemsPreview: items.slice(0, 4),
    products: products.map((product) => toProductSummary(product, favoritedProductIds)),
    items,
    includedCategories: categories,
    missingCategoryHints: buildMissingCategoryHints(categories),
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
  storage: WardrobeMediaStorage,
  userId: string,
  query: OutfitListQuery
): Promise<OutfitListResponse> {
  const { outfits, total } = await listUserOutfits(prisma, userId, query);
  const products = outfits.flatMap(getOutfitProducts);
  const favoritedProductIds = await findFavoritedIdsForProducts(prisma, userId, products);

  return {
    data: {
      items: outfits.map((outfit) => toOutfitSummary(outfit, favoritedProductIds, storage))
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
  storage: WardrobeMediaStorage,
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

  return toOutfitDetail(outfit, favoritedProductIds, storage);
}

export async function getOutfitDetail(
  prisma: PrismaClient,
  storage: WardrobeMediaStorage,
  userId: string,
  outfitId: string
): Promise<OutfitDetailResponse> {
  const outfit = await getOwnedOutfitOrThrow(prisma, userId, outfitId);
  const products = getOutfitProducts(outfit);
  const favoritedProductIds = await findFavoritedIdsForProducts(prisma, userId, products);

  return toOutfitDetail(outfit, favoritedProductIds, storage);
}

export async function updateOutfit(
  prisma: PrismaClient,
  storage: WardrobeMediaStorage,
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

  return toOutfitDetail(outfit, favoritedProductIds, storage);
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
  storage: WardrobeMediaStorage,
  userId: string,
  outfitId: string,
  productId: string
): Promise<OutfitProductMutationResult> {
  await getOwnedOutfitOrThrow(prisma, userId, outfitId);
  await validateActiveProducts(prisma, [productId]);

  const existingOutfitProduct = await findOutfitProductByProduct(prisma, outfitId, productId);

  if (existingOutfitProduct !== null) {
    return {
      response: await getOutfitDetail(prisma, storage, userId, outfitId),
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
      response: await getOutfitDetail(prisma, storage, userId, outfitId),
      created: false
    };
  }

  return {
    response: await getOutfitDetail(prisma, storage, userId, outfitId),
    created: true
  };
}

export async function removeProductFromOutfit(
  prisma: PrismaClient,
  storage: WardrobeMediaStorage,
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

  return getOutfitDetail(prisma, storage, userId, outfitId);
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
  storage: WardrobeMediaStorage,
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
      response: await getOutfitDetail(prisma, storage, userId, outfitId),
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
      response: await getOutfitDetail(prisma, storage, userId, outfitId),
      created: false
    };
  }

  return {
    response: await getOutfitDetail(prisma, storage, userId, outfitId),
    created: true
  };
}

export async function removeWardrobeItemFromOutfit(
  prisma: PrismaClient,
  storage: WardrobeMediaStorage,
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

  return getOutfitDetail(prisma, storage, userId, outfitId);
}
