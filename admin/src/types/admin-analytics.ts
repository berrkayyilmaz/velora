export type AdminAnalyticsSummary = {
  userCount: number;
  productCount: number;
  wishlistItemCount: number;
  outfitCount: number;
  analyticsEventCount: number;
  redirectCount: number;
};

export type AdminAnalyticsEvent = {
  id: string;
  userId: string | null;
  eventType: string;
  productId: string | null;
  outfitId: string | null;
  sourceScreen: string | null;
  metadata: unknown | null;
  createdAt: string;
};

export type AdminAnalyticsRedirect = {
  id: string;
  userId: string | null;
  productId: string;
  outfitId: string | null;
  sourcePlatformId: string;
  sourceScreen: string;
  createdAt: string;
};

export type AdminAnalyticsPagination = {
  page: number;
  pageSize: number;
  total: number;
  hasNextPage: boolean;
};

export type AdminAnalyticsPageInput = {
  page: number;
  pageSize: number;
};

export type AdminAnalyticsSummaryResponse = {
  data: AdminAnalyticsSummary;
};

export type AdminAnalyticsEventsResponse = {
  data: {
    items: AdminAnalyticsEvent[];
  };
  meta: {
    pagination: AdminAnalyticsPagination;
  };
};

export type AdminAnalyticsRedirectsResponse = {
  data: {
    items: AdminAnalyticsRedirect[];
  };
  meta: {
    pagination: AdminAnalyticsPagination;
  };
};
