import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  type PressableProps,
  type ViewStyle
} from "react-native";

import { useThemeColors } from "@/hooks/useThemeColors";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive"
  | "destructive-outline";
type ButtonSize = "sm" | "md" | "lg" | "icon";

export type ButtonProps = Omit<PressableProps, "children" | "style"> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingLabel?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  className?: string;
  style?: ViewStyle;
};

const containerVariants: Record<ButtonVariant, string> = {
  primary: "bg-primary dark:bg-primary-dark",
  secondary: "bg-secondary dark:bg-secondary-dark",
  outline:
    "border border-border bg-surface dark:border-border-dark dark:bg-surface-dark",
  ghost: "bg-transparent",
  destructive: "bg-destructive dark:bg-destructive",
  "destructive-outline":
    "border border-destructive bg-surface dark:border-destructive-dark dark:bg-surface-dark"
};

const textVariants: Record<ButtonVariant, string> = {
  primary: "text-primary-foreground dark:text-primary-foreground-dark",
  secondary: "text-primary dark:text-foreground-dark",
  outline: "text-foreground dark:text-foreground-dark",
  ghost: "text-primary dark:text-foreground-dark",
  destructive: "text-white dark:text-background-dark",
  "destructive-outline": "text-destructive dark:text-destructive-dark"
};

const sizeVariants: Record<ButtonSize, string> = {
  sm: "h-10 px-3",
  md: "h-11 px-4",
  lg: "h-12 px-5",
  icon: "h-11 w-11"
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  loadingLabel,
  leftIcon,
  rightIcon,
  className = "",
  disabled,
  style,
  ...props
}: ButtonProps) {
  const colors = useThemeColors();
  const isDisabled = disabled === true || isLoading;

  return (
    <Pressable
      accessibilityRole="button"
      className={`flex-row items-center justify-center gap-2 rounded-control ${containerVariants[variant]} ${sizeVariants[size]} ${isDisabled ? "opacity-50" : ""} ${className}`}
      disabled={isDisabled}
      style={({ pressed }) => [style, pressed && !isDisabled ? { opacity: 0.82 } : undefined]}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator
          color={
            variant === "outline" ||
            variant === "ghost" ||
            variant === "destructive-outline"
              ? colors.foreground
              : variant === "primary"
                ? colors.primaryForeground
                : "#ffffff"
          }
          size="small"
        />
      ) : (
        leftIcon
      )}
      {size === "icon" ? null : (
        <Text className={`text-label font-semibold ${textVariants[variant]}`}>
          {isLoading && loadingLabel !== undefined ? loadingLabel : children}
        </Text>
      )}
      {isLoading ? null : rightIcon}
    </Pressable>
  );
}
