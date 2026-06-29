import { Heart } from "lucide-react-native";
import { FlatList, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { WishlistItemCard } from "@/components/wishlist/WishlistItemCard";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useRemoveWishlistItem, useWishlist } from "@/hooks/useWishlist";
import type { WishlistItem } from "@/types/wishlist";
import { getApiErrorMessage } from "@/utils/api-error";

export function WishlistScreen() {
  const colors = useThemeColors();
  const wishlistQuery = useWishlist();
  const removeWishlistItem = useRemoveWishlistItem("wishlist");
  const items = wishlistQuery.data?.data.items ?? [];

  const renderWishlistItem = ({ item }: { item: WishlistItem }) => (
    <WishlistItemCard
      isRemoving={
        removeWishlistItem.isPending && removeWishlistItem.variables === item.product.id
      }
      item={item}
      onRemove={(productId) => removeWishlistItem.mutate(productId)}
    />
  );

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScreenHeader title="Wishlist" />

      {wishlistQuery.isPending ? (
        <LoadingState label="Loading wishlist" />
      ) : wishlistQuery.isError ? (
        <ErrorState
          message={getApiErrorMessage(wishlistQuery.error)}
          onRetry={() => void wishlistQuery.refetch()}
        />
      ) : (
        <FlatList
          contentContainerStyle={{
            flexGrow: items.length === 0 ? 1 : undefined,
            paddingHorizontal: 16
          }}
          data={items}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <EmptyState
              description="Save products from their detail page to find them here."
              icon={<Heart color={colors.mutedForeground} size={30} />}
              title="Your wishlist is empty"
            />
          }
          ListHeaderComponent={
            removeWishlistItem.isError ? (
              <Text className="pt-4 text-center text-label text-destructive dark:text-destructive-dark">
                {getApiErrorMessage(removeWishlistItem.error)}
              </Text>
            ) : null
          }
          renderItem={renderWishlistItem}
        />
      )}
    </SafeAreaView>
  );
}
