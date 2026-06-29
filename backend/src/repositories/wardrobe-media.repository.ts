import { WardrobeItemMediaPurpose, WardrobeItemMediaStatus } from "@prisma/client";
import type { Prisma, PrismaClient } from "@prisma/client";

const wardrobeMediaSelect = {
  id: true,
  wardrobeItemId: true,
  storageKey: true,
  mediaType: true,
  purpose: true,
  status: true,
  width: true,
  height: true,
  fileSize: true,
  createdAt: true,
  deletedAt: true
} satisfies Prisma.WardrobeItemMediaSelect;

export type WardrobeMediaRecord = Prisma.WardrobeItemMediaGetPayload<{
  select: typeof wardrobeMediaSelect;
}>;

export async function findOwnedWardrobeItemForMedia(
  prisma: PrismaClient,
  userId: string,
  wardrobeItemId: string
): Promise<{ id: string } | null> {
  return prisma.wardrobeItem.findFirst({
    where: {
      id: wardrobeItemId,
      userId
    },
    select: {
      id: true
    }
  });
}

export async function findCurrentPrimaryMedia(
  prisma: PrismaClient,
  wardrobeItemId: string
): Promise<{ id: string } | null> {
  return prisma.wardrobeItemMedia.findFirst({
    where: {
      wardrobeItemId,
      purpose: WardrobeItemMediaPurpose.PRIMARY,
      deletedAt: null
    },
    select: {
      id: true
    }
  });
}

export async function createReadyWardrobeMedia(
  prisma: PrismaClient,
  input: {
    wardrobeItemId: string;
    storageKey: string;
    mediaType: string;
    fileSize: number;
  }
): Promise<WardrobeMediaRecord> {
  return prisma.wardrobeItemMedia.create({
    data: {
      wardrobeItemId: input.wardrobeItemId,
      storageKey: input.storageKey,
      mediaType: input.mediaType,
      purpose: WardrobeItemMediaPurpose.PRIMARY,
      status: WardrobeItemMediaStatus.READY,
      fileSize: input.fileSize
    },
    select: wardrobeMediaSelect
  });
}

export async function findOwnedWardrobeMedia(
  prisma: PrismaClient,
  userId: string,
  wardrobeItemId: string,
  mediaId: string
): Promise<WardrobeMediaRecord | null> {
  return prisma.wardrobeItemMedia.findFirst({
    where: {
      id: mediaId,
      wardrobeItemId,
      deletedAt: null,
      wardrobeItem: {
        userId
      }
    },
    select: wardrobeMediaSelect
  });
}

export async function markWardrobeMediaDeletionPending(
  prisma: PrismaClient,
  mediaId: string
): Promise<void> {
  await prisma.wardrobeItemMedia.update({
    where: {
      id: mediaId
    },
    data: {
      status: WardrobeItemMediaStatus.DELETION_PENDING
    }
  });
}

export async function completeWardrobeMediaDeletion(
  prisma: PrismaClient,
  mediaId: string
): Promise<void> {
  await prisma.wardrobeItemMedia.update({
    where: {
      id: mediaId
    },
    data: {
      deletedAt: new Date()
    }
  });
}
