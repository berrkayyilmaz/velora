import { useCallback, useEffect, useRef } from "react";

import { createAnalyticsEvent } from "@/services/analytics.service";
import type { CreateAnalyticsEventInput } from "@/types/analytics";

export function useAnalytics() {
  const trackEvent = useCallback((input: CreateAnalyticsEventInput) => {
    void createAnalyticsEvent(input).catch(() => undefined);
  }, []);

  return { trackEvent };
}

export function useTrackProductView(productId: string | undefined, isLoaded: boolean) {
  const { trackEvent } = useAnalytics();
  const trackedProductId = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded || productId === undefined || trackedProductId.current === productId) {
      return;
    }

    trackedProductId.current = productId;
    trackEvent({
      eventType: "product_viewed",
      productId,
      sourceScreen: "product_detail"
    });
  }, [isLoaded, productId, trackEvent]);
}
