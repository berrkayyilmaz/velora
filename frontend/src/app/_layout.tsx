import "../../global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { AppProviders } from "@/providers/AppProviders";
import { useAuthStore } from "@/store/auth.store";

export default function RootLayout() {
  const isAuthenticated = useAuthStore((state) => state.session !== null);

  return (
    <AppProviders>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={isAuthenticated}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="products/[productId]" />
          <Stack.Screen name="outfits/new" />
          <Stack.Screen name="outfits/[outfitId]" />
        </Stack.Protected>
      </Stack>
    </AppProviders>
  );
}
