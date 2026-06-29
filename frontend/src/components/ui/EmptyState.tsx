import type { ReactNode } from "react";
import { Text, View } from "react-native";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  icon,
  action,
  className = ""
}: EmptyStateProps) {
  return (
    <View className={`items-center justify-center px-6 py-10 ${className}`}>
      {icon === undefined ? null : <View className="mb-4">{icon}</View>}
      <Text className="text-center text-body font-semibold text-foreground dark:text-foreground-dark">
        {title}
      </Text>
      {description === undefined ? null : (
        <Text className="mt-2 max-w-sm text-center text-label text-muted-foreground dark:text-muted-foreground-dark">
          {description}
        </Text>
      )}
      {action === undefined ? null : <View className="mt-5">{action}</View>}
    </View>
  );
}
