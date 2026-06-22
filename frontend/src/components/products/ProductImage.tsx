import { useState } from "react";
import { Image, Text, View } from "react-native";

type ProductImageProps = {
  imageUrl: string;
  title: string;
  aspectRatio?: number;
};

export function ProductImage({ imageUrl, title, aspectRatio = 0.8 }: ProductImageProps) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const hasError = failedImageUrl === imageUrl;

  return (
    <View
      className="w-full items-center justify-center overflow-hidden bg-neutral-100"
      style={{ aspectRatio }}
    >
      {hasError ? (
        <Text className="px-4 text-center text-sm text-neutral-500">Image unavailable</Text>
      ) : (
        <Image
          accessibilityLabel={title}
          onError={() => setFailedImageUrl(imageUrl)}
          resizeMode="cover"
          source={{ uri: imageUrl }}
          style={{ width: "100%", height: "100%" }}
        />
      )}
    </View>
  );
}
