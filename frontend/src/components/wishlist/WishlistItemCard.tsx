import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { ProductImage } from "@/components/products/ProductImage";
import type { WishlistItem } from "@/types/wishlist";
import { formatProductPrice } from "@/utils/price";

type WishlistItemCardProps = {
  item: WishlistItem;
  isRemoving: boolean;
  onRemove: (productId: string) => void;
};

export function WishlistItemCard({ item, isRemoving, onRemove }: WishlistItemCardProps) {
  const router = useRouter();
  const { product } = item;

  return (
    <View className="flex-row gap-4 border-b border-neutral-200 py-4">
      <Pressable
        accessibilityLabel={`View ${product.title}`}
        accessibilityRole="button"
        className="w-28 overflow-hidden rounded-md"
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

        <Pressable
          accessibilityLabel={`Remove ${product.title} from wishlist`}
          accessibilityRole="button"
          className="h-10 self-start items-center justify-center rounded-md border border-neutral-300 px-4"
          disabled={isRemoving}
          onPress={() => onRemove(product.id)}
        >
          <Text className="text-sm font-semibold text-neutral-900">
            {isRemoving ? "Removing" : "Remove"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
