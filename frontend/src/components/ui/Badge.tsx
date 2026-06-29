import type { PropsWithChildren } from "react";
import { Text, View } from "react-native";

type BadgeVariant = "default" | "success" | "accent" | "destructive" | "outline";

const badgeVariants: Record<BadgeVariant, string> = {
  default: "bg-secondary dark:bg-secondary-dark",
  success: "bg-green-50 dark:bg-green-950",
  accent: "bg-red-50 dark:bg-red-950",
  destructive: "bg-red-50 dark:bg-red-950",
  outline: "border border-border bg-transparent dark:border-border-dark"
};

const textVariants: Record<BadgeVariant, string> = {
  default: "text-primary dark:text-foreground-dark",
  success: "text-success dark:text-success-dark",
  accent: "text-accent dark:text-accent-dark",
  destructive: "text-destructive dark:text-destructive-dark",
  outline: "text-muted-foreground dark:text-muted-foreground-dark"
};

export function Badge({
  children,
  variant = "default"
}: PropsWithChildren<{ variant?: BadgeVariant }>) {
  return (
    <View className={`self-start rounded-full px-2.5 py-1 ${badgeVariants[variant]}`}>
      <Text className={`text-caption font-semibold ${textVariants[variant]}`}>{children}</Text>
    </View>
  );
}
