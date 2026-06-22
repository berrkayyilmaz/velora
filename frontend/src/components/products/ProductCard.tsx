import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { ProductImage } from "@/components/products/ProductImage";
import type { ProductSummary } from "@/types/product";
import { formatProductPrice } from "@/utils/price";

type ProductCardProps = {
  product: ProductSummary;
};

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();

  return (
    <Pressable
      accessibilityLabel={`View ${product.title}`}
      accessibilityRole="button"
      className="mb-3 flex-1 overflow-hidden rounded-md border border-neutral-200 bg-white"
      onPress={() =>
        router.push({
          pathname: "/products/[productId]",
          params: { productId: product.id }
        })
      }
      style={{ maxWidth: "48.5%" }}
    >
      <ProductImage imageUrl={product.imageUrl} title={product.title} />
      <View className="gap-1 p-3">
        <Text className="text-xs text-neutral-600" numberOfLines={1}>
          {product.brand.name}
        </Text>
        <Text className="text-sm font-medium text-neutral-950" numberOfLines={2}>
          {product.title}
        </Text>
        <Text className="text-sm font-semibold text-neutral-950">
          {formatProductPrice(product.price)}
        </Text>
      </View>
    </Pressable>
  );
}
