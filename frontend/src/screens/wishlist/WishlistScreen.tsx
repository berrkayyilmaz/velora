import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { WishlistItemCard } from "@/components/wishlist/WishlistItemCard";
import { useRemoveWishlistItem, useWishlist } from "@/hooks/useWishlist";
import type { WishlistItem } from "@/types/wishlist";
import { getApiErrorMessage } from "@/utils/api-error";

export function WishlistScreen() {
  const wishlistQuery = useWishlist();
  const removeWishlistItem = useRemoveWishlistItem();
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <View className="h-16 justify-center border-b border-neutral-200 px-4">
        <Text className="text-2xl font-semibold text-neutral-950">Wishlist</Text>
      </View>

      {wishlistQuery.isPending ? (
        <View className="flex-1 items-center justify-center gap-3">
          <ActivityIndicator color="#171717" />
          <Text className="text-sm text-neutral-600">Loading wishlist</Text>
        </View>
      ) : wishlistQuery.isError ? (
        <View className="flex-1 items-center justify-center gap-4 px-6">
          <Text className="text-center text-sm text-red-700">
            {getApiErrorMessage(wishlistQuery.error)}
          </Text>
          <Pressable
            accessibilityRole="button"
            className="h-11 items-center justify-center rounded-md bg-neutral-950 px-5"
            onPress={() => void wishlistQuery.refetch()}
          >
            <Text className="font-semibold text-white">Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{
            flexGrow: items.length === 0 ? 1 : undefined,
            paddingHorizontal: 16
          }}
          data={items}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center px-6">
              <Text className="text-center text-base font-medium text-neutral-950">
                Your wishlist is empty.
              </Text>
              <Text className="mt-2 text-center text-sm text-neutral-600">
                Save products from their detail page to find them here.
              </Text>
            </View>
          }
          ListHeaderComponent={
            removeWishlistItem.isError ? (
              <Text className="pt-4 text-center text-sm text-red-700">
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
