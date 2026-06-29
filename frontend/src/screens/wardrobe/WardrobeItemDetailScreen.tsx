import { isAxiosError } from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pencil, Trash2 } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useDeleteWardrobeItem, useWardrobeItem } from "@/hooks/useWardrobe";
import type { WardrobeItemStatus } from "@/types/wardrobe";
import { getApiErrorMessage } from "@/utils/api-error";

type DetailRowProps = {
  label: string;
  value: string;
};

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <View className="flex-row justify-between gap-4 border-b border-border py-3 dark:border-border-dark">
      <Text className="text-label text-muted-foreground dark:text-muted-foreground-dark">
        {label}
      </Text>
      <Text className="flex-1 text-right text-label font-medium text-foreground dark:text-foreground-dark">
        {value}
      </Text>
    </View>
  );
}

function StatusBadge({ status }: { status: WardrobeItemStatus }) {
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function WardrobeItemDetailScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const params = useLocalSearchParams<{
    wardrobeItemId?: string | string[];
    notice?: string | string[];
  }>();
  const wardrobeItemId = Array.isArray(params.wardrobeItemId)
    ? params.wardrobeItemId[0]
    : params.wardrobeItemId;
  const notice = Array.isArray(params.notice) ? params.notice[0] : params.notice;
  const wardrobeItemQuery = useWardrobeItem(wardrobeItemId);
  const deleteMutation = useDeleteWardrobeItem();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const isNotFound =
    wardrobeItemId === undefined ||
    (wardrobeItemQuery.isError &&
      isAxiosError(wardrobeItemQuery.error) &&
      wardrobeItemQuery.error.response?.status === 404);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/wardrobe");
    }
  };

  const deleteCurrentItem = () => {
    if (wardrobeItemId === undefined) {
      return;
    }

    deleteMutation.reset();
    deleteMutation.mutate(wardrobeItemId, {
      onSuccess: () => router.replace("/wardrobe")
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScreenHeader onBack={goBack} title="Wardrobe Item" />

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
        <ScrollView contentContainerStyle={{ gap: 20, padding: 20, paddingBottom: 32 }}>
          <View className="gap-3">
            <StatusBadge status={wardrobeItemQuery.data.status} />
            <Text className="text-title font-semibold text-foreground dark:text-foreground-dark">
              {wardrobeItemQuery.data.title}
            </Text>
            {wardrobeItemQuery.data.brandLabel === null ? null : (
              <Text className="text-body text-muted-foreground dark:text-muted-foreground-dark">
                {wardrobeItemQuery.data.brandLabel}
              </Text>
            )}
          </View>

          {notice === "created" || notice === "updated" ? (
            <Text className="text-label text-success dark:text-success-dark">
              Wardrobe item {notice}.
            </Text>
          ) : null}

          {wardrobeItemQuery.data.status === "draft" ? (
            <Card className="border-accent p-4 dark:border-accent-dark">
              <Text className="text-label font-semibold text-accent dark:text-accent-dark">
                Draft wardrobe item
              </Text>
            </Card>
          ) : null}

          <Card className="px-4">
            <DetailRow label="Category" value={wardrobeItemQuery.data.category.name} />
            <DetailRow label="Color" value={wardrobeItemQuery.data.color ?? "Not specified"} />
            <DetailRow
              label="Status"
              value={wardrobeItemQuery.data.status.replaceAll("_", " ")}
            />
            <DetailRow label="Created" value={formatDate(wardrobeItemQuery.data.createdAt)} />
            <DetailRow label="Updated" value={formatDate(wardrobeItemQuery.data.updatedAt)} />
          </Card>

          {wardrobeItemQuery.data.notes === null ? null : (
            <View className="gap-2">
              <Text className="text-heading font-semibold text-foreground dark:text-foreground-dark">
                Notes
              </Text>
              <Card className="p-4">
                <Text className="text-body text-foreground dark:text-foreground-dark">
                  {wardrobeItemQuery.data.notes}
                </Text>
              </Card>
            </View>
          )}

          <View className="flex-row gap-3">
            <Button
              className="flex-1"
              leftIcon={<Pencil color={colors.foreground} size={17} />}
              onPress={() =>
                router.push({
                  pathname: "/wardrobe/[wardrobeItemId]/edit",
                  params: { wardrobeItemId: wardrobeItemQuery.data.id }
                })
              }
              variant="outline"
            >
              Edit
            </Button>
            <Button
              className="flex-1"
              leftIcon={<Trash2 color={colors.destructive} size={17} />}
              onPress={() => setIsConfirmingDelete(true)}
              variant="destructive-outline"
            >
              Delete
            </Button>
          </View>
        </ScrollView>
      )}

      <Modal
        description={wardrobeItemQuery.data?.title}
        footer={
          <View className="flex-row gap-3">
            <Button
              className="flex-1"
              disabled={deleteMutation.isPending}
              onPress={() => setIsConfirmingDelete(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              isLoading={deleteMutation.isPending}
              loadingLabel="Deleting"
              onPress={deleteCurrentItem}
              variant="destructive"
            >
              Delete
            </Button>
          </View>
        }
        onClose={() => {
          if (!deleteMutation.isPending) {
            setIsConfirmingDelete(false);
          }
        }}
        title="Delete wardrobe item?"
        visible={isConfirmingDelete}
      >
        <View className="gap-3 p-5">
          <Text className="text-label text-muted-foreground dark:text-muted-foreground-dark">
            This permanently removes the item.
          </Text>
          {deleteMutation.isError ? (
            <Text className="text-label text-destructive dark:text-destructive-dark">
              {getApiErrorMessage(deleteMutation.error)}
            </Text>
          ) : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
