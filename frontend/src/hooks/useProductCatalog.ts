import { useCallback, useMemo, useState } from "react";

import { useAnalytics } from "@/hooks/useAnalytics";
import { useProducts } from "@/hooks/useProducts";
import type { ProductFilters } from "@/types/product";

export function useProductCatalog() {
  const { trackEvent } = useAnalytics();
  const [filters, setCatalogFilters] = useState<ProductFilters>({});
  const productsQuery = useProducts(filters);
  const products = useMemo(
    () => productsQuery.data?.pages.flatMap((page) => page.data.items) ?? [],
    [productsQuery.data]
  );
  const activeFilterCount = useMemo(
    () => Object.values(filters).filter((value) => value !== undefined).length,
    [filters]
  );

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

  return {
    filters,
    setFilters,
    products,
    activeFilterCount,
    loadNextPage,
    productsQuery
  };
}
