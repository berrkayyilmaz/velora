import { useLocalSearchParams, useRouter } from "expo-router";
import { ExternalLink, Heart, HeartOff, Shirt } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AddToOutfitModal } from "@/components/outfits/AddToOutfitModal";
import { ProductImage } from "@/components/products/ProductImage";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useTrackProductView } from "@/hooks/useAnalytics";
import { useProduct } from "@/hooks/useProducts";
import { useRetailerRedirect } from "@/hooks/useRetailerRedirect";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useAddWishlistItem, useRemoveWishlistItem } from "@/hooks/useWishlist";
import { getApiErrorMessage } from "@/utils/api-error";
import { formatProductPrice } from "@/utils/price";

type DetailRowProps = {
  label: string;
  value: string;
};

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <View className="flex-row justify-between gap-4 border-b border-border py-3 dark:border-border-dark">
      <Text className="text-label text-muted-foreground dark:text-muted-foreground-dark">
        {label}
      </Text>
      <Text className="flex-1 text-right text-label font-medium text-foreground dark:text-foreground-dark">
        {value}
      </Text>
    </View>
  );
}

export function ProductDetailScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ productId?: string | string[] }>();
  const productId = Array.isArray(params.productId) ? params.productId[0] : params.productId;
  const productQuery = useProduct(productId);
  useTrackProductView(productId, productQuery.data !== undefined);
  const addWishlistItem = useAddWishlistItem();
  const removeWishlistItem = useRemoveWishlistItem();
  const retailerRedirectMutation = useRetailerRedirect();
  const [isOutfitModalVisible, setIsOutfitModalVisible] = useState(false);
  const wishlistMutation = productQuery.data?.isFavorited
    ? removeWishlistItem
    : addWishlistItem;
  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/products");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScreenHeader onBack={goBack} title="Product" />

      {productQuery.isPending ? (
        <LoadingState label="Loading product" />
      ) : productQuery.isError ? (
        <ErrorState
          message={getApiErrorMessage(productQuery.error)}
          onRetry={() => void productQuery.refetch()}
        />
      ) : productQuery.data === undefined ? (
        <EmptyState title="Product not found" />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          <ProductImage
            aspectRatio={1}
            imageUrl={productQuery.data.imageUrl}
            title={productQuery.data.title}
          />
          <View className="gap-6 px-5 pt-5">
            <View className="gap-2">
              <Text className="text-label text-muted-foreground dark:text-muted-foreground-dark">
                {productQuery.data.brand.name}
              </Text>
              <Text className="text-title font-semibold text-foreground dark:text-foreground-dark">
                {productQuery.data.title}
              </Text>
              <Text className="text-heading font-semibold text-foreground dark:text-foreground-dark">
                {formatProductPrice(productQuery.data.price)}
              </Text>
            </View>

            <View>
              <DetailRow label="Category" value={productQuery.data.category.name} />
              <DetailRow label="Color" value={productQuery.data.color} />
              <DetailRow label="Retailer" value={productQuery.data.sourcePlatform.name} />
            </View>

            <View className="gap-3">
              <Button
                isLoading={wishlistMutation.isPending}
                leftIcon={
                  productQuery.data.isFavorited ? (
                    <HeartOff color={colors.foreground} size={18} />
                  ) : (
                    <Heart color={colors.foreground} size={18} />
                  )
                }
                loadingLabel="Updating Wishlist"
                onPress={() => {
                  if (productId !== undefined) {
                    wishlistMutation.mutate(productId);
                  }
                }}
                size="lg"
                variant="outline"
              >
                {productQuery.data.isFavorited ? "Remove from Wishlist" : "Add to Wishlist"}
              </Button>
              {wishlistMutation.isError ? (
                <Text className="text-center text-label text-destructive dark:text-destructive-dark">
                  {getApiErrorMessage(wishlistMutation.error)}
                </Text>
              ) : null}
              <Button
                isLoading={retailerRedirectMutation.isPending}
                leftIcon={
                  <ExternalLink color={colors.primaryForeground} size={18} />
                }
                loadingLabel="Opening Retailer"
                onPress={() => {
                  if (productId !== undefined) {
                    retailerRedirectMutation.reset();
                    retailerRedirectMutation.mutate({
                      productId,
                      sourceScreen: "product_detail"
                    });
                  }
                }}
                size="lg"
              >
                View at Retailer
              </Button>
              {retailerRedirectMutation.isError ? (
                <Text className="text-center text-label text-destructive dark:text-destructive-dark">
                  {getApiErrorMessage(retailerRedirectMutation.error)}
                </Text>
              ) : null}
              <Button
                leftIcon={<Shirt color={colors.foreground} size={18} />}
                onPress={() => setIsOutfitModalVisible(true)}
                size="lg"
                variant="outline"
              >
                Add to Outfit
              </Button>
            </View>
          </View>
        </ScrollView>
      )}

      {isOutfitModalVisible && productQuery.data !== undefined && productId !== undefined ? (
        <AddToOutfitModal
          onClose={() => setIsOutfitModalVisible(false)}
          productId={productId}
          productTitle={productQuery.data.title}
          visible
        />
      ) : null}
    </SafeAreaView>
  );
}
