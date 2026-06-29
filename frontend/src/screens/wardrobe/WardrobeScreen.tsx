import { useRouter } from "expo-router";
import { Archive, Eye, ListFilter, Plus, SearchX, Trash2 } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useProductFilterOptions } from "@/hooks/useProducts";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useDeleteWardrobeItem, useWardrobeItems } from "@/hooks/useWardrobe";
import type {
  WardrobeItem,
  WardrobeItemStatus,
  WardrobeListQuery,
  WardrobeSort
} from "@/types/wardrobe";
import { getApiErrorMessage } from "@/utils/api-error";

const SEARCH_DEBOUNCE_MS = 400;

type WardrobeFilters = {
  categoryId?: string;
  status?: WardrobeItemStatus;
  sort: WardrobeSort;
};

const statusOptions: { label: string; value: WardrobeItemStatus | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Draft", value: "draft" },
  { label: "Active", value: "active" },
  { label: "Archived", value: "archived" },
  { label: "Deletion pending", value: "deletion_pending" }
];

function getStatusBadge(item: WardrobeItem) {
  switch (item.status) {
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

type WardrobeItemCardProps = {
  item: WardrobeItem;
  isDeleting: boolean;
  onDelete: (item: WardrobeItem) => void;
  onView: (item: WardrobeItem) => void;
};

function WardrobeItemCard({
  item,
  isDeleting,
  onDelete,
  onView
}: WardrobeItemCardProps) {
  const colors = useThemeColors();

  return (
    <Card className="gap-3 p-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text
            className="text-heading font-semibold text-foreground dark:text-foreground-dark"
            numberOfLines={2}
          >
            {item.title}
          </Text>
          <Text className="mt-1 text-label text-muted-foreground dark:text-muted-foreground-dark">
            {item.category.name}
            {item.color === null ? "" : ` · ${item.color}`}
          </Text>
        </View>
        {getStatusBadge(item)}
      </View>

      {item.brandLabel === null ? null : (
        <Text className="text-label text-foreground dark:text-foreground-dark">
          {item.brandLabel}
        </Text>
      )}

      {item.notes === null ? null : (
        <Text
          className="text-label text-muted-foreground dark:text-muted-foreground-dark"
          numberOfLines={2}
        >
          {item.notes}
        </Text>
      )}

      <View className="flex-row gap-2">
        <Button
          className="flex-1"
          disabled={isDeleting}
          leftIcon={<Eye color={colors.foreground} size={16} />}
          onPress={() => onView(item)}
          size="sm"
          variant="outline"
        >
          View
        </Button>
        <Button
          accessibilityLabel={`Delete ${item.title}`}
          className="flex-1"
          disabled={isDeleting}
          leftIcon={<Trash2 color={colors.destructive} size={16} />}
          onPress={() => onDelete(item)}
          size="sm"
          variant="destructive-outline"
        >
          Delete
        </Button>
      </View>
    </Card>
  );
}

export function WardrobeScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const categoryOptionsQuery = useProductFilterOptions();
  const deleteMutation = useDeleteWardrobeItem();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState<WardrobeFilters>({ sort: "newest" });
  const [draftFilters, setDraftFilters] = useState<WardrobeFilters>(filters);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [pendingDeleteItem, setPendingDeleteItem] = useState<WardrobeItem | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const query = useMemo<WardrobeListQuery>(
    () => ({
      ...(debouncedSearch === "" ? {} : { search: debouncedSearch }),
      ...(filters.categoryId === undefined ? {} : { categoryId: filters.categoryId }),
      ...(filters.status === undefined ? {} : { status: filters.status }),
      sort: filters.sort
    }),
    [debouncedSearch, filters]
  );
  const wardrobeQuery = useWardrobeItems(query);
  const items = useMemo(
    () => wardrobeQuery.data?.pages.flatMap((page) => page.data.items) ?? [],
    [wardrobeQuery.data]
  );
  const activeFilterCount =
    Number(filters.categoryId !== undefined) +
    Number(filters.status !== undefined) +
    Number(filters.sort !== "newest");

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  const loadNextPage = useCallback(() => {
    if (wardrobeQuery.hasNextPage && !wardrobeQuery.isFetchingNextPage) {
      void wardrobeQuery.fetchNextPage();
    }
  }, [wardrobeQuery]);

  const openFilters = () => {
    setDraftFilters(filters);
    setFiltersVisible(true);
  };

  const clearFilters = () => {
    setDraftFilters({ sort: "newest" });
  };

  const applyFilters = () => {
    setFilters(draftFilters);
    setFiltersVisible(false);
  };

  const confirmDelete = () => {
    if (pendingDeleteItem === null) {
      return;
    }

    const item = pendingDeleteItem;
    setSuccessMessage(null);
    deleteMutation.reset();
    deleteMutation.mutate(item.id, {
      onSuccess: () => {
        setPendingDeleteItem(null);
        setSuccessMessage(`${item.title} deleted.`);
      }
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScreenHeader
        action={
          <View className="flex-row gap-1">
            <Button
              accessibilityLabel="Add wardrobe item"
              leftIcon={<Plus color={colors.primaryForeground} size={19} />}
              onPress={() => router.push("/wardrobe/new")}
              size="icon"
            >
              Add
            </Button>
            <Button
              accessibilityLabel={`Wardrobe filters${activeFilterCount === 0 ? "" : `, ${activeFilterCount} active`}`}
              leftIcon={<ListFilter color={colors.foreground} size={19} />}
              onPress={openFilters}
              size="icon"
              variant="outline"
            >
              Filters
            </Button>
          </View>
        }
        title="My Wardrobe"
      />

      <View className="border-b border-border bg-surface px-4 py-3 dark:border-border-dark dark:bg-surface-dark">
        <Input
          accessibilityLabel="Search wardrobe"
          autoCapitalize="none"
          autoCorrect={false}
          className="h-11"
          onChangeText={setSearchInput}
          onSubmitEditing={() => setDebouncedSearch(searchInput.trim())}
          placeholder="Search wardrobe"
          returnKeyType="search"
          value={searchInput}
        />
      </View>

      {wardrobeQuery.isPending ? (
        <LoadingState label="Loading wardrobe" />
      ) : wardrobeQuery.isError ? (
        <ErrorState
          message={getApiErrorMessage(wardrobeQuery.error)}
          onRetry={() => void wardrobeQuery.refetch()}
        />
      ) : (
        <FlatList
          contentContainerStyle={{
            flexGrow: items.length === 0 ? 1 : undefined,
            gap: 12,
            padding: 16
          }}
          data={items}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <EmptyState
              description="Try adjusting your search or filters."
              icon={
                debouncedSearch === "" && activeFilterCount === 0 ? (
                  <Archive color={colors.mutedForeground} size={30} />
                ) : (
                  <SearchX color={colors.mutedForeground} size={30} />
                )
              }
              title={
                debouncedSearch === "" && activeFilterCount === 0
                  ? "Your wardrobe is empty"
                  : "No wardrobe items found"
              }
            />
          }
          ListFooterComponent={
            wardrobeQuery.isFetchingNextPage ? (
              <View className="h-18">
                <LoadingState label="Loading more items" />
              </View>
            ) : null
          }
          ListHeaderComponent={
            successMessage === null ? null : (
              <Text className="pb-1 text-label text-success dark:text-success-dark">
                {successMessage}
              </Text>
            )
          }
          onEndReached={loadNextPage}
          onEndReachedThreshold={0.4}
          renderItem={({ item }) => (
            <WardrobeItemCard
              isDeleting={deleteMutation.isPending && deleteMutation.variables === item.id}
              item={item}
              onDelete={setPendingDeleteItem}
              onView={(wardrobeItem) =>
                router.push({
                  pathname: "/wardrobe/[wardrobeItemId]",
                  params: { wardrobeItemId: wardrobeItem.id }
                })
              }
            />
          )}
        />
      )}

      <Modal
        footer={
          <View className="flex-row gap-3">
            <Button className="flex-1" onPress={clearFilters} size="lg" variant="outline">
              Clear
            </Button>
            <Button className="flex-1" onPress={applyFilters} size="lg">
              Apply
            </Button>
          </View>
        }
        onClose={() => setFiltersVisible(false)}
        presentation="full"
        title="Wardrobe Filters"
        visible={filtersVisible}
      >
        {categoryOptionsQuery.isPending ? (
          <LoadingState label="Loading filters" />
        ) : categoryOptionsQuery.isError ? (
          <ErrorState
            message={getApiErrorMessage(categoryOptionsQuery.error)}
            onRetry={() => void categoryOptionsQuery.refetch()}
          />
        ) : (
          <ScrollView contentContainerStyle={{ gap: 28, padding: 20 }}>
            <View className="gap-3">
              <Text className="text-body font-semibold text-foreground dark:text-foreground-dark">
                Category
              </Text>
              <View className="flex-row flex-wrap gap-2">
                <Button
                  onPress={() =>
                    setDraftFilters((current) => ({ ...current, categoryId: undefined }))
                  }
                  size="sm"
                  variant={draftFilters.categoryId === undefined ? "primary" : "outline"}
                >
                  All
                </Button>
                {(categoryOptionsQuery.data?.categories ?? []).map((category) => (
                  <Button
                    key={category.id}
                    onPress={() =>
                      setDraftFilters((current) => ({
                        ...current,
                        categoryId: category.id
                      }))
                    }
                    size="sm"
                    variant={draftFilters.categoryId === category.id ? "primary" : "outline"}
                  >
                    {category.name}
                  </Button>
                ))}
              </View>
            </View>

            <View className="gap-3">
              <Text className="text-body font-semibold text-foreground dark:text-foreground-dark">
                Status
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {statusOptions.map((option) => (
                  <Button
                    key={option.label}
                    onPress={() =>
                      setDraftFilters((current) => ({
                        ...current,
                        status: option.value
                      }))
                    }
                    size="sm"
                    variant={draftFilters.status === option.value ? "primary" : "outline"}
                  >
                    {option.label}
                  </Button>
                ))}
              </View>
            </View>

            <View className="gap-3">
              <Text className="text-body font-semibold text-foreground dark:text-foreground-dark">
                Sort
              </Text>
              <View className="flex-row gap-2">
                {(["newest", "oldest"] as const).map((sort) => (
                  <Button
                    className="flex-1"
                    key={sort}
                    onPress={() => setDraftFilters((current) => ({ ...current, sort }))}
                    variant={draftFilters.sort === sort ? "primary" : "outline"}
                  >
                    {sort === "newest" ? "Newest" : "Oldest"}
                  </Button>
                ))}
              </View>
            </View>
          </ScrollView>
        )}
      </Modal>

      <Modal
        description={pendingDeleteItem?.title}
        footer={
          <View className="flex-row gap-3">
            <Button
              className="flex-1"
              disabled={deleteMutation.isPending}
              onPress={() => setPendingDeleteItem(null)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              isLoading={deleteMutation.isPending}
              loadingLabel="Deleting"
              onPress={confirmDelete}
              variant="destructive"
            >
              Delete
            </Button>
          </View>
        }
        onClose={() => {
          if (!deleteMutation.isPending) {
            setPendingDeleteItem(null);
          }
        }}
        title="Delete wardrobe item?"
        visible={pendingDeleteItem !== null}
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
