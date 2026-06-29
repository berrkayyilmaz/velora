import { forwardRef } from "react";
import { Text, TextInput, type TextInputProps, View } from "react-native";

export type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
  className?: string;
};

export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    error,
    helperText,
    containerClassName = "",
    className = "",
    editable = true,
    ...props
  },
  ref
) {
  return (
    <View className={`gap-2 ${containerClassName}`}>
      {label === undefined ? null : (
        <Text className="text-label font-medium text-foreground dark:text-foreground-dark">
          {label}
        </Text>
      )}
      <TextInput
        ref={ref}
        className={`h-12 rounded-control border bg-surface px-4 text-body text-foreground dark:bg-surface-dark dark:text-foreground-dark ${
          error === undefined
            ? "border-border dark:border-border-dark"
            : "border-destructive dark:border-destructive-dark"
        } ${editable ? "" : "bg-secondary text-muted-foreground dark:bg-secondary-dark"} ${className}`}
        editable={editable}
        placeholderTextColor="#68706b"
        {...props}
      />
      {error === undefined ? null : (
        <Text className="text-label text-destructive dark:text-destructive-dark">{error}</Text>
      )}
      {error !== undefined || helperText === undefined ? null : (
        <Text className="text-caption text-muted-foreground dark:text-muted-foreground-dark">
          {helperText}
        </Text>
      )}
    </View>
  );
});
