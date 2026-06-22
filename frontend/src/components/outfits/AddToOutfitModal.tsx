import { useRouter } from "expo-router";
import { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <SafeAreaView className="flex-1 justify-end bg-black/40">
        <View className="max-h-[80%] rounded-t-md bg-white">
          <View className="flex-row items-center justify-between border-b border-neutral-200 px-5 py-4">
            <View className="flex-1 pr-4">
              <Text className="text-lg font-semibold text-neutral-950">Add to Outfit</Text>
              <Text className="mt-1 text-sm text-neutral-600" numberOfLines={1}>
                {productTitle}
              </Text>
            </View>
            <Pressable accessibilityRole="button" className="p-2" onPress={onClose}>
              <Text className="font-semibold text-neutral-900">Close</Text>
            </Pressable>
          </View>

          {addProductMutation.isError ? (
            <Text className="px-5 pt-4 text-center text-sm text-red-700">
              {getApiErrorMessage(addProductMutation.error)}
            </Text>
          ) : null}

          {outfitsQuery.isPending ? (
            <View className="items-center justify-center gap-3 py-12">
              <ActivityIndicator color="#171717" />
              <Text className="text-sm text-neutral-600">Loading outfits</Text>
            </View>
          ) : outfitsQuery.isError ? (
            <View className="items-center justify-center gap-4 px-6 py-12">
              <Text className="text-center text-sm text-red-700">
                {getApiErrorMessage(outfitsQuery.error)}
              </Text>
              <Pressable
                accessibilityRole="button"
                className="h-11 items-center justify-center rounded-md bg-neutral-950 px-5"
                onPress={() => void outfitsQuery.refetch()}
              >
                <Text className="font-semibold text-white">Retry</Text>
              </Pressable>
            </View>
          ) : (
            <FlatList
              contentContainerStyle={{ paddingHorizontal: 20 }}
              data={outfits}
              keyExtractor={(outfit) => outfit.id}
              ListEmptyComponent={
                <Text className="py-10 text-center text-sm text-neutral-600">
                  You have no saved outfits yet.
                </Text>
              }
              ListFooterComponent={
                outfitsQuery.isFetchingNextPage ? (
                  <View className="items-center py-4">
                    <ActivityIndicator color="#171717" />
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
                  <View className="flex-row items-center gap-4 border-b border-neutral-200 py-4">
                    <View className="flex-1">
                      <Text className="font-semibold text-neutral-950" numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text className="mt-1 text-sm text-neutral-600">
                        {item.productCount} {item.productCount === 1 ? "product" : "products"}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityLabel={`Add to ${item.name}`}
                      accessibilityRole="button"
                      className="h-10 items-center justify-center rounded-md border border-neutral-300 px-4"
                      disabled={addProductMutation.isPending}
                      onPress={() => addToOutfit(item)}
                    >
                      <Text className="text-sm font-semibold text-neutral-900">
                        {isAdding ? "Adding" : "Add"}
                      </Text>
                    </Pressable>
                  </View>
                );
              }}
            />
          )}

          <View className="border-t border-neutral-200 p-5">
            <Pressable
              accessibilityRole="button"
              className="h-12 items-center justify-center rounded-md bg-neutral-950 px-4"
              onPress={createOutfit}
            >
              <Text className="font-semibold text-white">Create New Outfit</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
