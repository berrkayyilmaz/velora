import { isAxiosError } from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { WardrobeItemForm } from "@/components/wardrobe/WardrobeItemForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useUpdateWardrobeItem, useWardrobeItem } from "@/hooks/useWardrobe";
import type { WardrobeItemFormValues } from "@/schemas/wardrobe.schemas";
import { getApiErrorMessage } from "@/utils/api-error";

function optionalText(value: string) {
  const trimmedValue = value.trim();

  return trimmedValue === "" ? null : trimmedValue;
}

export function EditWardrobeItemScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ wardrobeItemId?: string | string[] }>();
  const wardrobeItemId = Array.isArray(params.wardrobeItemId)
    ? params.wardrobeItemId[0]
    : params.wardrobeItemId;
  const wardrobeItemQuery = useWardrobeItem(wardrobeItemId);
  const updateMutation = useUpdateWardrobeItem();
  const isNotFound =
    wardrobeItemId === undefined ||
    (wardrobeItemQuery.isError &&
      isAxiosError(wardrobeItemQuery.error) &&
      wardrobeItemQuery.error.response?.status === 404);

  const returnToDetail = () => {
    if (wardrobeItemId === undefined) {
      router.replace("/wardrobe");
      return;
    }

    router.replace({
      pathname: "/wardrobe/[wardrobeItemId]",
      params: { wardrobeItemId }
    });
  };

  const updateItem = (values: WardrobeItemFormValues) => {
    if (wardrobeItemId === undefined) {
      return;
    }

    updateMutation.reset();
    updateMutation.mutate(
      {
        wardrobeItemId,
        title: values.title.trim(),
        categoryId: values.categoryId,
        color: optionalText(values.color),
        brandLabel: optionalText(values.brandLabel),
        notes: optionalText(values.notes),
        ...(values.status === "" ? {} : { status: values.status })
      },
      {
        onSuccess: () =>
          router.replace({
            pathname: "/wardrobe/[wardrobeItemId]",
            params: { wardrobeItemId, notice: "updated" }
          })
      }
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScreenHeader onBack={returnToDetail} title="Edit Wardrobe Item" />

      {wardrobeItemQuery.isPending ? (
        <LoadingState label="Loading wardrobe item" />
      ) : isNotFound ? (
        <EmptyState title="Wardrobe item not found" />
      ) : wardrobeItemQuery.isError ? (
        <ErrorState
          message={getApiErrorMessage(wardrobeItemQuery.error)}
          onRetry={() => void wardrobeItemQuery.refetch()}
        />
      ) : wardrobeItemQuery.data === undefined ? (
        <EmptyState title="Wardrobe item not found" />
      ) : (
        <WardrobeItemForm
          apiError={updateMutation.isError ? updateMutation.error : undefined}
          defaultValues={{
            title: wardrobeItemQuery.data.title,
            categoryId: wardrobeItemQuery.data.category.id,
            color: wardrobeItemQuery.data.color ?? "",
            brandLabel: wardrobeItemQuery.data.brandLabel ?? "",
            notes: wardrobeItemQuery.data.notes ?? "",
            status:
              wardrobeItemQuery.data.status === "draft" ||
              wardrobeItemQuery.data.status === "active" ||
              wardrobeItemQuery.data.status === "archived"
                ? wardrobeItemQuery.data.status
                : ""
          }}
          isSubmitting={updateMutation.isPending}
          mode="edit"
          onCancel={returnToDetail}
          onSubmit={updateItem}
        />
      )}
    </SafeAreaView>
  );
}
