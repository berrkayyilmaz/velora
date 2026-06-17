import type { Prisma, PrismaClient } from "@prisma/client";

import type {
  AdminAnalyticsEventsQuery,
  AdminAnalyticsRedirectsQuery,
  AdminAnalyticsSummaryQuery
} from "../schemas/admin-analytics.schemas.js";

const adminAnalyticsEventSelect = {
  id: true,
  userId: true,
  eventType: true,
  productId: true,
  outfitId: true,
  sourceScreen: true,
  metadata: true,
  createdAt: true
} satisfies Prisma.AnalyticsEventSelect;

const adminAnalyticsRedirectSelect = {
  id: true,
  userId: true,
  productId: true,
  outfitId: true,
  sourcePlatformId: true,
  sourceScreen: true,
  createdAt: true
} satisfies Prisma.RedirectEventSelect;

export type AdminAnalyticsEventRecord = Prisma.AnalyticsEventGetPayload<{
  select: typeof adminAnalyticsEventSelect;
}>;

export type AdminAnalyticsRedirectRecord = Prisma.RedirectEventGetPayload<{
  select: typeof adminAnalyticsRedirectSelect;
}>;

export type AdminAnalyticsSummaryCounts = {
  userCount: number;
  productCount: number;
  wishlistItemCount: number;
  outfitCount: number;
  analyticsEventCount: number;
  redirectCount: number;
};

type AdminAnalyticsListResult<T> = {
  items: T[];
  total: number;
};

function buildDateTimeFilter(query: AdminAnalyticsSummaryQuery): Prisma.DateTimeFilter | undefined {
  if (query.from === undefined && query.to === undefined) {
    return undefined;
  }

  return {
    ...(query.from === undefined ? {} : { gte: query.from }),
    ...(query.to === undefined ? {} : { lte: query.to })
  };
}

function buildCreatedAtWhere(query: AdminAnalyticsSummaryQuery) {
  const createdAt = buildDateTimeFilter(query);

  return createdAt === undefined ? {} : { createdAt };
}

function buildAnalyticsEventWhere(
  query: AdminAnalyticsEventsQuery
): Prisma.AnalyticsEventWhereInput {
  return {
    ...buildCreatedAtWhere(query),
    ...(query.eventType === undefined ? {} : { eventType: query.eventType }),
    ...(query.userId === undefined ? {} : { userId: query.userId }),
    ...(query.productId === undefined ? {} : { productId: query.productId }),
    ...(query.outfitId === undefined ? {} : { outfitId: query.outfitId })
  };
}

function buildRedirectEventWhere(
  query: AdminAnalyticsRedirectsQuery
): Prisma.RedirectEventWhereInput {
  return {
    ...buildCreatedAtWhere(query),
    ...(query.productId === undefined ? {} : { productId: query.productId }),
    ...(query.sourcePlatformId === undefined ? {} : { sourcePlatformId: query.sourcePlatformId }),
    ...(query.sourceScreen === undefined ? {} : { sourceScreen: query.sourceScreen })
  };
}

export async function getAdminAnalyticsSummaryCounts(
  prisma: PrismaClient,
  query: AdminAnalyticsSummaryQuery
): Promise<AdminAnalyticsSummaryCounts> {
  const where = buildCreatedAtWhere(query);

  const [
    userCount,
    productCount,
    wishlistItemCount,
    outfitCount,
    analyticsEventCount,
    redirectCount
  ] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.product.count({ where }),
    prisma.wishlistItem.count({ where }),
    prisma.outfit.count({ where }),
    prisma.analyticsEvent.count({ where }),
    prisma.redirectEvent.count({ where })
  ]);

  return {
    userCount,
    productCount,
    wishlistItemCount,
    outfitCount,
    analyticsEventCount,
    redirectCount
  };
}

export async function listAdminAnalyticsEvents(
  prisma: PrismaClient,
  query: AdminAnalyticsEventsQuery
): Promise<AdminAnalyticsListResult<AdminAnalyticsEventRecord>> {
  const where = buildAnalyticsEventWhere(query);
  const skip = (query.page - 1) * query.pageSize;

  const [items, total] = await prisma.$transaction([
    prisma.analyticsEvent.findMany({
      where,
      select: adminAnalyticsEventSelect,
      orderBy: {
        createdAt: "desc"
      },
      skip,
      take: query.pageSize
    }),
    prisma.analyticsEvent.count({ where })
  ]);

  return { items, total };
}

export async function listAdminAnalyticsRedirects(
  prisma: PrismaClient,
  query: AdminAnalyticsRedirectsQuery
): Promise<AdminAnalyticsListResult<AdminAnalyticsRedirectRecord>> {
  const where = buildRedirectEventWhere(query);
  const skip = (query.page - 1) * query.pageSize;

  const [items, total] = await prisma.$transaction([
    prisma.redirectEvent.findMany({
      where,
      select: adminAnalyticsRedirectSelect,
      orderBy: {
        createdAt: "desc"
      },
      skip,
      take: query.pageSize
    }),
    prisma.redirectEvent.count({ where })
  ]);

  return { items, total };
}
