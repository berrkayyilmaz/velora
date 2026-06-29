import { Tabs } from "expo-router";
import { Compass, Heart, Shirt, UserRound } from "lucide-react-native";
import { useColorScheme } from "nativewind";

import { designTokens } from "@/theme/tokens";

export default function TabsLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? designTokens.colors.dark : designTokens.colors.light;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600"
        }
      }}
    >
      <Tabs.Screen
        name="products"
        options={{
          title: "Discover",
          tabBarIcon: ({ color, size }) => <Compass color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: "Wishlist",
          tabBarIcon: ({ color, size }) => <Heart color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="outfits"
        options={{
          title: "Outfits",
          tabBarIcon: ({ color, size }) => <Shirt color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} />
        }}
      />
    </Tabs>
  );
}
