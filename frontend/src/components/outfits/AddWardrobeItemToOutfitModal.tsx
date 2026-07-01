import { useRouter } from "expo-router";
import { useMemo } from "react";
import { FlatList, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import {
  useAddWardrobeItemToOutfit,
  useOutfits
} from "@/hooks/useOutfits";
import type { OutfitSummary } from "@/types/outfit";
import { getApiErrorMessage } from "@/utils/api-error";

type AddWardrobeItemToOutfitModalProps = {
  wardrobeItemId: string;
  wardrobeItemTitle: string;
  visible: boolean;
  onAdded: (outfit: OutfitSummary) => void;
  onClose: () => void;
};

export function AddWardrobeItemToOutfitModal({
  wardrobeItemId,
  wardrobeItemTitle,
  visible,
  onAdded,
  onClose
}: AddWardrobeItemToOutfitModalProps) {
  const router = useRouter();
  const outfitsQuery = useOutfits();
  const addWardrobeItemMutation = useAddWardrobeItemToOutfit();
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
    addWardrobeItemMutation.reset();
    addWardrobeItemMutation.mutate(
      {
        outfitId: outfit.id,
        wardrobeItemId
      },
      {
        onSuccess: () => {
          onAdded(outfit);
          onClose();
        }
      }
    );
  };

  return (
    <Modal
      description={wardrobeItemTitle}
      onClose={onClose}
      title="Add to Outfit"
      visible={visible}
    >
      {addWardrobeItemMutation.isError ? (
        <Text className="px-5 pt-4 text-center text-label text-destructive dark:text-destructive-dark">
          {getApiErrorMessage(addWardrobeItemMutation.error)}
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
          ListEmptyComponent={
            <EmptyState
              action={
                <Button
                  onPress={() => {
                    onClose();
                    router.push("/outfits");
                  }}
                  variant="outline"
                >
                  Open Outfits
                </Button>
              }
              title="You have no saved outfits yet"
            />
          }
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
              addWardrobeItemMutation.isPending &&
              addWardrobeItemMutation.variables?.outfitId === item.id;

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
                    {item.itemCount} {item.itemCount === 1 ? "item" : "items"}
                  </Text>
                </View>
                <Button
                  accessibilityLabel={`Add to ${item.name}`}
                  disabled={addWardrobeItemMutation.isPending}
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
