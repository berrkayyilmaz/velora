import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
      <Text className="text-base font-semibold text-neutral-950">{title}</Text>
      <View className="flex-row flex-wrap gap-2">
        {choices.map((choice) => {
          const isSelected = selectedValue === choice.value;

          return (
            <Pressable
              accessibilityRole="button"
              className={`min-h-10 flex-row items-center gap-2 rounded-md border px-3 py-2 ${
                isSelected
                  ? "border-neutral-950 bg-neutral-950"
                  : "border-neutral-300 bg-white"
              }`}
              key={choice.value}
              onPress={() => onSelect(choice.value)}
            >
              {showSwatch ? (
                <View
                  className="h-4 w-4 rounded-full border border-neutral-300"
                  style={{ backgroundColor: getColorSwatch(choice.label) }}
                />
              ) : null}
              <Text className={`text-sm ${isSelected ? "text-white" : "text-neutral-800"}`}>
                {choice.label}
              </Text>
            </Pressable>
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

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      visible
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
        <View className="h-14 flex-row items-center justify-between border-b border-neutral-200 px-5">
          <Text className="text-lg font-semibold text-neutral-950">Filters</Text>
          <Pressable accessibilityLabel="Close filters" accessibilityRole="button" onPress={onClose}>
            <Text className="px-2 py-1 text-lg font-semibold text-neutral-800">X</Text>
          </Pressable>
        </View>

        {optionsQuery.isPending ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#171717" />
          </View>
        ) : optionsQuery.isError ? (
          <View className="flex-1 items-center justify-center gap-4 px-6">
            <Text className="text-center text-sm text-red-700">
              {getApiErrorMessage(optionsQuery.error)}
            </Text>
            <Pressable
              accessibilityRole="button"
              className="h-11 items-center justify-center rounded-md bg-neutral-950 px-5"
              onPress={() => void optionsQuery.refetch()}
            >
              <Text className="font-semibold text-white">Retry</Text>
            </Pressable>
          </View>
        ) : (
          <>
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
                <Text className="text-base font-semibold text-neutral-950">Price range</Text>
                <View className="flex-row gap-3">
                  <TextInput
                    className="h-12 flex-1 rounded-md border border-neutral-300 px-4 text-base text-neutral-950"
                    keyboardType="decimal-pad"
                    onChangeText={setMinPrice}
                    placeholder={options?.priceRange?.minPrice ?? "Minimum"}
                    placeholderTextColor="#737373"
                    value={minPrice}
                  />
                  <TextInput
                    className="h-12 flex-1 rounded-md border border-neutral-300 px-4 text-base text-neutral-950"
                    keyboardType="decimal-pad"
                    onChangeText={setMaxPrice}
                    placeholder={options?.priceRange?.maxPrice ?? "Maximum"}
                    placeholderTextColor="#737373"
                    value={maxPrice}
                  />
                </View>
                {priceError !== null ? (
                  <Text className="text-sm text-red-700">{priceError}</Text>
                ) : null}
              </View>
            </ScrollView>

            <View className="flex-row gap-3 border-t border-neutral-200 p-4">
              <Pressable
                accessibilityRole="button"
                className="h-12 flex-1 items-center justify-center rounded-md border border-neutral-300 bg-white"
                onPress={clearFilters}
              >
                <Text className="font-semibold text-neutral-900">Clear</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                className="h-12 flex-1 items-center justify-center rounded-md bg-neutral-950"
                onPress={applyFilters}
              >
                <Text className="font-semibold text-white">Apply</Text>
              </Pressable>
            </View>
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
}
