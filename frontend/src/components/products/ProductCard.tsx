import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { ProductImage } from "@/components/products/ProductImage";
import { Card } from "@/components/ui/Card";
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
      className="mb-3 flex-1"
      onPress={() =>
        router.push({
          pathname: "/products/[productId]",
          params: { productId: product.id }
        })
      }
      style={{ maxWidth: "48.5%" }}
    >
      <Card className="overflow-hidden">
        <ProductImage imageUrl={product.imageUrl} title={product.title} />
        <View className="gap-1 p-3">
          <Text
            className="text-caption text-muted-foreground dark:text-muted-foreground-dark"
            numberOfLines={1}
          >
            {product.brand.name}
          </Text>
          <Text
            className="min-h-10 text-label font-medium text-foreground dark:text-foreground-dark"
            numberOfLines={2}
          >
            {product.title}
          </Text>
          <Text className="text-label font-semibold text-foreground dark:text-foreground-dark">
            {formatProductPrice(product.price)}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}
