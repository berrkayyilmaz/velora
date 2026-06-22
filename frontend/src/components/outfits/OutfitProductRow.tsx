import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { ProductImage } from "@/components/products/ProductImage";
import type { ProductSummary } from "@/types/product";
import { formatProductPrice } from "@/utils/price";

type OutfitProductRowProps = {
  product: ProductSummary;
  isRemoving: boolean;
  isOpeningRetailer: boolean;
  removeDisabled: boolean;
  retailerDisabled: boolean;
  onRemove: (productId: string) => void;
  onViewRetailer: (productId: string) => void;
};

export function OutfitProductRow({
  product,
  isRemoving,
  isOpeningRetailer,
  removeDisabled,
  retailerDisabled,
  onRemove,
  onViewRetailer
}: OutfitProductRowProps) {
  const router = useRouter();

  return (
    <View className="flex-row gap-4 border-b border-neutral-200 py-4">
      <Pressable
        accessibilityLabel={`View ${product.title}`}
        accessibilityRole="button"
        className="w-24 overflow-hidden rounded-md"
        onPress={() =>
          router.push({
            pathname: "/products/[productId]",
            params: { productId: product.id }
          })
        }
      >
        <ProductImage
          aspectRatio={1}
          imageUrl={product.imageUrl}
          title={product.title}
        />
      </Pressable>

      <View className="flex-1 justify-between gap-3">
        <Pressable
          accessibilityLabel={`View ${product.title}`}
          accessibilityRole="button"
          onPress={() =>
            router.push({
              pathname: "/products/[productId]",
              params: { productId: product.id }
            })
          }
        >
          <Text className="text-xs text-neutral-600" numberOfLines={1}>
            {product.brand.name}
          </Text>
          <Text className="mt-1 text-base font-medium text-neutral-950" numberOfLines={2}>
            {product.title}
          </Text>
          <Text className="mt-2 text-sm font-semibold text-neutral-950">
            {formatProductPrice(product.price)}
          </Text>
        </Pressable>

        <View className="flex-row gap-2">
          <Pressable
            accessibilityLabel={`View ${product.title} at retailer`}
            accessibilityRole="button"
            className="h-10 items-center justify-center rounded-md bg-neutral-950 px-3"
            disabled={retailerDisabled}
            onPress={() => onViewRetailer(product.id)}
          >
            <Text className="text-sm font-semibold text-white">
              {isOpeningRetailer ? "Opening" : "Retailer"}
            </Text>
          </Pressable>
          <Pressable
            accessibilityLabel={`Remove ${product.title} from outfit`}
            accessibilityRole="button"
            className="h-10 items-center justify-center rounded-md border border-neutral-300 px-3"
            disabled={removeDisabled}
            onPress={() => onRemove(product.id)}
          >
            <Text className="text-sm font-semibold text-neutral-900">
              {isRemoving ? "Removing" : "Remove"}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
