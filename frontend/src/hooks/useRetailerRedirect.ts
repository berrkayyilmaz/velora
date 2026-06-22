import { useMutation } from "@tanstack/react-query";
import * as Linking from "expo-linking";

import { createRetailerRedirect } from "@/services/redirect.service";

export function useRetailerRedirect() {
  return useMutation({
    mutationFn: async (input: Parameters<typeof createRetailerRedirect>[0]) => {
      const redirect = await createRetailerRedirect(input);

      await Linking.openURL(redirect.productUrl);

      return redirect;
    }
  });
}
