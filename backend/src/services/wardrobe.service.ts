import type { Prisma, PrismaClient, WardrobeItemStatus } from "@prisma/client";

import { createAnalyticsEvent } from "../repositories/analytics.repository.js";
import {
  hasReadyWardrobeMedia,
  listOwnedWardrobeMediaForDeletion
} from "../repositories/wardrobe-media.repository.js";
import {
  createUserWardrobeItem,
  deleteUserWardrobeItem,
  findActiveCategoryForWardrobe,
  findUserWardrobeItemById,
  listUserWardrobeItems,
  updateUserWardrobeItem,
  type WardrobeItemRecord
} from "../repositories/wardrobe.repository.js";
import type { AnalyticsEventType } from "../schemas/analytics.schemas.js";
import type {
  CreateWardrobeItemRequest,
  DeleteWardrobeItemResponse,
  UpdateWardrobeItemRequest,
  WardrobeItemResponse,
  WardrobeItemResponseData,
  WardrobeListQuery,
  WardrobeListResponse
} from "../schemas/wardrobe.schemas.js";
import type { WardrobeMediaStorage } from "./storage/wardrobe-media-storage.js";
import { toWardrobeMedia } from "./wardrobe-media.service.js";

export class WardrobeServiceError extends Error {
  constructor(
    readonly code: string,
    readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "WardrobeServiceError";
  }
}

function toApiStatus(status: WardrobeItemStatus): WardrobeItemResponseData["status"] {
  return status.toLowerCase() as WardrobeItemResponseData["status"];
}

function toWardrobeItem(
  item: WardrobeItemRecord,
  storage: WardrobeMediaStorage
): WardrobeItemResponseData {
  return {
    id: item.id,
    title: item.title,
    category: item.category,
    color: item.color,
    brandLabel: item.brandLabel,
    notes: item.notes,
    status: toApiStatus(item.status),
    primaryMedia: item.media[0] === undefined ? null : toWardrobeMedia(item.media[0], storage),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString()
  };
}

async function validateCategory(prisma: PrismaClient, categoryId: string): Promise<void> {
  const category = await findActiveCategoryForWardrobe(prisma, categoryId);

  if (category === null) {
    throw new WardrobeServiceError("CATEGORY_NOT_FOUND", 404, "Category was not found.");
  }
}

async function recordWardrobeAnalyticsEvent(
  prisma: PrismaClient,
  input: {
    userId: string;
    eventType: AnalyticsEventType;
    wardrobeItemId?: string;
    metadata?: Prisma.InputJsonValue;
  }
): Promise<void> {
  try {
    await createAnalyticsEvent(prisma, {
      userId: input.userId,
      eventType: input.eventType,
      ...(input.wardrobeItemId === undefined ? {} : { wardrobeItemId: input.wardrobeItemId }),
      sourceScreen: "wardrobe",
      ...(input.metadata === undefined ? {} : { metadata: input.metadata })
    });
  } catch {
    return;
  }
}

export async function listWardrobeItems(
  prisma: PrismaClient,
  storage: WardrobeMediaStorage,
  userId: string,
  query: WardrobeListQuery
): Promise<WardrobeListResponse> {
  const { items, total } = await listUserWardrobeItems(prisma, userId, query);

  return {
    data: {
      items: items.map((item) => toWardrobeItem(item, storage))
    },
    meta: {
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        hasNextPage: query.page * query.pageSize < total
      },
      appliedFilters: {
        ...(query.search === undefined ? {} : { search: query.search }),
        ...(query.categoryId === undefined ? {} : { categoryId: query.categoryId }),
        ...(query.status === undefined ? {} : { status: query.status }),
        sort: query.sort
      }
    }
  };
}

export async function createWardrobeItem(
  prisma: PrismaClient,
  storage: WardrobeMediaStorage,
  userId: string,
  input: CreateWardrobeItemRequest
): Promise<WardrobeItemResponse> {
  await validateCategory(prisma, input.categoryId);

  const item = await createUserWardrobeItem(prisma, userId, input);
  await recordWardrobeAnalyticsEvent(prisma, {
    userId,
    eventType: "wardrobe_item_created",
    wardrobeItemId: item.id,
    metadata: {
      wardrobeItemId: item.id,
      categoryId: item.category.id
    }
  });

  return {
    data: toWardrobeItem(item, storage)
  };
}

export async function getWardrobeItem(
  prisma: PrismaClient,
  storage: WardrobeMediaStorage,
  userId: string,
  wardrobeItemId: string
): Promise<WardrobeItemResponse> {
  const item = await findUserWardrobeItemById(prisma, userId, wardrobeItemId);

  if (item === null) {
    throw new WardrobeServiceError("WARDROBE_ITEM_NOT_FOUND", 404, "Wardrobe item was not found.");
  }

  return {
    data: toWardrobeItem(item, storage)
  };
}

export async function updateWardrobeItem(
  prisma: PrismaClient,
  storage: WardrobeMediaStorage,
  userId: string,
  wardrobeItemId: string,
  input: UpdateWardrobeItemRequest
): Promise<WardrobeItemResponse> {
  const existingItem = await findUserWardrobeItemById(prisma, userId, wardrobeItemId);

  if (existingItem === null) {
    throw new WardrobeServiceError("WARDROBE_ITEM_NOT_FOUND", 404, "Wardrobe item was not found.");
  }

  if (input.categoryId !== undefined) {
    await validateCategory(prisma, input.categoryId);
  }

  if (input.status === "active" && !(await hasReadyWardrobeMedia(prisma, wardrobeItemId))) {
    throw new WardrobeServiceError(
      "WARDROBE_MEDIA_REQUIRED",
      409,
      "An uploaded image is required before activating a wardrobe item."
    );
  }

  const item = await updateUserWardrobeItem(prisma, userId, wardrobeItemId, input);

  if (item === null) {
    throw new WardrobeServiceError("WARDROBE_ITEM_NOT_FOUND", 404, "Wardrobe item was not found.");
  }

  await recordWardrobeAnalyticsEvent(prisma, {
    userId,
    eventType: "wardrobe_item_updated",
    wardrobeItemId: item.id,
    metadata: {
      wardrobeItemId: item.id,
      changedFields: Object.keys(input)
    }
  });

  return {
    data: toWardrobeItem(item, storage)
  };
}

export async function deleteWardrobeItem(
  prisma: PrismaClient,
  storage: WardrobeMediaStorage,
  userId: string,
  wardrobeItemId: string
): Promise<DeleteWardrobeItemResponse> {
  const existingItem = await findUserWardrobeItemById(prisma, userId, wardrobeItemId);

  if (existingItem === null) {
    throw new WardrobeServiceError("WARDROBE_ITEM_NOT_FOUND", 404, "Wardrobe item was not found.");
  }

  const media = await listOwnedWardrobeMediaForDeletion(prisma, userId, wardrobeItemId);

  for (const itemMedia of media) {
    await storage.delete(itemMedia.storageKey);
  }

  const deletedCount = await deleteUserWardrobeItem(prisma, userId, wardrobeItemId);

  if (deletedCount === 0) {
    throw new WardrobeServiceError("WARDROBE_ITEM_NOT_FOUND", 404, "Wardrobe item was not found.");
  }

  await recordWardrobeAnalyticsEvent(prisma, {
    userId,
    eventType: "wardrobe_item_deleted",
    metadata: {
      wardrobeItemId
    }
  });

  return {
    data: {
      success: true
    }
  };
}
