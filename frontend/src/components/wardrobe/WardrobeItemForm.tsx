import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { ScrollView, Text, View } from "react-native";

import { FormField } from "@/components/forms/FormField";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { useProductFilterOptions } from "@/hooks/useProducts";
import {
  wardrobeItemFormSchema,
  type WardrobeItemFormValues
} from "@/schemas/wardrobe.schemas";
import { getApiErrorMessage } from "@/utils/api-error";

type WardrobeItemFormProps = {
  defaultValues: WardrobeItemFormValues;
  mode: "create" | "edit";
  isSubmitting: boolean;
  apiError?: unknown;
  onCancel: () => void;
  onSubmit: (values: WardrobeItemFormValues) => void;
};

const statusOptions = [
  { label: "Unchanged", value: "" },
  { label: "Draft", value: "draft" },
  { label: "Archived", value: "archived" }
] as const;

export function WardrobeItemForm({
  defaultValues,
  mode,
  isSubmitting,
  apiError,
  onCancel,
  onSubmit
}: WardrobeItemFormProps) {
  const categoryOptionsQuery = useProductFilterOptions();
  const { control, handleSubmit } = useForm<WardrobeItemFormValues>({
    resolver: zodResolver(wardrobeItemFormSchema),
    defaultValues
  });

  if (categoryOptionsQuery.isPending) {
    return <LoadingState label="Loading wardrobe form" />;
  }

  if (categoryOptionsQuery.isError) {
    return (
      <ErrorState
        message={getApiErrorMessage(categoryOptionsQuery.error)}
        onRetry={() => void categoryOptionsQuery.refetch()}
      />
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ gap: 20, padding: 20, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      {apiError === undefined ? null : (
        <Text className="text-label text-destructive dark:text-destructive-dark">
          {getApiErrorMessage(apiError)}
        </Text>
      )}

      <FormField
        control={control}
        inputProps={{
          autoCapitalize: "words",
          autoFocus: mode === "create",
          maxLength: 120,
          returnKeyType: "next"
        }}
        label="Title"
        name="title"
      />

      <Controller
        control={control}
        name="categoryId"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <View className="gap-2">
            <Text className="text-label font-medium text-foreground dark:text-foreground-dark">
              Category
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {(categoryOptionsQuery.data?.categories ?? []).map((category) => (
                <Button
                  key={category.id}
                  onPress={() => onChange(category.id)}
                  size="sm"
                  variant={value === category.id ? "primary" : "outline"}
                >
                  {category.name}
                </Button>
              ))}
            </View>
            {error === undefined ? null : (
              <Text className="text-label text-destructive dark:text-destructive-dark">
                Select a category.
              </Text>
            )}
          </View>
        )}
      />

      <FormField
        control={control}
        inputProps={{
          autoCapitalize: "words",
          maxLength: 100,
          returnKeyType: "next"
        }}
        label="Color"
        name="color"
      />

      <FormField
        control={control}
        inputProps={{
          autoCapitalize: "words",
          maxLength: 120,
          returnKeyType: "next"
        }}
        label="Brand"
        name="brandLabel"
      />

      <FormField
        control={control}
        inputProps={{
          maxLength: 1000,
          multiline: true,
          numberOfLines: 5,
          textAlignVertical: "top",
          className: "min-h-28 py-3"
        }}
        label="Notes"
        name="notes"
      />

      {mode === "edit" ? (
        <Controller
          control={control}
          name="status"
          render={({ field: { onChange, value } }) => (
            <View className="gap-2">
              <Text className="text-label font-medium text-foreground dark:text-foreground-dark">
                Status
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {statusOptions.map((option) => (
                  <Button
                    key={option.label}
                    onPress={() => onChange(option.value)}
                    size="sm"
                    variant={value === option.value ? "primary" : "outline"}
                  >
                    {option.label}
                  </Button>
                ))}
              </View>
            </View>
          )}
        />
      ) : null}

      <SubmitButton
        isLoading={isSubmitting}
        label={mode === "create" ? "Create Wardrobe Item" : "Save Changes"}
        loadingLabel={mode === "create" ? "Creating Item" : "Saving Changes"}
        onPress={handleSubmit(onSubmit)}
      />
      <Button disabled={isSubmitting} onPress={onCancel} size="lg" variant="outline">
        Cancel
      </Button>
    </ScrollView>
  );
}
