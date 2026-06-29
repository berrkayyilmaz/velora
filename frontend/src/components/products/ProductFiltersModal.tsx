import { useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { useProductFilterOptions } from "@/hooks/useProducts";
import type { ProductFilters } from "@/types/product";
import { getApiErrorMessage } from "@/utils/api-error";

type ProductFiltersModalProps = {
  filters: ProductFilters;
  onApply: (filters: ProductFilters) => void;
  onClose: () => void;
};

type Choice = {
  label: string;
  value: string;
};

type ChoiceGroupProps = {
  title: string;
  choices: Choice[];
  selectedValue: string | undefined;
  showSwatch?: boolean;
  onSelect: (value: string) => void;
};

const COLOR_SWATCHES: Record<string, string> = {
  beige: "#d6c7aa",
  black: "#171717",
  blue: "#3b82f6",
  brown: "#795548",
  cream: "#fff7e6",
  gold: "#d4a72c",
  gray: "#737373",
  green: "#3f7d4a",
  grey: "#737373",
  ivory: "#fffff0",
  navy: "#1e3a5f",
  orange: "#f97316",
  pink: "#ec4899",
  purple: "#8b5cf6",
  red: "#dc2626",
  silver: "#a3a3a3",
  tan: "#c19a6b",
  white: "#ffffff",
  yellow: "#eab308"
};

function getColorSwatch(color: string): string {
  return COLOR_SWATCHES[color.toLowerCase()] ?? "#d4d4d4";
}

function ChoiceGroup({
  title,
  choices,
  selectedValue,
  showSwatch = false,
  onSelect
}: ChoiceGroupProps) {
  if (choices.length === 0) {
    return null;
  }

  return (
    <View className="gap-3">
      <Text className="text-body font-semibold text-foreground dark:text-foreground-dark">
        {title}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {choices.map((choice) => {
          const isSelected = selectedValue === choice.value;

          return (
            <Button
              leftIcon={
                showSwatch ? (
                  <View
                    className="h-4 w-4 rounded-full border border-border dark:border-border-dark"
                    style={{ backgroundColor: getColorSwatch(choice.label) }}
                  />
                ) : undefined
              }
              key={choice.value}
              onPress={() => onSelect(choice.value)}
              size="sm"
              variant={isSelected ? "primary" : "outline"}
            >
              {choice.label}
            </Button>
          );
        })}
      </View>
    </View>
  );
}

function parsePrice(value: string): number | undefined | null {
  if (value.trim() === "") {
    return undefined;
  }

  const price = Number(value);

  return Number.isFinite(price) && price >= 0 ? price : null;
}

export function ProductFiltersModal({
  filters,
  onApply,
  onClose
}: ProductFiltersModalProps) {
  const optionsQuery = useProductFilterOptions();
  const [draftFilters, setDraftFilters] = useState<ProductFilters>(filters);
  const [minPrice, setMinPrice] = useState(filters.minPrice?.toString() ?? "");
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice?.toString() ?? "");
  const [priceError, setPriceError] = useState<string | null>(null);

  const toggleFilter = (
    key: "brandId" | "categoryId" | "sourcePlatformId" | "color",
    value: string
  ) => {
    setDraftFilters((current) => ({
      ...current,
      [key]: current[key] === value ? undefined : value
    }));
  };

  const clearFilters = () => {
    setDraftFilters({});
    setMinPrice("");
    setMaxPrice("");
    setPriceError(null);
  };

  const applyFilters = () => {
    const parsedMinPrice = parsePrice(minPrice);
    const parsedMaxPrice = parsePrice(maxPrice);

    if (parsedMinPrice === null || parsedMaxPrice === null) {
      setPriceError("Prices must be valid non-negative numbers.");
      return;
    }

    if (
      parsedMinPrice !== undefined &&
      parsedMaxPrice !== undefined &&
      parsedMinPrice > parsedMaxPrice
    ) {
      setPriceError("Minimum price cannot exceed maximum price.");
      return;
    }

    onApply({
      ...draftFilters,
      minPrice: parsedMinPrice,
      maxPrice: parsedMaxPrice
    });
    onClose();
  };

  const options = optionsQuery.data;
  const footer =
    optionsQuery.isPending || optionsQuery.isError ? undefined : (
      <View className="flex-row gap-3">
        <Button className="flex-1" onPress={clearFilters} size="lg" variant="outline">
          Clear
        </Button>
        <Button className="flex-1" onPress={applyFilters} size="lg">
          Apply
        </Button>
      </View>
    );

  return (
    <Modal
      footer={footer}
      onClose={onClose}
      presentation="full"
      title="Filters"
      visible
    >
      {optionsQuery.isPending ? (
        <LoadingState label="Loading filters" />
      ) : optionsQuery.isError ? (
        <ErrorState
          message={getApiErrorMessage(optionsQuery.error)}
          onRetry={() => void optionsQuery.refetch()}
        />
      ) : (
        <ScrollView contentContainerStyle={{ gap: 28, padding: 20 }}>
              <ChoiceGroup
                choices={(options?.brands ?? []).map((brand) => ({
                  label: brand.name,
                  value: brand.id
                }))}
                onSelect={(value) => toggleFilter("brandId", value)}
                selectedValue={draftFilters.brandId}
                title="Brand"
              />
              <ChoiceGroup
                choices={(options?.categories ?? []).map((category) => ({
                  label: category.name,
                  value: category.id
                }))}
                onSelect={(value) => toggleFilter("categoryId", value)}
                selectedValue={draftFilters.categoryId}
                title="Category"
              />
              <ChoiceGroup
                choices={(options?.sourcePlatforms ?? []).map((sourcePlatform) => ({
                  label: sourcePlatform.name,
                  value: sourcePlatform.id
                }))}
                onSelect={(value) => toggleFilter("sourcePlatformId", value)}
                selectedValue={draftFilters.sourcePlatformId}
                title="Retailer"
              />
              <ChoiceGroup
                choices={(options?.colors ?? []).map((color) => ({ label: color, value: color }))}
                onSelect={(value) => toggleFilter("color", value)}
                selectedValue={draftFilters.color}
                showSwatch
                title="Color"
              />

              <View className="gap-3">
                <Text className="text-body font-semibold text-foreground dark:text-foreground-dark">
                  Price range
                </Text>
                <View className="flex-row gap-3">
                  <Input
                    containerClassName="flex-1"
                    keyboardType="decimal-pad"
                    onChangeText={setMinPrice}
                    placeholder={options?.priceRange?.minPrice ?? "Minimum"}
                    value={minPrice}
                  />
                  <Input
                    containerClassName="flex-1"
                    keyboardType="decimal-pad"
                    onChangeText={setMaxPrice}
                    placeholder={options?.priceRange?.maxPrice ?? "Maximum"}
                    value={maxPrice}
                  />
                </View>
                {priceError !== null ? (
                  <Text className="text-label text-destructive dark:text-destructive-dark">
                    {priceError}
                  </Text>
                ) : null}
              </View>
        </ScrollView>
      )}
    </Modal>
  );
}
