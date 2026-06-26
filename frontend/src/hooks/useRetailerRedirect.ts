import { useMutation } from "@tanstack/react-query";
import * as Linking from "expo-linking";
import { Platform } from "react-native";

import { useAnalytics } from "@/hooks/useAnalytics";
import { createRetailerRedirect } from "@/services/redirect.service";

type WebRetailerWindow = {
  closed?: boolean;
  close: () => void;
  location: {
    href: string;
  };
  opener: unknown;
};

function openBlankRetailerWindow(): WebRetailerWindow | null {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return null;
  }

  const retailerWindow = window.open("about:blank", "_blank");

  if (retailerWindow !== null) {
    retailerWindow.opener = null;
  }

  return retailerWindow;
}

async function openRetailerUrl(productUrl: string, retailerWindow: WebRetailerWindow | null) {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    if (retailerWindow !== null && retailerWindow.closed !== true) {
      retailerWindow.location.href = productUrl;
      return;
    }

    const openedWindow = window.open(productUrl, "_blank", "noopener,noreferrer");

    if (openedWindow !== null) {
      openedWindow.opener = null;
      return;
    }

    throw new Error("Unable to open retailer in a new browser tab.");
  }

  await Linking.openURL(productUrl);
}

function closeRetailerWindow(retailerWindow: WebRetailerWindow | null) {
  if (retailerWindow !== null && retailerWindow.closed !== true) {
    retailerWindow.close();
  }
}

export function useRetailerRedirect() {
  const { trackEvent } = useAnalytics();

  return useMutation({
    mutationFn: async (input: Parameters<typeof createRetailerRedirect>[0]) => {
      const retailerWindow = openBlankRetailerWindow();

      try {
        const redirect = await createRetailerRedirect(input);

        trackEvent({
          eventType: "retailer_redirect_clicked",
          productId: input.productId,
          ...(input.outfitId === undefined ? {} : { outfitId: input.outfitId }),
          sourceScreen: input.sourceScreen
        });

        await openRetailerUrl(redirect.productUrl, retailerWindow);

        return redirect;
      } catch (error) {
        closeRetailerWindow(retailerWindow);
        throw error;
      }
    }
  });
}
