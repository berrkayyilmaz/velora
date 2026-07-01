import { useRouter } from "expo-router";
import { Image as ImageIcon, Trash2 } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { ProductImage } from "@/components/products/ProductImage";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { OutfitWardrobeItemSummary } from "@/types/outfit";

type OutfitWardrobeItemRowProps = {
  wardrobeItem: OutfitWardrobeItemSummary;
  isRemoving: boolean;
  removeDisabled: boolean;
  onRemove: (wardrobeItemId: string) => void;
};

function StatusBadge({ status }: Pick<OutfitWardrobeItemSummary, "status">) {
  switch (status) {
    case "active":
      return <Badge variant="success">Active</Badge>;
    case "archived":
      return <Badge variant="outline">Archived</Badge>;
    case "deletion_pending":
      return <Badge variant="destructive">Deletion pending</Badge>;
    case "draft":
      return <Badge variant="accent">Draft</Badge>;
  }
}

export function OutfitWardrobeItemRow({
  wardrobeItem,
  isRemoving,
  removeDisabled,
  onRemove
}: OutfitWardrobeItemRowProps) {
  const router = useRouter();
  const colors = useThemeColors();
  const openDetail = () =>
    router.push({
      pathname: "/wardrobe/[wardrobeItemId]",
      params: { wardrobeItemId: wardrobeItem.id }
    });

  return (
    <View className="flex-row gap-4 border-b border-border py-4 dark:border-border-dark">
      <Pressable
        accessibilityLabel={`View ${wardrobeItem.title}`}
        accessibilityRole="button"
        className="h-24 w-24 items-center justify-center overflow-hidden rounded-card bg-secondary dark:bg-secondary-dark"
        onPress={openDetail}
      >
        {wardrobeItem.primaryMedia === null ? (
          <ImageIcon color={colors.mutedForeground} size={28} />
        ) : (
          <ProductImage
            aspectRatio={1}
            imageUrl={wardrobeItem.primaryMedia.url}
            title={wardrobeItem.title}
          />
        )}
      </Pressable>

      <View className="flex-1 justify-between gap-3">
        <Pressable
          accessibilityLabel={`View ${wardrobeItem.title}`}
          accessibilityRole="button"
          onPress={openDetail}
        >
          <View className="mb-2 flex-row items-start justify-between gap-2">
            <Text
              className="flex-1 text-body font-medium text-foreground dark:text-foreground-dark"
              numberOfLines={2}
            >
              {wardrobeItem.title}
            </Text>
            <StatusBadge status={wardrobeItem.status} />
          </View>
          <Text
            className="text-caption text-muted-foreground dark:text-muted-foreground-dark"
            numberOfLines={1}
          >
            {wardrobeItem.category.name}
            {wardrobeItem.color === null ? "" : ` / ${wardrobeItem.color}`}
          </Text>
        </Pressable>

        <Button
          accessibilityLabel={`Remove ${wardrobeItem.title} from outfit`}
          className="self-start"
          disabled={removeDisabled}
          leftIcon={<Trash2 color={colors.destructive} size={15} />}
          onPress={() => onRemove(wardrobeItem.id)}
          size="sm"
          variant="destructive-outline"
        >
          {isRemoving ? "Removing" : "Remove"}
        </Button>
      </View>
    </View>
  );
}
