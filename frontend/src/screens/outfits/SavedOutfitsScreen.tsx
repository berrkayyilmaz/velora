import { useRouter } from "expo-router";
import { Plus, Shirt } from "lucide-react-native";
import { useMemo } from "react";
import { FlatList, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { OutfitCard } from "@/components/outfits/OutfitCard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useOutfits } from "@/hooks/useOutfits";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { OutfitSummary } from "@/types/outfit";
import { getApiErrorMessage } from "@/utils/api-error";

export function SavedOutfitsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
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
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScreenHeader
        action={
          <Button
            leftIcon={<Plus color={colors.primaryForeground} size={17} />}
            onPress={() => router.push("/outfits/new")}
            size="sm"
          >
            Create
          </Button>
        }
        title="Outfits"
      />

      {outfitsQuery.isPending ? (
        <LoadingState label="Loading outfits" />
      ) : outfitsQuery.isError ? (
        <ErrorState
          message={getApiErrorMessage(outfitsQuery.error)}
          onRetry={() => void outfitsQuery.refetch()}
        />
      ) : (
        <FlatList
          contentContainerStyle={{
            flexGrow: outfits.length === 0 ? 1 : undefined,
            paddingHorizontal: 16
          }}
          data={outfits}
          keyExtractor={(outfit) => outfit.id}
          ListEmptyComponent={
            <EmptyState
              action={
                <Button onPress={() => router.push("/outfits/new")}>Create Outfit</Button>
              }
              description="Combine products from any brand and save the result."
              icon={<Shirt color={colors.mutedForeground} size={30} />}
              title="You have no saved outfits"
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
          renderItem={renderOutfit}
        />
      )}
    </SafeAreaView>
  );
}
