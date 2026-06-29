import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { WardrobeItemForm } from "@/components/wardrobe/WardrobeItemForm";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useCreateWardrobeItem } from "@/hooks/useWardrobe";
import type { WardrobeItemFormValues } from "@/schemas/wardrobe.schemas";

const defaultValues: WardrobeItemFormValues = {
  title: "",
  categoryId: "",
  color: "",
  brandLabel: "",
  notes: "",
  status: ""
};

function optionalText(value: string) {
  const trimmedValue = value.trim();

  return trimmedValue === "" ? null : trimmedValue;
}

export function CreateWardrobeItemScreen() {
  const router = useRouter();
  const createMutation = useCreateWardrobeItem();

  const closeForm = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/wardrobe");
    }
  };

  const createItem = (values: WardrobeItemFormValues) => {
    createMutation.reset();
    createMutation.mutate(
      {
        title: values.title.trim(),
        categoryId: values.categoryId,
        color: optionalText(values.color),
        brandLabel: optionalText(values.brandLabel),
        notes: optionalText(values.notes)
      },
      {
        onSuccess: (item) =>
          router.replace({
            pathname: "/wardrobe/[wardrobeItemId]",
            params: { wardrobeItemId: item.id, notice: "created" }
          })
      }
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScreenHeader onBack={closeForm} title="Add Wardrobe Item" />
      <WardrobeItemForm
        apiError={createMutation.isError ? createMutation.error : undefined}
        defaultValues={defaultValues}
        isSubmitting={createMutation.isPending}
        mode="create"
        onCancel={closeForm}
        onSubmit={createItem}
      />
    </SafeAreaView>
  );
}
