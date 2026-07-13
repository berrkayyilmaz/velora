import {
  TryOnJobStatus as PrismaTryOnJobStatus,
  TryOnResultStatus,
  WardrobeItemMediaPurpose,
  WardrobeItemMediaStatus,
  WardrobeItemStatus
} from "@prisma/client";
import type { Prisma, PrismaClient } from "@prisma/client";

import type { TryOnJobListQuery } from "../schemas/try-on.schemas.js";

export const TRY_ON_CONSENT_PURPOSE = "virtual_try_on_generation";

const tryOnResultSelect = {
  id: true,
  jobId: true,
  mediaType: true,
  width: true,
  height: true,
  status: true,
  expiresAt: true,
  createdAt: true,
  deletedAt: true
} satisfies Prisma.TryOnResultSelect;

const tryOnJobSelect = {
  id: true,
  userId: true,
  consentId: true,
  personImageStorageKey: true,
  productId: true,
  wardrobeItemId: true,
  outfitId: true,
  status: true,
  provider: true,
  providerVersion: true,
  modelVersion: true,
  idempotencyKey: true,
  attemptCount: true,
  maxAttempts: true,
  failureCode: true,
  failureMessage: true,
  processingStartedAt: true,
  completedAt: true,
  cancelledAt: true,
  expiresAt: true,
  createdAt: true,
  updatedAt: true,
  result: {
    select: tryOnResultSelect
  }
} satisfies Prisma.TryOnJobSelect;

export type TryOnJobRecord = Prisma.TryOnJobGetPayload<{
  select: typeof tryOnJobSelect;
}>;

export type TryOnResultRecord = Prisma.TryOnResultGetPayload<{
  select: typeof tryOnResultSelect;
}>;

type TryOnJobListResult = {
  items: TryOnJobRecord[];
  total: number;
};

function toDatabaseStatus(status: TryOnJobListQuery["status"]): PrismaTryOnJobStatus | undefined {
  return status === undefined
    ? undefined
    : PrismaTryOnJobStatus[status.toUpperCase() as keyof typeof PrismaTryOnJobStatus];
}

export async function findCurrentTryOnConsent(
  prisma: PrismaClient,
  userId: string
): Promise<{ id: string } | null> {
  return prisma.tryOnConsent.findFirst({
    where: {
      userId,
      purpose: TRY_ON_CONSENT_PURPOSE,
      withdrawnAt: null
    },
    orderBy: {
      grantedAt: "desc"
    },
    select: {
      id: true
    }
  });
}

