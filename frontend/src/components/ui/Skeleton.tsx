import { View, type ViewProps } from "react-native";

export function Skeleton({ className = "", ...props }: ViewProps & { className?: string }) {
  return (
    <View
      accessibilityElementsHidden
      className={`rounded-control bg-secondary dark:bg-secondary-dark ${className}`}
      {...props}
    />
  );
}
