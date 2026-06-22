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
      className="flex-row gap-4 border-b border-neutral-200 py-4"
      onPress={() =>
        router.push({
          pathname: "/outfits/[outfitId]",
          params: { outfitId: outfit.id }
        })
      }
    >
      <View className="w-24 overflow-hidden rounded-md">
        {previewProduct === undefined ? (
          <View className="aspect-square items-center justify-center bg-neutral-100 px-2">
            <Text className="text-center text-xs text-neutral-500">No products</Text>
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
        <Text className="text-lg font-semibold text-neutral-950" numberOfLines={2}>
          {outfit.name}
        </Text>
        <Text className="text-sm text-neutral-600">
          {outfit.productCount} {outfit.productCount === 1 ? "product" : "products"}
        </Text>
      </View>
    </Pressable>
  );
}
