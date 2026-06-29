import { useColorScheme } from "nativewind";

import { designTokens } from "@/theme/tokens";

export function useThemeColors() {
  const { colorScheme } = useColorScheme();

  return colorScheme === "dark" ? designTokens.colors.dark : designTokens.colors.light;
}
