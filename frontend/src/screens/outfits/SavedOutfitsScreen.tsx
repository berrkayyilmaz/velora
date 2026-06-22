import { useRouter } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { OutfitCard } from "@/components/outfits/OutfitCard";
import { useOutfits } from "@/hooks/useOutfits";
import type { OutfitSummary } from "@/types/outfit";
import { getApiErrorMessage } from "@/utils/api-error";

export function SavedOutfitsScreen() {
  const router = useRouter();
  const outfitsQuery = useOutfits();
  const outfits = useMemo(
    () => outfitsQuery.data?.pages.flatMap((page) => page.data.items) ?? [],
    [outfitsQuery.data]
  );

  const loadNextPage = () => {
    if (outfitsQuery.hasNextPage && !outfitsQuery.isFetchingNextPage) {
      void outfitsQuery.fetchNextPage();
    }
  };

  const renderOutfit = ({ item }: { item: OutfitSummary }) => <OutfitCard outfit={item} />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <View className="h-16 flex-row items-center justify-between border-b border-neutral-200 px-4">
        <Text className="text-2xl font-semibold text-neutral-950">Outfits</Text>
        <Pressable
          accessibilityRole="button"
          className="h-10 items-center justify-center rounded-md bg-neutral-950 px-4"
          onPress={() => router.push("/outfits/new")}
        >
          <Text className="text-sm font-semibold text-white">Create</Text>
        </Pressable>
      </View>

      {outfitsQuery.isPending ? (
        <View className="flex-1 items-center justify-center gap-3">
          <ActivityIndicator color="#171717" />
          <Text className="text-sm text-neutral-600">Loading outfits</Text>
        </View>
      ) : outfitsQuery.isError ? (
        <View className="flex-1 items-center justify-center gap-4 px-6">
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
          contentContainerStyle={{
            flexGrow: outfits.length === 0 ? 1 : undefined,
            paddingHorizontal: 16
          }}
          data={outfits}
          keyExtractor={(outfit) => outfit.id}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center px-6">
              <Text className="text-center text-base font-medium text-neutral-950">
                You have no saved outfits.
              </Text>
              <Pressable
                accessibilityRole="button"
                className="mt-5 h-11 items-center justify-center rounded-md bg-neutral-950 px-5"
                onPress={() => router.push("/outfits/new")}
              >
                <Text className="font-semibold text-white">Create Outfit</Text>
              </Pressable>
            </View>
          }
          ListFooterComponent={
            outfitsQuery.isFetchingNextPage ? (
              <View className="items-center py-5">
                <ActivityIndicator color="#171717" />
              </View>
            ) : null
          }
          onEndReached={loadNextPage}
          onEndReachedThreshold={0.4}
          renderItem={renderOutfit}
        />
      )}
    </SafeAreaView>
  );
}
