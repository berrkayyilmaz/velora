import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createAdminProduct,
  deactivateAdminProduct,
  getAdminProduct,
  getAdminProducts,
  updateAdminProduct
} from "@/services/admin-product.service";
import type { AdminProductInput, UpdateAdminProductInput } from "@/types/admin-product";

const ADMIN_PRODUCTS_PAGE_SIZE = 20;

export const adminProductQueryKeys = {
  all: ["admin-products"] as const,
  list: (page: number) => [...adminProductQueryKeys.all, "list", page] as const,
  detail: (productId: string) =>
    [...adminProductQueryKeys.all, "detail", productId] as const
};

export function useAdminProducts(page: number) {
  return useQuery({
    queryKey: adminProductQueryKeys.list(page),
    queryFn: () => getAdminProducts({ page, pageSize: ADMIN_PRODUCTS_PAGE_SIZE })
  });
}

export function useAdminProduct(productId: string | null) {
  return useQuery({
    queryKey: adminProductQueryKeys.detail(productId ?? ""),
    queryFn: () => getAdminProduct(productId ?? ""),
    enabled: productId !== null
  });
}

export function useCreateAdminProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (product: AdminProductInput) => createAdminProduct(product),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminProductQueryKeys.all });
    }
  });
}

export function useUpdateAdminProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, product }: UpdateAdminProductInput) =>
      updateAdminProduct(productId, product),
    onSuccess: async (product) => {
      queryClient.setQueryData(adminProductQueryKeys.detail(product.id), product);
      await queryClient.invalidateQueries({ queryKey: adminProductQueryKeys.all });
    }
  });
}

export function useDeactivateAdminProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => deactivateAdminProduct(productId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminProductQueryKeys.all });
    }
  });
}
