export type AnalyticsEventType =
  | "product_viewed"
  | "product_searched"
  | "product_filter_applied"
  | "product_favorited"
  | "product_unfavorited"
  | "outfit_created"
  | "outfit_saved"
  | "product_added_to_outfit"
  | "product_removed_from_outfit"
  | "retailer_redirect_clicked";

export type AnalyticsSourceScreen =
  | "catalog"
  | "product_detail"
  | "wishlist"
  | "outfit"
  | "outfit_builder";

export type CreateAnalyticsEventInput = {
  eventType: AnalyticsEventType;
  productId?: string;
  outfitId?: string;
  sourceScreen?: AnalyticsSourceScreen;
};

export type AnalyticsEventResponse = {
  data: {
    accepted: boolean;
    eventId: string;
  };
};
