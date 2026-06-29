import "../../global.css";

import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "nativewind";
import { useEffect } from "react";

import { AppProviders } from "@/providers/AppProviders";
import { useAuthStore } from "@/store/auth.store";

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const isAuthenticated = useAuthStore((state) => state.session !== null);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const hydrateSession = useAuthStore((state) => state.hydrateSession);

  useEffect(() => {
    void hydrateSession();
  }, [hydrateSession]);

  useEffect(() => {
    if (hasHydrated) {
      void SplashScreen.hideAsync();
    }
  }, [hasHydrated]);

  if (!hasHydrated) {
    return null;
  }

  return (
    <AppProviders>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={isAuthenticated}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="products/[productId]" />
          <Stack.Screen name="outfits/new" />
          <Stack.Screen name="outfits/[outfitId]" />
          <Stack.Screen name="wardrobe/new" />
          <Stack.Screen name="wardrobe/[wardrobeItemId]" />
          <Stack.Screen name="wardrobe/[wardrobeItemId]/edit" />
        </Stack.Protected>
      </Stack>
    </AppProviders>
  );
}
