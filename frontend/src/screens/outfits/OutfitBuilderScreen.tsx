import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useForm } from "react-hook-form";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FormField } from "@/components/forms/FormField";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
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
  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/products");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScreenHeader onBack={goBack} title="Create Outfit" />

      <View className="gap-5 px-5 py-6">
        {createOutfitMutation.isError ? (
          <Text className="text-label text-destructive dark:text-destructive-dark">
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
          <Text className="text-label text-muted-foreground dark:text-muted-foreground-dark">
            1 product selected
          </Text>
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
