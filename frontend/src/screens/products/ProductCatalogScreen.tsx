import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ProductCard } from "@/components/products/ProductCard";
import { ProductFiltersModal } from "@/components/products/ProductFiltersModal";
import { useProductCatalog } from "@/hooks/useProductCatalog";
import type { ProductSummary } from "@/types/product";
import { getApiErrorMessage } from "@/utils/api-error";

export function ProductCatalogScreen() {
  const [filtersVisible, setFiltersVisible] = useState(false);
  const {
    filters,
    setFilters,
    products,
    activeFilterCount,
    loadNextPage,
    productsQuery
  } = useProductCatalog();

  const renderProduct = ({ item }: { item: ProductSummary }) => <ProductCard product={item} />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <View className="h-16 flex-row items-center justify-between border-b border-neutral-200 px-4">
        <Text className="text-2xl font-semibold text-neutral-950">Discover</Text>
        <Pressable
          accessibilityRole="button"
          className="h-10 min-w-24 items-center justify-center rounded-md border border-neutral-300 bg-white px-3"
          onPress={() => setFiltersVisible(true)}
        >
          <Text className="text-sm font-semibold text-neutral-900">
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </Text>
        </Pressable>
      </View>

      {productsQuery.isPending ? (
        <View className="flex-1 items-center justify-center gap-3">
          <ActivityIndicator color="#171717" />
          <Text className="text-sm text-neutral-600">Loading products</Text>
        </View>
      ) : productsQuery.isError ? (
        <View className="flex-1 items-center justify-center gap-4 px-6">
          <Text className="text-center text-sm text-red-700">
            {getApiErrorMessage(productsQuery.error)}
          </Text>
          <Pressable
            accessibilityRole="button"
            className="h-11 items-center justify-center rounded-md bg-neutral-950 px-5"
            onPress={() => void productsQuery.refetch()}
          >
            <Text className="font-semibold text-white">Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{
            flexGrow: products.length === 0 ? 1 : undefined,
            padding: 16
          }}
          data={products}
          keyExtractor={(product) => product.id}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center px-6">
              <Text className="text-center text-base text-neutral-600">
                No products match these filters.
              </Text>
            </View>
          }
          ListFooterComponent={
            productsQuery.isFetchingNextPage ? (
              <View className="items-center py-5">
                <ActivityIndicator color="#171717" />
              </View>
            ) : null
          }
          numColumns={2}
          onEndReached={loadNextPage}
          onEndReachedThreshold={0.4}
          renderItem={renderProduct}
        />
      )}

      {filtersVisible ? (
        <ProductFiltersModal
          filters={filters}
          onApply={setFilters}
          onClose={() => setFiltersVisible(false)}
        />
      ) : null}
    </SafeAreaView>
  );
}
