import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import {
  getProduct,
  getProductFilterOptions,
  getProducts
} from "@/services/product.service";
import type { ProductListQuery } from "@/types/product";

const PRODUCT_PAGE_SIZE = 20;

export const productQueryKeys = {
  all: ["products"] as const,
  lists: () => [...productQueryKeys.all, "list"] as const,
  list: (query: ProductListQuery) => [...productQueryKeys.lists(), query] as const,
  details: () => [...productQueryKeys.all, "detail"] as const,
  detail: (productId: string) => [...productQueryKeys.details(), productId] as const,
  filterOptions: () => [...productQueryKeys.all, "filter-options"] as const
};

export function useProducts(query: ProductListQuery) {
  return useInfiniteQuery({
    queryKey: productQueryKeys.list(query),
    queryFn: ({ pageParam }) =>
      getProducts({
        ...query,
        page: pageParam,
        pageSize: PRODUCT_PAGE_SIZE
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const pagination = lastPage.meta.pagination;

      return pagination.hasNextPage ? pagination.page + 1 : undefined;
    }
  });
}

export function useProduct(productId: string | undefined) {
  return useQuery({
    queryKey: productQueryKeys.detail(productId ?? "missing"),
    queryFn: () => {
      if (productId === undefined) {
        throw new Error("Product ID is required.");
      }

      return getProduct(productId);
    },
    enabled: productId !== undefined
  });
}

export function useProductFilterOptions() {
  return useQuery({
    queryKey: productQueryKeys.filterOptions(),
    queryFn: getProductFilterOptions
  });
}
