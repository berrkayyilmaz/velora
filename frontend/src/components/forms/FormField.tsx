import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import { Text, TextInput, type TextInputProps, View } from "react-native";

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
        <View className="gap-2">
          <Text className="text-sm font-medium text-neutral-800">{label}</Text>
          <TextInput
            {...inputProps}
            ref={ref}
            className={`h-12 rounded-md border bg-white px-4 text-base text-neutral-950 ${
              error === undefined ? "border-neutral-300" : "border-red-600"
            }`}
            editable={inputProps?.editable ?? true}
            onBlur={onBlur}
            onChangeText={onChange}
            placeholderTextColor="#737373"
            value={typeof value === "string" ? value : ""}
          />
          {error?.message !== undefined ? (
            <Text className="text-sm text-red-700">{error.message}</Text>
          ) : null}
        </View>
      )}
    />
  );
}