export async function findActiveTryOnProduct(
  prisma: PrismaClient,
  productId: string
): Promise<{ id: string } | null> {
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

export async function findEligibleTryOnWardrobeItem(
  prisma: PrismaClient,
  userId: string,
  wardrobeItemId: string
): Promise<{ id: string } | null> {
  return prisma.wardrobeItem.findFirst({
    where: {
      id: wardrobeItemId,
      userId,
      status: WardrobeItemStatus.ACTIVE,
      media: {
        some: {
          purpose: WardrobeItemMediaPurpose.PRIMARY,
          status: WardrobeItemMediaStatus.READY,
          deletedAt: null
        }
      }
    },
    select: {
      id: true
    }
  });
}

export async function findOwnedOutfitForTryOn(
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

export async function findOutfitProductForTryOn(
  prisma: PrismaClient,
  outfitId: string,
  productId: string
): Promise<{ id: string } | null> {
  return prisma.outfitProduct.findUnique({
    where: {
      outfitId_productId: {
        outfitId,
        productId
      }
    },
    select: {
      id: true
    }
  });
}

export async function findOutfitWardrobeItemForTryOn(
  prisma: PrismaClient,
  outfitId: string,
  wardrobeItemId: string
): Promise<{ id: string } | null> {
  return prisma.outfitWardrobeItem.findUnique({
    where: {
      outfitId_wardrobeItemId: {
        outfitId,
        wardrobeItemId
      }
    },
    select: {
      id: true
    }
  });
}

export async function findUserTryOnJobById(
  prisma: PrismaClient,
  userId: string,
  jobId: string
): Promise<TryOnJobRecord | null> {
  return prisma.tryOnJob.findFirst({
    where: {
      id: jobId,
      userId
    },
    select: tryOnJobSelect
  });
}

export async function findUserTryOnJobByIdempotencyKey(
  prisma: PrismaClient,
  userId: string,
  idempotencyKey: string
): Promise<TryOnJobRecord | null> {
  return prisma.tryOnJob.findUnique({
    where: {
      userId_idempotencyKey: {
        userId,
        idempotencyKey
      }
    },
    select: tryOnJobSelect
  });
}

export async function listUserTryOnJobs(
  prisma: PrismaClient,
  userId: string,
  query: TryOnJobListQuery
): Promise<TryOnJobListResult> {
  const status = toDatabaseStatus(query.status);
  const where: Prisma.TryOnJobWhereInput = {
    userId,
    ...(status === undefined ? {} : { status })
  };
  const skip = (query.page - 1) * query.pageSize;

  const [items, total] = await prisma.$transaction([
    prisma.tryOnJob.findMany({
      where,
      select: tryOnJobSelect,
      orderBy: {
        createdAt: "desc"
      },
      skip,
      take: query.pageSize
    }),
    prisma.tryOnJob.count({ where })
  ]);

  return { items, total };
}

export async function createTryOnJobRecord(
  prisma: PrismaClient,
  input: {
    userId: string;
    consentId: string;
    personImageStorageKey: string;
    productId?: string;
    wardrobeItemId?: string;
    outfitId?: string;
    idempotencyKey?: string;
    expiresAt: Date;
  }
): Promise<TryOnJobRecord> {
  return prisma.tryOnJob.create({
    data: {
      userId: input.userId,
      consentId: input.consentId,
      personImageStorageKey: input.personImageStorageKey,
      ...(input.productId === undefined ? {} : { productId: input.productId }),
      ...(input.wardrobeItemId === undefined ? {} : { wardrobeItemId: input.wardrobeItemId }),
      ...(input.outfitId === undefined ? {} : { outfitId: input.outfitId }),
      ...(input.idempotencyKey === undefined ? {} : { idempotencyKey: input.idempotencyKey }),
      expiresAt: input.expiresAt
    },
    select: tryOnJobSelect
  });
}

export async function updateTryOnJobStatus(
  prisma: PrismaClient,
  userId: string,
  jobId: string,
  statuses: PrismaTryOnJobStatus[],
  data: Prisma.TryOnJobUpdateManyMutationInput
): Promise<TryOnJobRecord | null> {
  const result = await prisma.tryOnJob.updateMany({
    where: {
      id: jobId,
      userId,
      status: {
        in: statuses
      }
    },
    data
  });

  if (result.count === 0) {
    return null;
  }

  return findUserTryOnJobById(prisma, userId, jobId);
}

export async function expireTryOnJob(
  prisma: PrismaClient,
  userId: string,
  jobId: string
): Promise<TryOnJobRecord | null> {
  const now = new Date();
  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.tryOnJob.updateMany({
      where: {
        id: jobId,
        userId
      },
      data: {
        status: PrismaTryOnJobStatus.EXPIRED,
        completedAt: now,
        expiresAt: now
      }
    });

    if (updated.count === 0) {
      return null;
    }

    await tx.tryOnResult.updateMany({
      where: {
        jobId,
        userId,
        status: {
          not: TryOnResultStatus.DELETED
        }
      },
      data: {
        status: TryOnResultStatus.DELETED,
        deletedAt: now,
        expiresAt: now
      }
    });

    return tx.tryOnJob.findFirst({
      where: {
        id: jobId,
        userId
      },
      select: tryOnJobSelect
    });
  });

  return result;
}

export { PrismaTryOnJobStatus };
