import { useMutation } from "@tanstack/react-query";
import * as Linking from "expo-linking";

import { useAnalytics } from "@/hooks/useAnalytics";
import { createRetailerRedirect } from "@/services/redirect.service";

export function useRetailerRedirect() {
  const { trackEvent } = useAnalytics();

  return useMutation({
    mutationFn: async (input: Parameters<typeof createRetailerRedirect>[0]) => {
      const redirect = await createRetailerRedirect(input);

      trackEvent({
        eventType: "retailer_redirect_clicked",
        productId: input.productId,
        ...(input.outfitId === undefined ? {} : { outfitId: input.outfitId }),
        sourceScreen: input.sourceScreen
      });

      await Linking.openURL(redirect.productUrl);

      return redirect;
    }
  });
}
