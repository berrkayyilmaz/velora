import { useRouter } from "expo-router";
import { ExternalLink, Trash2 } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { ProductImage } from "@/components/products/ProductImage";
import { Button } from "@/components/ui/Button";
import { useThemeColors } from "@/hooks/useThemeColors";
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
  const colors = useThemeColors();

  return (
    <View className="flex-row gap-4 border-b border-border py-4 dark:border-border-dark">
      <Pressable
        accessibilityLabel={`View ${product.title}`}
        accessibilityRole="button"
        className="w-24 overflow-hidden rounded-card"
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

        <View className="flex-row gap-2">
          <Button
            accessibilityLabel={`View ${product.title} at retailer`}
            disabled={retailerDisabled}
            leftIcon={<ExternalLink color={colors.primaryForeground} size={15} />}
            onPress={() => onViewRetailer(product.id)}
            size="sm"
          >
            {isOpeningRetailer ? "Opening" : "Retailer"}
          </Button>
          <Button
            accessibilityLabel={`Remove ${product.title} from outfit`}
            disabled={removeDisabled}
            leftIcon={<Trash2 color={colors.destructive} size={15} />}
            onPress={() => onRemove(product.id)}
            size="sm"
            variant="destructive-outline"
          >
            {isRemoving ? "Removing" : "Remove"}
          </Button>
        </View>
      </View>
    </View>
  );
}
