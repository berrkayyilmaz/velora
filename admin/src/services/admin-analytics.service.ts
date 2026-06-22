import { adminApiClient } from "@/services/api/client";
import type {
  AdminAnalyticsEventsResponse,
  AdminAnalyticsPageInput,
  AdminAnalyticsRedirectsResponse,
  AdminAnalyticsSummary,
  AdminAnalyticsSummaryResponse
} from "@/types/admin-analytics";

export async function getAdminAnalyticsSummary(): Promise<AdminAnalyticsSummary> {
  const response = await adminApiClient.get<AdminAnalyticsSummaryResponse>(
    "/admin/analytics/summary"
  );

  return response.data.data;
}

export async function getAdminAnalyticsEvents(
  input: AdminAnalyticsPageInput
): Promise<AdminAnalyticsEventsResponse> {
  const response = await adminApiClient.get<AdminAnalyticsEventsResponse>(
    "/admin/analytics/events",
    { params: input }
  );

  return response.data;
}

export async function getAdminAnalyticsRedirects(
  input: AdminAnalyticsPageInput
): Promise<AdminAnalyticsRedirectsResponse> {
  const response = await adminApiClient.get<AdminAnalyticsRedirectsResponse>(
    "/admin/analytics/redirects",
    { params: input }
  );

  return response.data;
}
