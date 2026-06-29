import type { PropsWithChildren } from "react";
import { View, type ViewProps } from "react-native";

export type CardProps = PropsWithChildren<
  ViewProps & {
    className?: string;
  }
>;

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <View
      className={`rounded-card border border-border bg-surface dark:border-border-dark dark:bg-surface-dark ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}
