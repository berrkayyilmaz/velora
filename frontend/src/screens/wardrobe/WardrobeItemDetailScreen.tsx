import { isAxiosError } from "axios";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ImagePlus, Image as ImageIcon, Pencil, Trash2 } from "lucide-react-native";
import { useState } from "react";
import { Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ProductImage } from "@/components/products/ProductImage";
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
import {
  useDeleteWardrobeMedia,
  useUploadWardrobeMedia
} from "@/hooks/useWardrobeMedia";
import type { WardrobeMediaType } from "@/types/wardrobe-media";
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

function getSupportedMediaType(asset: ImagePicker.ImagePickerAsset): WardrobeMediaType | null {
  if (
    asset.mimeType === "image/jpeg" ||
    asset.mimeType === "image/png" ||
    asset.mimeType === "image/webp"
  ) {
    return asset.mimeType;
  }

  const normalizedFileName = (asset.fileName ?? asset.uri).toLowerCase();

  if (normalizedFileName.endsWith(".jpg") || normalizedFileName.endsWith(".jpeg")) {
    return "image/jpeg";
  }

  if (normalizedFileName.endsWith(".png")) {
    return "image/png";
  }

  if (normalizedFileName.endsWith(".webp")) {
    return "image/webp";
  }

  return null;
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
  const uploadMediaMutation = useUploadWardrobeMedia();
  const deleteMediaMutation = useDeleteWardrobeMedia();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isConfirmingMediaDelete, setIsConfirmingMediaDelete] = useState(false);
  const [pickerError, setPickerError] = useState<string | null>(null);
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

  const selectAndUploadMedia = async () => {
    if (wardrobeItemId === undefined) {
      return;
    }

    setPickerError(null);
    uploadMediaMutation.reset();

    if (Platform.OS !== "web") {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        setPickerError("Photo library access is required to select an image.");
        return;
      }
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: false,
        base64: false,
        exif: false
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];

      if (asset === undefined) {
        setPickerError("No image was selected.");
        return;
      }

      const mediaType = getSupportedMediaType(asset);

      if (mediaType === null) {
        setPickerError("Select a JPEG, PNG, or WebP image.");
        return;
      }

      uploadMediaMutation.mutate({
        wardrobeItemId,
        uri: asset.uri,
        fileName: asset.fileName ?? `wardrobe-item.${mediaType.split("/")[1]}`,
        mediaType,
        ...(asset.file === undefined ? {} : { webFile: asset.file })
      });
    } catch {
      setPickerError("The image picker could not be opened.");
    }
  };

  const deleteCurrentMedia = () => {
    if (wardrobeItemId === undefined || wardrobeItemQuery.data?.primaryMedia == null) {
      return;
    }

    deleteMediaMutation.reset();
    deleteMediaMutation.mutate(
      {
        wardrobeItemId,
        mediaId: wardrobeItemQuery.data.primaryMedia.id
      },
      {
        onSuccess: () => setIsConfirmingMediaDelete(false)
      }
    );
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

          <View className="gap-3">
            <Text className="text-heading font-semibold text-foreground dark:text-foreground-dark">
              Image
            </Text>

            {wardrobeItemQuery.data.primaryMedia === null ? (
              <EmptyState
                action={
                  <Button
                    isLoading={uploadMediaMutation.isPending}
                    leftIcon={<ImagePlus color={colors.primaryForeground} size={18} />}
                    loadingLabel="Uploading Image"
                    onPress={() => void selectAndUploadMedia()}
                  >
                    Upload Image
                  </Button>
                }
                className="border border-border dark:border-border-dark"
                icon={<ImageIcon color={colors.mutedForeground} size={28} />}
                title="No image uploaded"
              />
            ) : (
              <Card className="overflow-hidden">
                <ProductImage
                  aspectRatio={1}
                  imageUrl={wardrobeItemQuery.data.primaryMedia.url}
                  title={wardrobeItemQuery.data.title}
                />
                <View className="gap-3 p-4">
                  <View className="flex-row items-center justify-between gap-3">
                    <Badge variant="success">Ready</Badge>
                    <Text className="text-caption text-muted-foreground dark:text-muted-foreground-dark">
                      {wardrobeItemQuery.data.primaryMedia.mediaType}
                    </Text>
                  </View>
                  <Button
                    isLoading={deleteMediaMutation.isPending}
                    leftIcon={<Trash2 color={colors.destructive} size={17} />}
                    loadingLabel="Deleting Image"
                    onPress={() => setIsConfirmingMediaDelete(true)}
                    variant="destructive-outline"
                  >
                    Delete Image
                  </Button>
                </View>
              </Card>
            )}

            {pickerError === null ? null : (
              <Text className="text-label text-destructive dark:text-destructive-dark">
                {pickerError}
              </Text>
            )}
            {uploadMediaMutation.isError ? (
              <Text className="text-label text-destructive dark:text-destructive-dark">
                {getApiErrorMessage(uploadMediaMutation.error)}
              </Text>
            ) : null}
          </View>

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
              disabled={deleteMediaMutation.isPending}
              onPress={() => setIsConfirmingMediaDelete(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              isLoading={deleteMediaMutation.isPending}
              loadingLabel="Deleting"
              onPress={deleteCurrentMedia}
              variant="destructive"
            >
              Delete Image
            </Button>
          </View>
        }
        onClose={() => {
          if (!deleteMediaMutation.isPending) {
            setIsConfirmingMediaDelete(false);
          }
        }}
        title="Delete wardrobe image?"
        visible={isConfirmingMediaDelete}
      >
        <View className="gap-3 p-5">
          <Text className="text-label text-muted-foreground dark:text-muted-foreground-dark">
            This permanently removes the uploaded image.
          </Text>
          {deleteMediaMutation.isError ? (
            <Text className="text-label text-destructive dark:text-destructive-dark">
              {getApiErrorMessage(deleteMediaMutation.error)}
            </Text>
          ) : null}
        </View>
      </Modal>

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
