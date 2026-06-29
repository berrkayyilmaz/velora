import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { ProductImage } from "@/components/products/ProductImage";
import { Button } from "@/components/ui/Button";
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
    <View className="flex-row gap-4 border-b border-border py-4 dark:border-border-dark">
      <Pressable
        accessibilityLabel={`View ${product.title}`}
        accessibilityRole="button"
        className="w-28 overflow-hidden rounded-card"
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
          <Text
            className="text-caption text-muted-foreground dark:text-muted-foreground-dark"
            numberOfLines={1}
          >
            {product.brand.name}
          </Text>
          <Text
            className="mt-1 text-body font-medium text-foreground dark:text-foreground-dark"
            numberOfLines={2}
          >
            {product.title}
          </Text>
          <Text className="mt-2 text-label font-semibold text-foreground dark:text-foreground-dark">
            {formatProductPrice(product.price)}
          </Text>
        </Pressable>

        <Button
          accessibilityLabel={`Remove ${product.title} from wishlist`}
          className="self-start"
          disabled={isRemoving}
          onPress={() => onRemove(product.id)}
          size="sm"
          variant="destructive-outline"
        >
          {isRemoving ? "Removing" : "Remove"}
        </Button>
      </View>
    </View>
  );
}
