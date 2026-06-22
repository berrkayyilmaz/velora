import { useCallback, useMemo, useState } from "react";

import { useProducts } from "@/hooks/useProducts";
import type { ProductFilters } from "@/types/product";

export function useProductCatalog() {
  const [filters, setFilters] = useState<ProductFilters>({});
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

  return {
    filters,
    setFilters,
    products,
    activeFilterCount,
    loadNextPage,
    productsQuery
  };
}
