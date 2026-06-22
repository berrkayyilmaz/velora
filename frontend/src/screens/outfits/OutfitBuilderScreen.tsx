import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useForm } from "react-hook-form";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FormField } from "@/components/forms/FormField";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { useCreateOutfit } from "@/hooks/useOutfits";
import {
  outfitNameFormSchema,
  type OutfitNameFormValues
} from "@/schemas/outfit.schemas";
import { getApiErrorMessage } from "@/utils/api-error";

export function OutfitBuilderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ productId?: string | string[] }>();
  const productId = Array.isArray(params.productId) ? params.productId[0] : params.productId;
  const createOutfitMutation = useCreateOutfit();
  const { control, handleSubmit } = useForm<OutfitNameFormValues>({
    resolver: zodResolver(outfitNameFormSchema),
    defaultValues: {
      name: ""
    }
  });

  const onSubmit = handleSubmit((values) => {
    createOutfitMutation.reset();
    createOutfitMutation.mutate(
      {
        name: values.name,
        ...(productId === undefined ? {} : { productIds: [productId] })
      },
      {
        onSuccess: (outfit) =>
          router.replace({
            pathname: "/outfits/[outfitId]",
            params: { outfitId: outfit.id }
          })
      }
    );
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <View className="h-14 flex-row items-center border-b border-neutral-200 px-3">
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          className="h-11 w-11 items-center justify-center"
          onPress={() => router.back()}
        >
          <Text className="text-2xl text-neutral-900">{"<"}</Text>
        </Pressable>
        <Text className="ml-2 text-lg font-semibold text-neutral-950">Create Outfit</Text>
      </View>

      <View className="gap-5 px-5 py-6">
        {createOutfitMutation.isError ? (
          <Text className="text-sm text-red-700">
            {getApiErrorMessage(createOutfitMutation.error)}
          </Text>
        ) : null}

        <FormField
          control={control}
          name="name"
          label="Outfit Name"
          inputProps={{
            autoCapitalize: "words",
            autoFocus: true,
            maxLength: 100,
            returnKeyType: "done",
            onSubmitEditing: onSubmit
          }}
        />

        {productId !== undefined ? (
          <Text className="text-sm text-neutral-600">1 product selected</Text>
        ) : null}

        <SubmitButton
          isLoading={createOutfitMutation.isPending}
          label="Create Outfit"
          loadingLabel="Creating Outfit"
          onPress={onSubmit}
        />
      </View>
    </SafeAreaView>
  );
}
