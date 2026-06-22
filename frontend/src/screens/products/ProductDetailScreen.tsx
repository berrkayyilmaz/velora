import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ProductImage } from "@/components/products/ProductImage";
import { useProduct } from "@/hooks/useProducts";
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

type PlaceholderActionProps = {
  label: string;
  primary?: boolean;
};

function PlaceholderAction({ label, primary = false }: PlaceholderActionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: true }}
      className={`h-12 items-center justify-center rounded-md border px-4 opacity-50 ${
        primary
          ? "border-neutral-950 bg-neutral-950"
          : "border-neutral-300 bg-white"
      }`}
      disabled
    >
      <Text className={`font-semibold ${primary ? "text-white" : "text-neutral-900"}`}>
        {label}
      </Text>
    </Pressable>
  );
}

export function ProductDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ productId?: string | string[] }>();
  const productId = Array.isArray(params.productId) ? params.productId[0] : params.productId;
  const productQuery = useProduct(productId);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <View className="h-14 flex-row items-center border-b border-neutral-200 px-3">
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          className="h-11 w-11 items-center justify-center"
          onPress={() => router.back()}
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
              <PlaceholderAction label="Add to Wishlist" />
              <PlaceholderAction label="Add to Outfit" />
              <PlaceholderAction label="View at Retailer" primary />
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
