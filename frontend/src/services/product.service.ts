import { apiClient } from "@/services/api/client";
import type {
  ProductDetail,
  ProductDetailResponse,
  ProductFilterOptions,
  ProductFilterOptionsResponse,
  ProductFilters,
  ProductListResponse
} from "@/types/product";

type ProductListRequest = ProductFilters & {
  page: number;
  pageSize: number;
};

export async function getProducts(input: ProductListRequest): Promise<ProductListResponse> {
  const response = await apiClient.get<ProductListResponse>("/products", {
    params: input
  });

  return response.data;
}

export async function getProduct(productId: string): Promise<ProductDetail> {
  const response = await apiClient.get<ProductDetailResponse>(`/products/${productId}`);

  return response.data.data;
}

export async function getProductFilterOptions(): Promise<ProductFilterOptions> {
  const response = await apiClient.get<ProductFilterOptionsResponse>("/products/filter-options");

  return response.data.data;
}
