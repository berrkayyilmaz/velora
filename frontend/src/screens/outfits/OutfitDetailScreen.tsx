import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pencil, Trash2 } from "lucide-react-native";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FormField } from "@/components/forms/FormField";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { OutfitProductRow } from "@/components/outfits/OutfitProductRow";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import {
  useDeleteOutfit,
  useOutfit,
  useRemoveProductFromOutfit,
  useUpdateOutfit
} from "@/hooks/useOutfits";
import { useRetailerRedirect } from "@/hooks/useRetailerRedirect";
import { useThemeColors } from "@/hooks/useThemeColors";
import {
  outfitNameFormSchema,
  type OutfitNameFormValues
} from "@/schemas/outfit.schemas";
import type { ProductSummary } from "@/types/product";
import { getApiErrorMessage } from "@/utils/api-error";

export function OutfitDetailScreen() {
  const router = useRouter();
  const colors = useThemeColors();
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
  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/outfits");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScreenHeader onBack={goBack} title="Outfit" />

      {outfitQuery.isPending ? (
        <LoadingState label="Loading outfit" />
      ) : outfitQuery.isError ? (
        <ErrorState
          message={getApiErrorMessage(outfitQuery.error)}
          onRetry={() => void outfitQuery.refetch()}
        />
      ) : outfitQuery.data === undefined ? (
        <EmptyState title="Outfit not found" />
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
            <EmptyState
              description="Add products from a product detail page."
              title="This outfit has no products yet"
            />
          }
          ListHeaderComponent={
            <View className="gap-5 border-b border-border py-5 dark:border-border-dark">
              {isEditing ? (
                <View className="gap-3">
                  {updateOutfitMutation.isError ? (
                    <Text className="text-label text-destructive dark:text-destructive-dark">
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
                  <Button
                    disabled={updateOutfitMutation.isPending}
                    onPress={() => {
                      reset({ name: outfitQuery.data.name });
                      setIsEditing(false);
                    }}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </View>
              ) : (
                <View className="gap-2">
                  <Text className="text-title font-semibold text-foreground dark:text-foreground-dark">
                    {outfitQuery.data.name}
                  </Text>
                  <Text className="text-label text-muted-foreground dark:text-muted-foreground-dark">
                    {outfitQuery.data.productCount}{" "}
                    {outfitQuery.data.productCount === 1 ? "product" : "products"}
                  </Text>
                  {outfitQuery.data.includedCategories.length > 0 ? (
                    <View className="flex-row flex-wrap gap-2">
                      {outfitQuery.data.includedCategories.map((category) => (
                        <Badge key={category.id} variant="outline">
                          {category.name}
                        </Badge>
                      ))}
                    </View>
                  ) : null}
                </View>
              )}

              {!isEditing ? (
                <View className="flex-row gap-3">
                  <Button
                    className="flex-1"
                    leftIcon={<Pencil color={colors.foreground} size={17} />}
                    onPress={() => setIsEditing(true)}
                    variant="outline"
                  >
                    Rename
                  </Button>
                  <Button
                    className="flex-1"
                    leftIcon={<Trash2 color={colors.destructive} size={17} />}
                    onPress={() => setIsConfirmingDelete(true)}
                    variant="destructive-outline"
                  >
                    Delete
                  </Button>
                </View>
              ) : null}

              {isConfirmingDelete ? (
                <Card className="gap-3 border-destructive p-4 dark:border-destructive-dark">
                  <Text className="text-label text-destructive dark:text-destructive-dark">
                    Delete this outfit permanently?
                  </Text>
                  {deleteOutfitMutation.isError ? (
                    <Text className="text-label text-destructive dark:text-destructive-dark">
                      {getApiErrorMessage(deleteOutfitMutation.error)}
                    </Text>
                  ) : null}
                  <View className="flex-row gap-3">
                    <Button
                      className="flex-1"
                      disabled={deleteOutfitMutation.isPending}
                      onPress={() => setIsConfirmingDelete(false)}
                      size="sm"
                      variant="outline"
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1"
                      isLoading={deleteOutfitMutation.isPending}
                      loadingLabel="Deleting"
                      onPress={deleteCurrentOutfit}
                      size="sm"
                      variant="destructive"
                    >
                      Confirm Delete
                    </Button>
                  </View>
                </Card>
              ) : null}

              {outfitQuery.data.missingCategoryHints.length > 0 ? (
                <View className="flex-row flex-wrap gap-2">
                  {outfitQuery.data.missingCategoryHints.map((hint) => (
                    <Badge key={hint} variant="accent">
                      {hint}
                    </Badge>
                  ))}
                </View>
              ) : null}

              {removeProductMutation.isError ? (
                <Text className="text-label text-destructive dark:text-destructive-dark">
                  {getApiErrorMessage(removeProductMutation.error)}
                </Text>
              ) : null}

              {retailerRedirectMutation.isError ? (
                <Text className="text-label text-destructive dark:text-destructive-dark">
                  {getApiErrorMessage(retailerRedirectMutation.error)}
                </Text>
              ) : null}

              <Text className="text-heading font-semibold text-foreground dark:text-foreground-dark">
                Products
              </Text>
            </View>
          }
          renderItem={renderProduct}
        />
      )}
    </SafeAreaView>
  );
}
