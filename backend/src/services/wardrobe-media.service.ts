import type { PrismaClient, WardrobeItemMediaStatus } from "@prisma/client";

import {
  completeWardrobeMediaDeletionAndDraftItem,
  createReadyWardrobeMedia,
  findCurrentPrimaryMedia,
  findOwnedWardrobeItemForMedia,
  findOwnedWardrobeMedia,
  markWardrobeMediaDeletionPending,
  type WardrobeMediaRecord
} from "../repositories/wardrobe-media.repository.js";
import type {
  DeleteWardrobeMediaResponse,
  WardrobeMediaResponse,
  WardrobeMediaResponseData
} from "../schemas/wardrobe-media.schemas.js";
import {
  validateAndNormalizeWardrobeImage,
  WardrobeImageValidationError
} from "../utils/wardrobe-image.js";
import type { WardrobeMediaStorage } from "./storage/wardrobe-media-storage.js";

export class WardrobeMediaServiceError extends Error {
  constructor(
    readonly code: string,
    readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "WardrobeMediaServiceError";
  }
}

function toApiStatus(status: WardrobeItemMediaStatus): WardrobeMediaResponseData["status"] {
  return status.toLowerCase() as WardrobeMediaResponseData["status"];
}

export function toWardrobeMedia(
  media: WardrobeMediaRecord,
  storage: WardrobeMediaStorage
): WardrobeMediaResponseData {
  return {
    id: media.id,
    wardrobeItemId: media.wardrobeItemId,
    mediaType: media.mediaType as WardrobeMediaResponseData["mediaType"],
    purpose: "primary",
    status: toApiStatus(media.status),
    width: media.width,
    height: media.height,
    fileSize: media.fileSize,
    createdAt: media.createdAt.toISOString(),
    url: storage.getUrl(media.storageKey)
  };
}

export async function uploadWardrobeMedia(
  prisma: PrismaClient,
  storage: WardrobeMediaStorage,
  userId: string,
  wardrobeItemId: string,
  input: {
    data: Buffer;
    mediaType: WardrobeMediaResponseData["mediaType"];
  }
): Promise<WardrobeMediaResponse> {
  const item = await findOwnedWardrobeItemForMedia(prisma, userId, wardrobeItemId);

  if (item === null) {
    throw new WardrobeMediaServiceError(
      "WARDROBE_ITEM_NOT_FOUND",
      404,
      "Wardrobe item was not found."
    );
  }

  const currentMedia = await findCurrentPrimaryMedia(prisma, wardrobeItemId);

  if (currentMedia !== null) {
    throw new WardrobeMediaServiceError(
      "WARDROBE_MEDIA_EXISTS",
      409,
      "The wardrobe item already has primary media."
    );
  }

  let validatedImage;

  try {
    validatedImage = await validateAndNormalizeWardrobeImage(input.data, input.mediaType);
  } catch (error) {
    if (error instanceof WardrobeImageValidationError) {
      throw new WardrobeMediaServiceError(error.code, error.statusCode, error.message);
    }

    throw error;
  }

  const storedMedia = await storage.save(validatedImage);

  try {
    const media = await createReadyWardrobeMedia(prisma, {
      wardrobeItemId,
      storageKey: storedMedia.storageKey,
      mediaType: validatedImage.mediaType,
      fileSize: validatedImage.data.byteLength,
      width: validatedImage.width,
      height: validatedImage.height
    });

    return {
      data: toWardrobeMedia(media, storage)
    };
  } catch (error) {
    await storage.delete(storedMedia.storageKey);
    throw error;
  }
}

export async function deleteWardrobeMedia(
  prisma: PrismaClient,
  storage: WardrobeMediaStorage,
  userId: string,
  wardrobeItemId: string,
  mediaId: string
): Promise<DeleteWardrobeMediaResponse> {
  const media = await findOwnedWardrobeMedia(prisma, userId, wardrobeItemId, mediaId);

  if (media === null) {
    throw new WardrobeMediaServiceError(
      "WARDROBE_MEDIA_NOT_FOUND",
      404,
      "Wardrobe media was not found."
    );
  }

  await markWardrobeMediaDeletionPending(prisma, media.id);
  await storage.delete(media.storageKey);
  await completeWardrobeMediaDeletionAndDraftItem(prisma, media.id, media.wardrobeItemId);

  return {
    data: {
      success: true
    }
  };
}
