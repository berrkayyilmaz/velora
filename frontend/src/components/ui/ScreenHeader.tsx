import { ArrowLeft } from "lucide-react-native";
import type { ReactNode } from "react";
import { Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { useThemeColors } from "@/hooks/useThemeColors";

type ScreenHeaderProps = {
  title: string;
  onBack?: () => void;
  action?: ReactNode;
};

export function ScreenHeader({ title, onBack, action }: ScreenHeaderProps) {
  const colors = useThemeColors();

  return (
    <View className="min-h-16 flex-row items-center border-b border-border bg-surface px-4 dark:border-border-dark dark:bg-surface-dark">
      {onBack === undefined ? null : (
        <Button
          accessibilityLabel="Go back"
          className="-ml-2"
          leftIcon={<ArrowLeft color={colors.foreground} size={22} />}
          onPress={onBack}
          size="icon"
          variant="ghost"
        >
          Back
        </Button>
      )}
      <Text
        className={`${onBack === undefined ? "" : "ml-1"} flex-1 text-title font-semibold text-foreground dark:text-foreground-dark`}
        numberOfLines={1}
      >
        {title}
      </Text>
      {action}
    </View>
  );
}
