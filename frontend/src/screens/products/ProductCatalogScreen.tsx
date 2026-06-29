import { useState } from "react";
import { FlatList, View } from "react-native";
import { ListFilter, SearchX } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ProductCard } from "@/components/products/ProductCard";
import { ProductFiltersModal } from "@/components/products/ProductFiltersModal";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useProductCatalog } from "@/hooks/useProductCatalog";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { ProductSummary } from "@/types/product";
import { getApiErrorMessage } from "@/utils/api-error";

export function ProductCatalogScreen() {
  const colors = useThemeColors();
  const [filtersVisible, setFiltersVisible] = useState(false);
  const {
    filters,
    setFilters,
    searchInput,
    setSearchInput,
    submitSearch,
    products,
    activeFilterCount,
    loadNextPage,
    productsQuery
  } = useProductCatalog();

  const renderProduct = ({ item }: { item: ProductSummary }) => <ProductCard product={item} />;

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScreenHeader
        action={
          <Button
            leftIcon={<ListFilter color={colors.foreground} size={17} />}
            size="sm"
            variant="outline"
            onPress={() => setFiltersVisible(true)}
          >
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </Button>
        }
        title="Discover"
      />

      <View className="border-b border-border bg-surface px-4 py-3 dark:border-border-dark dark:bg-surface-dark">
        <Input
          accessibilityLabel="Search products"
          autoCapitalize="none"
          autoCorrect={false}
          className="h-11"
          onChangeText={setSearchInput}
          onSubmitEditing={submitSearch}
          placeholder="Search products"
          returnKeyType="search"
          value={searchInput}
        />
      </View>

      {productsQuery.isPending ? (
        <LoadingState label="Loading products" />
      ) : productsQuery.isError ? (
        <ErrorState
          message={getApiErrorMessage(productsQuery.error)}
          onRetry={() => void productsQuery.refetch()}
        />
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
            <EmptyState
              description="Try adjusting your search or clearing a filter."
              icon={<SearchX color={colors.mutedForeground} size={30} />}
              title="No products found"
            />
          }
          ListFooterComponent={
            productsQuery.isFetchingNextPage ? (
              <View className="h-18">
                <LoadingState label="Loading more products" />
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
