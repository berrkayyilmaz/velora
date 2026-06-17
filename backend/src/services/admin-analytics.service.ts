import type { PrismaClient } from "@prisma/client";

import {
  getAdminAnalyticsSummaryCounts,
  listAdminAnalyticsEvents as listAdminAnalyticsEventRecords,
  listAdminAnalyticsRedirects as listAdminAnalyticsRedirectRecords,
  type AdminAnalyticsEventRecord,
  type AdminAnalyticsRedirectRecord
} from "../repositories/admin-analytics.repository.js";
import type {
  AdminAnalyticsEventResponse,
  AdminAnalyticsEventsQuery,
  AdminAnalyticsEventsResponse,
  AdminAnalyticsRedirectResponse,
  AdminAnalyticsRedirectsQuery,
  AdminAnalyticsRedirectsResponse,
  AdminAnalyticsSummaryQuery,
  AdminAnalyticsSummaryResponse
} from "../schemas/admin-analytics.schemas.js";

function toAppliedDateRangeFilters(query: AdminAnalyticsSummaryQuery) {
  return {
    ...(query.from === undefined ? {} : { from: query.from.toISOString() }),
    ...(query.to === undefined ? {} : { to: query.to.toISOString() })
  };
}

function buildPagination(query: { page: number; pageSize: number }, total: number) {
  return {
    page: query.page,
    pageSize: query.pageSize,
    total,
    hasNextPage: query.page * query.pageSize < total
  };
}

function toAdminAnalyticsEventResponse(
  event: AdminAnalyticsEventRecord
): AdminAnalyticsEventResponse {
  return {
    id: event.id,
    userId: event.userId,
    eventType: event.eventType,
    productId: event.productId,
    outfitId: event.outfitId,
    sourceScreen: event.sourceScreen,
    metadata: event.metadata,
    createdAt: event.createdAt.toISOString()
  };
}

function toAdminAnalyticsRedirectResponse(
  redirect: AdminAnalyticsRedirectRecord
): AdminAnalyticsRedirectResponse {
  return {
    id: redirect.id,
    userId: redirect.userId,
    productId: redirect.productId,
    outfitId: redirect.outfitId,
    sourcePlatformId: redirect.sourcePlatformId,
    sourceScreen: redirect.sourceScreen,
    createdAt: redirect.createdAt.toISOString()
  };
}

export async function getAdminAnalyticsSummary(
  prisma: PrismaClient,
  query: AdminAnalyticsSummaryQuery
): Promise<AdminAnalyticsSummaryResponse> {
  const counts = await getAdminAnalyticsSummaryCounts(prisma, query);

  return {
    data: counts,
    meta: {
      appliedFilters: toAppliedDateRangeFilters(query)
    }
  };
}

export async function listAdminAnalyticsEvents(
  prisma: PrismaClient,
  query: AdminAnalyticsEventsQuery
): Promise<AdminAnalyticsEventsResponse> {
  const { items, total } = await listAdminAnalyticsEventRecords(prisma, query);

  return {
    data: {
      items: items.map(toAdminAnalyticsEventResponse)
    },
    meta: {
      pagination: buildPagination(query, total),
      appliedFilters: {
        ...toAppliedDateRangeFilters(query),
        ...(query.eventType === undefined ? {} : { eventType: query.eventType }),
        ...(query.userId === undefined ? {} : { userId: query.userId }),
        ...(query.productId === undefined ? {} : { productId: query.productId }),
        ...(query.outfitId === undefined ? {} : { outfitId: query.outfitId })
      }
    }
  };
}

export async function listAdminAnalyticsRedirects(
  prisma: PrismaClient,
  query: AdminAnalyticsRedirectsQuery
): Promise<AdminAnalyticsRedirectsResponse> {
  const { items, total } = await listAdminAnalyticsRedirectRecords(prisma, query);

  return {
    data: {
      items: items.map(toAdminAnalyticsRedirectResponse)
    },
    meta: {
      pagination: buildPagination(query, total),
      appliedFilters: {
        ...toAppliedDateRangeFilters(query),
        ...(query.productId === undefined ? {} : { productId: query.productId }),
        ...(query.sourcePlatformId === undefined
          ? {}
          : { sourcePlatformId: query.sourcePlatformId }),
        ...(query.sourceScreen === undefined ? {} : { sourceScreen: query.sourceScreen })
      }
    }
  };
}
