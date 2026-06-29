import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { ProductImage } from "@/components/products/ProductImage";
import type { OutfitSummary } from "@/types/outfit";

type OutfitCardProps = {
  outfit: OutfitSummary;
};

export function OutfitCard({ outfit }: OutfitCardProps) {
  const router = useRouter();
  const previewProduct = outfit.productsPreview[0];

  return (
    <Pressable
      accessibilityLabel={`View ${outfit.name}`}
      accessibilityRole="button"
      className="flex-row gap-4 border-b border-border py-4 dark:border-border-dark"
      onPress={() =>
        router.push({
          pathname: "/outfits/[outfitId]",
          params: { outfitId: outfit.id }
        })
      }
    >
      <View className="w-24 overflow-hidden rounded-card">
        {previewProduct === undefined ? (
          <View className="aspect-square items-center justify-center bg-secondary px-2 dark:bg-secondary-dark">
            <Text className="text-center text-caption text-muted-foreground dark:text-muted-foreground-dark">
              No products
            </Text>
          </View>
        ) : (
          <ProductImage
            aspectRatio={1}
            imageUrl={previewProduct.imageUrl}
            title={previewProduct.title}
          />
        )}
      </View>

      <View className="flex-1 justify-center gap-2">
        <Text
          className="text-heading font-semibold text-foreground dark:text-foreground-dark"
          numberOfLines={2}
        >
          {outfit.name}
        </Text>
        <Text className="text-label text-muted-foreground dark:text-muted-foreground-dark">
          {outfit.productCount} {outfit.productCount === 1 ? "product" : "products"}
        </Text>
      </View>
    </Pressable>
  );
}
