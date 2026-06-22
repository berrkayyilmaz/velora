import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAnalytics } from "@/hooks/useAnalytics";
import { useProducts } from "@/hooks/useProducts";
import type { ProductFilters } from "@/types/product";

const SEARCH_DEBOUNCE_MS = 400;

export function useProductCatalog() {
  const { trackEvent } = useAnalytics();
  const [filters, setCatalogFilters] = useState<ProductFilters>({});
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const lastTrackedSearch = useRef("");
  const productQuery = useMemo(
    () => ({
      ...filters,
      ...(debouncedSearch === "" ? {} : { search: debouncedSearch })
    }),
    [debouncedSearch, filters]
  );
  const productsQuery = useProducts(productQuery);
  const products = useMemo(
    () => productsQuery.data?.pages.flatMap((page) => page.data.items) ?? [],
    [productsQuery.data]
  );
  const activeFilterCount = useMemo(
    () => Object.values(filters).filter((value) => value !== undefined).length,
    [filters]
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    if (debouncedSearch === "") {
      lastTrackedSearch.current = "";
      return;
    }

    if (lastTrackedSearch.current === debouncedSearch) {
      return;
    }

    lastTrackedSearch.current = debouncedSearch;
    trackEvent({
      eventType: "product_searched",
      sourceScreen: "catalog"
    });
  }, [debouncedSearch, trackEvent]);

  const loadNextPage = useCallback(() => {
    if (productsQuery.hasNextPage && !productsQuery.isFetchingNextPage) {
      void productsQuery.fetchNextPage();
    }
  }, [productsQuery]);

  const setFilters = useCallback(
    (nextFilters: ProductFilters) => {
      setCatalogFilters(nextFilters);

      if (Object.values(nextFilters).some((value) => value !== undefined)) {
        trackEvent({
          eventType: "product_filter_applied",
          sourceScreen: "catalog"
        });
      }
    },
    [trackEvent]
  );

  const submitSearch = useCallback(() => {
    setDebouncedSearch(searchInput.trim());
  }, [searchInput]);

  return {
    filters,
    setFilters,
    searchInput,
    setSearchInput,
    submitSearch,
    products,
    activeFilterCount,
    loadNextPage,
    productsQuery
  };
}
