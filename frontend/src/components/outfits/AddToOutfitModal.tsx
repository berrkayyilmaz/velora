import { useRouter } from "expo-router";
import { useMemo } from "react";
import { FlatList, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { useAddProductToOutfit, useOutfits } from "@/hooks/useOutfits";
import type { OutfitSummary } from "@/types/outfit";
import { getApiErrorMessage } from "@/utils/api-error";

type AddToOutfitModalProps = {
  productId: string;
  productTitle: string;
  visible: boolean;
  onClose: () => void;
};

export function AddToOutfitModal({
  productId,
  productTitle,
  visible,
  onClose
}: AddToOutfitModalProps) {
  const router = useRouter();
  const outfitsQuery = useOutfits();
  const addProductMutation = useAddProductToOutfit();
  const outfits = useMemo(
    () => outfitsQuery.data?.pages.flatMap((page) => page.data.items) ?? [],
    [outfitsQuery.data]
  );

  const loadNextPage = () => {
    if (outfitsQuery.hasNextPage && !outfitsQuery.isFetchingNextPage) {
      void outfitsQuery.fetchNextPage();
    }
  };

  const addToOutfit = (outfit: OutfitSummary) => {
    addProductMutation.reset();
    addProductMutation.mutate(
      { outfitId: outfit.id, productId },
      {
        onSuccess: onClose
      }
    );
  };

  const createOutfit = () => {
    onClose();
    router.push({
      pathname: "/outfits/new",
      params: { productId }
    });
  };
  const footer = (
    <Button onPress={createOutfit} size="lg">
      Create New Outfit
    </Button>
  );

  return (
    <Modal
      description={productTitle}
      footer={footer}
      onClose={onClose}
      title="Add to Outfit"
      visible={visible}
    >
      {addProductMutation.isError ? (
        <Text className="px-5 pt-4 text-center text-label text-destructive dark:text-destructive-dark">
          {getApiErrorMessage(addProductMutation.error)}
        </Text>
      ) : null}

      {outfitsQuery.isPending ? (
        <View className="h-64">
          <LoadingState label="Loading outfits" />
        </View>
      ) : outfitsQuery.isError ? (
        <ErrorState
          message={getApiErrorMessage(outfitsQuery.error)}
          onRetry={() => void outfitsQuery.refetch()}
        />
      ) : (
        <FlatList
          contentContainerStyle={{ paddingHorizontal: 20 }}
          data={outfits}
          keyExtractor={(outfit) => outfit.id}
          ListEmptyComponent={<EmptyState title="You have no saved outfits yet" />}
          ListFooterComponent={
            outfitsQuery.isFetchingNextPage ? (
              <View className="h-18">
                <LoadingState label="Loading more outfits" />
              </View>
            ) : null
          }
          onEndReached={loadNextPage}
          onEndReachedThreshold={0.4}
          renderItem={({ item }) => {
            const isAdding =
              addProductMutation.isPending &&
              addProductMutation.variables?.outfitId === item.id;

            return (
              <View className="flex-row items-center gap-4 border-b border-border py-4 dark:border-border-dark">
                <View className="flex-1">
                  <Text
                    className="font-semibold text-foreground dark:text-foreground-dark"
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  <Text className="mt-1 text-label text-muted-foreground dark:text-muted-foreground-dark">
                    {item.productCount} {item.productCount === 1 ? "product" : "products"}
                  </Text>
                </View>
                <Button
                  accessibilityLabel={`Add to ${item.name}`}
                  disabled={addProductMutation.isPending}
                  onPress={() => addToOutfit(item)}
                  size="sm"
                  variant="outline"
                >
                  {isAdding ? "Adding" : "Add"}
                </Button>
              </View>
            );
          }}
        />
      )}
    </Modal>
  );
}
