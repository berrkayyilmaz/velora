import { Prisma, type PrismaClient, WardrobeItemStatus } from "@prisma/client";

import type {
  CreateWardrobeItemRequest,
  UpdateWardrobeItemRequest,
  WardrobeListQuery
} from "../schemas/wardrobe.schemas.js";

const wardrobeItemSelect = {
  id: true,
  userId: true,
  title: true,
  color: true,
  brandLabel: true,
  notes: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: {
      id: true,
      name: true,
      slug: true
    }
  }
} satisfies Prisma.WardrobeItemSelect;

export type WardrobeItemRecord = Prisma.WardrobeItemGetPayload<{
  select: typeof wardrobeItemSelect;
}>;

type WardrobeListResult = {
  items: WardrobeItemRecord[];
  total: number;
};

function toDatabaseStatus(
  status: WardrobeListQuery["status"] | UpdateWardrobeItemRequest["status"]
): WardrobeItemStatus | undefined {
  return status === undefined
    ? undefined
    : WardrobeItemStatus[status.toUpperCase() as keyof typeof WardrobeItemStatus];
}

function buildWardrobeWhere(
  userId: string,
  query: WardrobeListQuery
): Prisma.WardrobeItemWhereInput {
  const status = toDatabaseStatus(query.status);

  return {
    userId,
    ...(query.search === undefined
      ? {}
      : {
          title: {
            contains: query.search,
            mode: Prisma.QueryMode.insensitive
          }
        }),
    ...(query.categoryId === undefined ? {} : { categoryId: query.categoryId }),
    ...(status === undefined ? {} : { status })
  };
}

export async function listUserWardrobeItems(
  prisma: PrismaClient,
  userId: string,
  query: WardrobeListQuery
): Promise<WardrobeListResult> {
  const where = buildWardrobeWhere(userId, query);
  const skip = (query.page - 1) * query.pageSize;

  const [items, total] = await prisma.$transaction([
    prisma.wardrobeItem.findMany({
      where,
      select: wardrobeItemSelect,
      orderBy: {
        updatedAt: query.sort === "newest" ? "desc" : "asc"
      },
      skip,
      take: query.pageSize
    }),
    prisma.wardrobeItem.count({ where })
  ]);

  return { items, total };
}

export async function findUserWardrobeItemById(
  prisma: PrismaClient,
  userId: string,
  wardrobeItemId: string
): Promise<WardrobeItemRecord | null> {
  return prisma.wardrobeItem.findFirst({
    where: {
      id: wardrobeItemId,
      userId
    },
    select: wardrobeItemSelect
  });
}

export async function findActiveCategoryForWardrobe(
  prisma: PrismaClient,
  categoryId: string
): Promise<{ id: string } | null> {
  return prisma.category.findFirst({
    where: {
      id: categoryId,
      isActive: true
    },
    select: {
      id: true
    }
  });
}

export async function createUserWardrobeItem(
  prisma: PrismaClient,
  userId: string,
  input: CreateWardrobeItemRequest
): Promise<WardrobeItemRecord> {
  return prisma.wardrobeItem.create({
    data: {
      userId,
      categoryId: input.categoryId,
      title: input.title,
      ...(input.color === undefined ? {} : { color: input.color }),
      ...(input.brandLabel === undefined ? {} : { brandLabel: input.brandLabel }),
      ...(input.notes === undefined ? {} : { notes: input.notes })
    },
    select: wardrobeItemSelect
  });
}

export async function updateUserWardrobeItem(
  prisma: PrismaClient,
  userId: string,
  wardrobeItemId: string,
  input: UpdateWardrobeItemRequest
): Promise<WardrobeItemRecord | null> {
  const status = toDatabaseStatus(input.status);
  const result = await prisma.wardrobeItem.updateMany({
    where: {
      id: wardrobeItemId,
      userId
    },
    data: {
      ...(input.title === undefined ? {} : { title: input.title }),
      ...(input.categoryId === undefined ? {} : { categoryId: input.categoryId }),
      ...(input.color === undefined ? {} : { color: input.color }),
      ...(input.brandLabel === undefined ? {} : { brandLabel: input.brandLabel }),
      ...(input.notes === undefined ? {} : { notes: input.notes }),
      ...(status === undefined ? {} : { status })
    }
  });

  if (result.count === 0) {
    return null;
  }

  return findUserWardrobeItemById(prisma, userId, wardrobeItemId);
}

export async function deleteUserWardrobeItem(
  prisma: PrismaClient,
  userId: string,
  wardrobeItemId: string
): Promise<number> {
  const result = await prisma.wardrobeItem.deleteMany({
    where: {
      id: wardrobeItemId,
      userId
    }
  });

  return result.count;
}
