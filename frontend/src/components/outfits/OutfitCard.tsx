import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { ProductImage } from "@/components/products/ProductImage";
import type { OutfitSummary } from "@/types/outfit";

type OutfitCardProps = {
  outfit: OutfitSummary;
};

export function OutfitCard({ outfit }: OutfitCardProps) {
  const router = useRouter();
  const previewItem = outfit.itemsPreview[0];
  const previewImage =
    previewItem?.type === "catalog_product"
      ? {
          imageUrl: previewItem.catalogProduct.imageUrl,
          title: previewItem.catalogProduct.title,
        }
      : previewItem?.wardrobeItem.primaryMedia === null ||
          previewItem?.wardrobeItem.primaryMedia === undefined
        ? null
        : {
            imageUrl: previewItem.wardrobeItem.primaryMedia.url,
            title: previewItem.wardrobeItem.title,
          };

  return (
    <Pressable
      accessibilityLabel={`View ${outfit.name}`}
      accessibilityRole="button"
      className="flex-row gap-4 border-b border-border py-4 dark:border-border-dark"
      onPress={() =>
        router.push({
          pathname: "/outfits/[outfitId]",
          params: { outfitId: outfit.id },
        })
      }
    >
      <View className="w-24 overflow-hidden rounded-card">
        {previewImage === null || previewImage === undefined ? (
          <View className="aspect-square items-center justify-center bg-secondary px-2 dark:bg-secondary-dark">
            <Text className="text-center text-caption text-muted-foreground dark:text-muted-foreground-dark">
              {previewItem === undefined ? "No items" : "No image"}
            </Text>
          </View>
        ) : (
          <ProductImage
            aspectRatio={1}
            imageUrl={previewImage.imageUrl}
            title={previewImage.title}
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
          {outfit.itemCount} {outfit.itemCount === 1 ? "item" : "items"}
        </Text>
      </View>
    </Pressable>
  );
}
