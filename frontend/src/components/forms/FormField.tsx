import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import { type TextInputProps } from "react-native";

import { Input } from "@/components/ui/Input";

type FormFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  inputProps?: TextInputProps;
};

export function FormField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  inputProps
}: FormFieldProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onBlur, onChange, ref, value }, fieldState: { error } }) => (
        <Input
          {...inputProps}
          ref={ref}
          editable={inputProps?.editable ?? true}
          error={error?.message}
          label={label}
          onBlur={onBlur}
          onChangeText={onChange}
          value={typeof value === "string" ? value : ""}
        />
      )}
    />
  );
}
