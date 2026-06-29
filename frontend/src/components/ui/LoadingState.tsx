import { ActivityIndicator, Text, View } from "react-native";

import { useThemeColors } from "@/hooks/useThemeColors";

export function LoadingState({ label }: { label: string }) {
  const colors = useThemeColors();

  return (
    <View className="flex-1 items-center justify-center gap-3 bg-background dark:bg-background-dark">
      <ActivityIndicator color={colors.primary} />
      <Text className="text-label text-muted-foreground dark:text-muted-foreground-dark">
        {label}
      </Text>
    </View>
  );
}
