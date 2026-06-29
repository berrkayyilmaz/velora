import { Moon, Sun } from "lucide-react-native";
import { useColorScheme } from "nativewind";

import { Button } from "@/components/ui/Button";
import { useThemeColors } from "@/hooks/useThemeColors";

export function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const colors = useThemeColors();
  const isDark = colorScheme === "dark";
  const Icon = isDark ? Sun : Moon;

  return (
    <Button
      accessibilityLabel={isDark ? "Use light theme" : "Use dark theme"}
      leftIcon={
        <Icon color={colors.foreground} size={19} />
      }
      onPress={toggleColorScheme}
      size="icon"
      variant="outline"
    >
      {isDark ? "Light theme" : "Dark theme"}
    </Button>
  );
}
