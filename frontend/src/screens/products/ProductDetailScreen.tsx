import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AddToOutfitModal } from "@/components/outfits/AddToOutfitModal";
import { ProductImage } from "@/components/products/ProductImage";
import { useTrackProductView } from "@/hooks/useAnalytics";
import { useProduct } from "@/hooks/useProducts";
import { useRetailerRedirect } from "@/hooks/useRetailerRedirect";
import { useAddWishlistItem, useRemoveWishlistItem } from "@/hooks/useWishlist";
import { getApiErrorMessage } from "@/utils/api-error";
import { formatProductPrice } from "@/utils/price";

type DetailRowProps = {
  label: string;
  value: string;
};

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <View className="flex-row justify-between gap-4 border-b border-neutral-100 py-3">
      <Text className="text-sm text-neutral-600">{label}</Text>
      <Text className="flex-1 text-right text-sm font-medium text-neutral-950">{value}</Text>
    </View>
  );
}

export function ProductDetailScreen() {
  const router = useRouter();
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <View className="h-14 flex-row items-center border-b border-neutral-200 px-3">
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          className="h-11 w-11 items-center justify-center"
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/products");
            }
          }}
        >
          <Text className="text-2xl text-neutral-900">{"<"}</Text>
        </Pressable>
        <Text className="ml-2 text-lg font-semibold text-neutral-950">Product</Text>
      </View>

      {productQuery.isPending ? (
        <View className="flex-1 items-center justify-center gap-3">
          <ActivityIndicator color="#171717" />
          <Text className="text-sm text-neutral-600">Loading product</Text>
        </View>
      ) : productQuery.isError ? (
        <View className="flex-1 items-center justify-center gap-4 px-6">
          <Text className="text-center text-sm text-red-700">
            {getApiErrorMessage(productQuery.error)}
          </Text>
          <Pressable
            accessibilityRole="button"
            className="h-11 items-center justify-center rounded-md bg-neutral-950 px-5"
            onPress={() => void productQuery.refetch()}
          >
            <Text className="font-semibold text-white">Retry</Text>
          </Pressable>
        </View>
      ) : productQuery.data === undefined ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-base text-neutral-600">Product not found.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          <ProductImage
            aspectRatio={1}
            imageUrl={productQuery.data.imageUrl}
            title={productQuery.data.title}
          />
          <View className="gap-6 px-5 pt-5">
            <View className="gap-2">
              <Text className="text-sm text-neutral-600">{productQuery.data.brand.name}</Text>
              <Text className="text-2xl font-semibold text-neutral-950">
                {productQuery.data.title}
              </Text>
              <Text className="text-xl font-semibold text-neutral-950">
                {formatProductPrice(productQuery.data.price)}
              </Text>
            </View>

            <View>
              <DetailRow label="Category" value={productQuery.data.category.name} />
              <DetailRow label="Color" value={productQuery.data.color} />
              <DetailRow label="Retailer" value={productQuery.data.sourcePlatform.name} />
            </View>

            <View className="gap-3">
              <Pressable
                accessibilityRole="button"
                className="h-12 items-center justify-center rounded-md border border-neutral-300 bg-white px-4"
                disabled={wishlistMutation.isPending}
                onPress={() => {
                  if (productId !== undefined) {
                    wishlistMutation.mutate(productId);
                  }
                }}
              >
                <Text className="font-semibold text-neutral-900">
                  {wishlistMutation.isPending
                    ? "Updating Wishlist"
                    : productQuery.data.isFavorited
                      ? "Remove from Wishlist"
                      : "Add to Wishlist"}
                </Text>
              </Pressable>
              {wishlistMutation.isError ? (
                <Text className="text-center text-sm text-red-700">
                  {getApiErrorMessage(wishlistMutation.error)}
                </Text>
              ) : null}
              <Pressable
                accessibilityRole="button"
                className="h-12 items-center justify-center rounded-md bg-neutral-950 px-4"
                disabled={retailerRedirectMutation.isPending}
                onPress={() => {
                  if (productId !== undefined) {
                    retailerRedirectMutation.reset();
                    retailerRedirectMutation.mutate({
                      productId,
                      sourceScreen: "product_detail"
                    });
                  }
                }}
              >
                <Text className="font-semibold text-white">
                  {retailerRedirectMutation.isPending
                    ? "Opening Retailer"
                    : "View at Retailer"}
                </Text>
              </Pressable>
              {retailerRedirectMutation.isError ? (
                <Text className="text-center text-sm text-red-700">
                  {getApiErrorMessage(retailerRedirectMutation.error)}
                </Text>
              ) : null}
              <Pressable
                accessibilityRole="button"
                className="h-12 items-center justify-center rounded-md border border-neutral-300 bg-white px-4"
                onPress={() => setIsOutfitModalVisible(true)}
              >
                <Text className="font-semibold text-neutral-900">Add to Outfit</Text>
              </Pressable>
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
