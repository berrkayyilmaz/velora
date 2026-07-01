import {
  Prisma,
  type PrismaClient,
  WardrobeItemMediaPurpose,
  WardrobeItemMediaStatus
} from "@prisma/client";

import type {
  CreateOutfitRequest,
  OutfitListQuery,
  UpdateOutfitRequest
} from "../schemas/outfit.schemas.js";
import { wardrobeMediaSelect } from "./wardrobe-media.repository.js";

const OUTFIT_PREVIEW_PRODUCT_LIMIT = 4;

const catalogRecordSelect = {
  id: true,
  name: true,
  slug: true
} as const;

const productSummarySelect = {
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
} satisfies Prisma.ProductSelect;

const outfitProductSelect = {
  id: true,
  createdAt: true,
  product: {
    select: productSummarySelect
  }
} satisfies Prisma.OutfitProductSelect;

const wardrobeItemSummarySelect = {
  id: true,
  title: true,
  color: true,
  status: true,
  category: {
    select: catalogRecordSelect
  },
  media: {
    where: {
      purpose: WardrobeItemMediaPurpose.PRIMARY,
      status: WardrobeItemMediaStatus.READY,
      deletedAt: null
    },
    select: wardrobeMediaSelect,
    take: 1
  }
} satisfies Prisma.WardrobeItemSelect;

const outfitWardrobeItemSelect = {
  id: true,
  createdAt: true,
  wardrobeItem: {
    select: wardrobeItemSummarySelect
  }
} satisfies Prisma.OutfitWardrobeItemSelect;

const outfitSummarySelect = {
  id: true,
  name: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      products: true,
      wardrobeItems: true
    }
  },
  products: {
    select: outfitProductSelect,
    orderBy: {
      createdAt: "asc"
    },
    take: OUTFIT_PREVIEW_PRODUCT_LIMIT
  },
  wardrobeItems: {
    select: outfitWardrobeItemSelect,
    orderBy: {
      createdAt: "asc"
    },
    take: OUTFIT_PREVIEW_PRODUCT_LIMIT
  }
} satisfies Prisma.OutfitSelect;

const outfitDetailSelect = {
  id: true,
  name: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      products: true,
      wardrobeItems: true
    }
  },
  products: {
    select: outfitProductSelect,
    orderBy: {
      createdAt: "asc"
    }
  },
  wardrobeItems: {
    select: outfitWardrobeItemSelect,
    orderBy: {
      createdAt: "asc"
    }
  }
} satisfies Prisma.OutfitSelect;

export type ProductSummaryRecord = Prisma.ProductGetPayload<{
  select: typeof productSummarySelect;
}>;

export type OutfitProductRecord = Prisma.OutfitProductGetPayload<{
  select: typeof outfitProductSelect;
}>;

export type OutfitSummaryRecord = Prisma.OutfitGetPayload<{
  select: typeof outfitSummarySelect;
}>;

export type OutfitDetailRecord = Prisma.OutfitGetPayload<{
  select: typeof outfitDetailSelect;
}>;

export type WardrobeItemSummaryRecord = Prisma.WardrobeItemGetPayload<{
  select: typeof wardrobeItemSummarySelect;
}>;

export type OutfitWardrobeItemRecord = Prisma.OutfitWardrobeItemGetPayload<{
  select: typeof outfitWardrobeItemSelect;
}>;

const wardrobeItemEligibilitySelect = {
  id: true,
  status: true,
  media: {
    where: {
      purpose: WardrobeItemMediaPurpose.PRIMARY,
      status: WardrobeItemMediaStatus.READY,
      deletedAt: null
    },
    select: {
      id: true
    },
    take: 1
  }
} satisfies Prisma.WardrobeItemSelect;

export type WardrobeItemEligibilityRecord = Prisma.WardrobeItemGetPayload<{
  select: typeof wardrobeItemEligibilitySelect;
}>;

type OutfitListResult = {
  outfits: OutfitSummaryRecord[];
  total: number;
};

type ActiveProductRecord = {
  id: string;
};

export async function listUserOutfits(
  prisma: PrismaClient,
  userId: string,
  query: OutfitListQuery
): Promise<OutfitListResult> {
  const where = { userId };
  const skip = (query.page - 1) * query.pageSize;

  const [outfits, total] = await prisma.$transaction([
    prisma.outfit.findMany({
      where,
      select: outfitSummarySelect,
      orderBy: {
        updatedAt: query.sort === "newest" ? "desc" : "asc"
      },
      skip,
      take: query.pageSize
    }),
    prisma.outfit.count({ where })
  ]);

  return { outfits, total };
}

export async function findUserOutfitById(
  prisma: PrismaClient,
  userId: string,
  outfitId: string
): Promise<OutfitDetailRecord | null> {
  return prisma.outfit.findFirst({
    where: {
      id: outfitId,
      userId
    },
    select: outfitDetailSelect
  });
}

