import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FormField } from "@/components/forms/FormField";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { OutfitProductRow } from "@/components/outfits/OutfitProductRow";
import {
  useDeleteOutfit,
  useOutfit,
  useRemoveProductFromOutfit,
  useUpdateOutfit
} from "@/hooks/useOutfits";
import { useRetailerRedirect } from "@/hooks/useRetailerRedirect";
import {
  outfitNameFormSchema,
  type OutfitNameFormValues
} from "@/schemas/outfit.schemas";
import type { ProductSummary } from "@/types/product";
import { getApiErrorMessage } from "@/utils/api-error";

export function OutfitDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ outfitId?: string | string[] }>();
  const outfitId = Array.isArray(params.outfitId) ? params.outfitId[0] : params.outfitId;
  const outfitQuery = useOutfit(outfitId);
  const updateOutfitMutation = useUpdateOutfit();
  const deleteOutfitMutation = useDeleteOutfit();
  const removeProductMutation = useRemoveProductFromOutfit();
  const retailerRedirectMutation = useRetailerRedirect();
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const { control, handleSubmit, reset } = useForm<OutfitNameFormValues>({
    resolver: zodResolver(outfitNameFormSchema),
    defaultValues: {
      name: ""
    }
  });

  useEffect(() => {
    if (outfitQuery.data !== undefined) {
      reset({ name: outfitQuery.data.name });
    }
  }, [outfitQuery.data, reset]);

  const saveName = handleSubmit((values) => {
    if (outfitId === undefined) {
      return;
    }

    updateOutfitMutation.reset();
    updateOutfitMutation.mutate(
      { outfitId, name: values.name },
      {
        onSuccess: () => setIsEditing(false)
      }
    );
  });

  const deleteCurrentOutfit = () => {
    if (outfitId === undefined) {
      return;
    }

    deleteOutfitMutation.reset();
    deleteOutfitMutation.mutate(outfitId, {
      onSuccess: () => router.replace("/outfits")
    });
  };

  const removeProduct = (productId: string) => {
    if (outfitId !== undefined) {
      removeProductMutation.reset();
      removeProductMutation.mutate({ outfitId, productId });
    }
  };

  const openRetailer = (productId: string) => {
    if (outfitId !== undefined) {
      retailerRedirectMutation.reset();
      retailerRedirectMutation.mutate({
        productId,
        outfitId,
        sourceScreen: "outfit"
      });
    }
  };

  const renderProduct = ({ item }: { item: ProductSummary }) => (
    <OutfitProductRow
      isRemoving={
        removeProductMutation.isPending &&
        removeProductMutation.variables?.productId === item.id
      }
      isOpeningRetailer={
        retailerRedirectMutation.isPending &&
        retailerRedirectMutation.variables?.productId === item.id
      }
      onRemove={removeProduct}
      onViewRetailer={openRetailer}
      product={item}
      removeDisabled={removeProductMutation.isPending}
      retailerDisabled={retailerRedirectMutation.isPending}
    />
  );

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
        <Text className="ml-2 text-lg font-semibold text-neutral-950">Outfit</Text>
      </View>

      {outfitQuery.isPending ? (
        <View className="flex-1 items-center justify-center gap-3">
          <ActivityIndicator color="#171717" />
          <Text className="text-sm text-neutral-600">Loading outfit</Text>
        </View>
      ) : outfitQuery.isError ? (
        <View className="flex-1 items-center justify-center gap-4 px-6">
          <Text className="text-center text-sm text-red-700">
            {getApiErrorMessage(outfitQuery.error)}
          </Text>
          <Pressable
            accessibilityRole="button"
            className="h-11 items-center justify-center rounded-md bg-neutral-950 px-5"
            onPress={() => void outfitQuery.refetch()}
          >
            <Text className="font-semibold text-white">Retry</Text>
          </Pressable>
        </View>
      ) : outfitQuery.data === undefined ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-base text-neutral-600">Outfit not found.</Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{
            flexGrow: outfitQuery.data.products.length === 0 ? 1 : undefined,
            paddingHorizontal: 16,
            paddingBottom: 32
          }}
          data={outfitQuery.data.products}
          keyExtractor={(product) => product.id}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center px-6 py-12">
              <Text className="text-center text-base text-neutral-600">
                This outfit has no products yet.
              </Text>
            </View>
          }
          ListHeaderComponent={
            <View className="gap-5 border-b border-neutral-200 py-5">
              {isEditing ? (
                <View className="gap-3">
                  {updateOutfitMutation.isError ? (
                    <Text className="text-sm text-red-700">
                      {getApiErrorMessage(updateOutfitMutation.error)}
                    </Text>
                  ) : null}
                  <FormField control={control} label="Outfit Name" name="name" />
                  <SubmitButton
                    isLoading={updateOutfitMutation.isPending}
                    label="Save Name"
                    loadingLabel="Saving Name"
                    onPress={saveName}
                  />
                  <Pressable
                    accessibilityRole="button"
                    className="h-11 items-center justify-center rounded-md border border-neutral-300"
                    disabled={updateOutfitMutation.isPending}
                    onPress={() => {
                      reset({ name: outfitQuery.data.name });
                      setIsEditing(false);
                    }}
                  >
                    <Text className="font-semibold text-neutral-900">Cancel</Text>
                  </Pressable>
                </View>
              ) : (
                <View className="gap-2">
                  <Text className="text-2xl font-semibold text-neutral-950">
                    {outfitQuery.data.name}
                  </Text>
                  <Text className="text-sm text-neutral-600">
                    {outfitQuery.data.productCount}{" "}
                    {outfitQuery.data.productCount === 1 ? "product" : "products"}
                  </Text>
                  {outfitQuery.data.includedCategories.length > 0 ? (
                    <Text className="text-sm text-neutral-600">
                      {outfitQuery.data.includedCategories
                        .map((category) => category.name)
                        .join(", ")}
                    </Text>
                  ) : null}
                </View>
              )}

              {!isEditing ? (
                <View className="flex-row gap-3">
                  <Pressable
                    accessibilityRole="button"
                    className="h-11 flex-1 items-center justify-center rounded-md border border-neutral-300"
                    onPress={() => setIsEditing(true)}
                  >
                    <Text className="font-semibold text-neutral-900">Rename</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    className="h-11 flex-1 items-center justify-center rounded-md border border-red-300"
                    onPress={() => setIsConfirmingDelete(true)}
                  >
                    <Text className="font-semibold text-red-700">Delete</Text>
                  </Pressable>
                </View>
              ) : null}

              {isConfirmingDelete ? (
                <View className="gap-3 rounded-md border border-red-200 p-4">
                  <Text className="text-sm text-red-800">Delete this outfit permanently?</Text>
                  {deleteOutfitMutation.isError ? (
                    <Text className="text-sm text-red-700">
                      {getApiErrorMessage(deleteOutfitMutation.error)}
                    </Text>
                  ) : null}
                  <View className="flex-row gap-3">
                    <Pressable
                      accessibilityRole="button"
                      className="h-10 flex-1 items-center justify-center rounded-md border border-neutral-300"
                      disabled={deleteOutfitMutation.isPending}
                      onPress={() => setIsConfirmingDelete(false)}
                    >
                      <Text className="font-semibold text-neutral-900">Cancel</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      className="h-10 flex-1 items-center justify-center rounded-md bg-red-700"
                      disabled={deleteOutfitMutation.isPending}
                      onPress={deleteCurrentOutfit}
                    >
                      <Text className="font-semibold text-white">
                        {deleteOutfitMutation.isPending ? "Deleting" : "Confirm Delete"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}

              {outfitQuery.data.missingCategoryHints.length > 0 ? (
                <View className="gap-1">
                  {outfitQuery.data.missingCategoryHints.map((hint) => (
                    <Text className="text-sm text-neutral-600" key={hint}>
                      {hint}
                    </Text>
                  ))}
                </View>
              ) : null}

              {removeProductMutation.isError ? (
                <Text className="text-sm text-red-700">
                  {getApiErrorMessage(removeProductMutation.error)}
                </Text>
              ) : null}

              {retailerRedirectMutation.isError ? (
                <Text className="text-sm text-red-700">
                  {getApiErrorMessage(retailerRedirectMutation.error)}
                </Text>
              ) : null}

              <Text className="text-lg font-semibold text-neutral-950">Products</Text>
            </View>
          }
          renderItem={renderProduct}
        />
      )}
    </SafeAreaView>
  );
}
