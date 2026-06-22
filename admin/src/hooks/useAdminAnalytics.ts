import { useQuery } from "@tanstack/react-query";

import {
  getAdminAnalyticsEvents,
  getAdminAnalyticsRedirects,
  getAdminAnalyticsSummary
} from "@/services/admin-analytics.service";

const ANALYTICS_PAGE_SIZE = 20;

export const adminAnalyticsQueryKeys = {
  all: ["admin-analytics"] as const,
  summary: () => [...adminAnalyticsQueryKeys.all, "summary"] as const,
  events: (page: number) => [...adminAnalyticsQueryKeys.all, "events", page] as const,
  redirects: (page: number) => [...adminAnalyticsQueryKeys.all, "redirects", page] as const
};

export function useAdminAnalyticsSummary() {
  return useQuery({
    queryKey: adminAnalyticsQueryKeys.summary(),
    queryFn: getAdminAnalyticsSummary
  });
}

export function useAdminAnalyticsEvents(page: number) {
  return useQuery({
    queryKey: adminAnalyticsQueryKeys.events(page),
    queryFn: () => getAdminAnalyticsEvents({ page, pageSize: ANALYTICS_PAGE_SIZE })
  });
}

export function useAdminAnalyticsRedirects(page: number) {
  return useQuery({
    queryKey: adminAnalyticsQueryKeys.redirects(page),
    queryFn: () => getAdminAnalyticsRedirects({ page, pageSize: ANALYTICS_PAGE_SIZE })
  });
}