export async function createUserOutfit(
  prisma: PrismaClient,
  userId: string,
  input: CreateOutfitRequest
): Promise<OutfitDetailRecord> {
  return prisma.$transaction(async (tx) => {
    const outfit = await tx.outfit.create({
      data: {
        userId,
        name: input.name
      },
      select: {
        id: true
      }
    });

    if (input.productIds !== undefined && input.productIds.length > 0) {
      await tx.outfitProduct.createMany({
        data: input.productIds.map((productId) => ({
          outfitId: outfit.id,
          productId
        })),
        skipDuplicates: true
      });
    }

    const createdOutfit = await tx.outfit.findUniqueOrThrow({
      where: {
        id: outfit.id
      },
      select: outfitDetailSelect
    });

    return createdOutfit;
  });
}

export async function updateUserOutfit(
  prisma: PrismaClient,
  userId: string,
  outfitId: string,
  input: UpdateOutfitRequest
): Promise<OutfitDetailRecord | null> {
  const result = await prisma.outfit.updateMany({
    where: {
      id: outfitId,
      userId
    },
    data: {
      ...(input.name === undefined ? {} : { name: input.name })
    }
  });

  if (result.count === 0) {
    return null;
  }

  return findUserOutfitById(prisma, userId, outfitId);
}

export async function deleteUserOutfit(
  prisma: PrismaClient,
  userId: string,
  outfitId: string
): Promise<number> {
  const result = await prisma.outfit.deleteMany({
    where: {
      id: outfitId,
      userId
    }
  });

  return result.count;
}

export async function findActiveProductsForOutfit(
  prisma: PrismaClient,
  productIds: string[]
): Promise<ActiveProductRecord[]> {
  if (productIds.length === 0) {
    return [];
  }

  return prisma.product.findMany({
    where: {
      id: {
        in: productIds
      },
      isActive: true
    },
    select: {
      id: true
    }
  });
}

export async function findOutfitProductByProduct(
  prisma: PrismaClient,
  outfitId: string,
  productId: string
): Promise<OutfitProductRecord | null> {
  return prisma.outfitProduct.findUnique({
    where: {
      outfitId_productId: {
        outfitId,
        productId
      }
    },
    select: outfitProductSelect
  });
}

export async function createOutfitProduct(
  prisma: PrismaClient,
  outfitId: string,
  productId: string
): Promise<void> {
  await prisma.$transaction([
    prisma.outfitProduct.create({
      data: {
        outfitId,
        productId
      }
    }),
    prisma.outfit.update({
      where: {
        id: outfitId
      },
      data: {
        updatedAt: new Date()
      }
    })
  ]);
}

export async function deleteOutfitProductByProduct(
  prisma: PrismaClient,
  outfitId: string,
  productId: string
): Promise<number> {
  return prisma.$transaction(async (tx) => {
    const result = await tx.outfitProduct.deleteMany({
      where: {
        outfitId,
        productId
      }
    });

    if (result.count > 0) {
      await tx.outfit.update({
        where: {
          id: outfitId
        },
        data: {
          updatedAt: new Date()
        }
      });
    }

    return result.count;
  });
}

export async function findUserWardrobeItemForOutfit(
  prisma: PrismaClient,
  userId: string,
  wardrobeItemId: string
): Promise<WardrobeItemEligibilityRecord | null> {
  return prisma.wardrobeItem.findFirst({
    where: {
      id: wardrobeItemId,
      userId
    },
    select: wardrobeItemEligibilitySelect
  });
}

export async function findOutfitWardrobeItem(
  prisma: PrismaClient,
  outfitId: string,
  wardrobeItemId: string
): Promise<OutfitWardrobeItemRecord | null> {
  return prisma.outfitWardrobeItem.findUnique({
    where: {
      outfitId_wardrobeItemId: {
        outfitId,
        wardrobeItemId
      }
    },
    select: outfitWardrobeItemSelect
  });
}

export async function createOutfitWardrobeItem(
  prisma: PrismaClient,
  outfitId: string,
  wardrobeItemId: string
): Promise<void> {
  await prisma.$transaction([
    prisma.outfitWardrobeItem.create({
      data: {
        outfitId,
        wardrobeItemId
      }
    }),
    prisma.outfit.update({
      where: {
        id: outfitId
      },
      data: {
        updatedAt: new Date()
      }
    })
  ]);
}

export async function deleteOutfitWardrobeItem(
  prisma: PrismaClient,
  outfitId: string,
  wardrobeItemId: string
): Promise<number> {
  return prisma.$transaction(async (tx) => {
    const result = await tx.outfitWardrobeItem.deleteMany({
      where: {
        outfitId,
        wardrobeItemId
      }
    });

    if (result.count > 0) {
      await tx.outfit.update({
        where: {
          id: outfitId
        },
        data: {
          updatedAt: new Date()
        }
      });
    }

    return result.count;
  });
}

export function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}
