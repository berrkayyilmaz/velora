import { adminApiClient } from "@/services/api/client";
import type {
  AdminProduct,
  AdminProductDetailResponse,
  AdminProductImportInput,
  AdminProductImportResponse,
  AdminProductImportSummary,
  AdminProductInput,
  AdminProductListInput,
  AdminProductListResponse,
  DeleteAdminProductResponse
} from "@/types/admin-product";

export async function getAdminProducts(
  input: AdminProductListInput
): Promise<AdminProductListResponse> {
  const response = await adminApiClient.get<AdminProductListResponse>("/admin/products", {
    params: input
  });

  return response.data;
}

export async function getAdminProduct(productId: string): Promise<AdminProduct> {
  const response = await adminApiClient.get<AdminProductDetailResponse>(
    `/admin/products/${productId}`
  );

  return response.data.data;
}

export async function createAdminProduct(product: AdminProductInput): Promise<AdminProduct> {
  const response = await adminApiClient.post<AdminProductDetailResponse>(
    "/admin/products",
    product
  );

  return response.data.data;
}

export async function updateAdminProduct(
  productId: string,
  product: AdminProductInput
): Promise<AdminProduct> {
  const response = await adminApiClient.patch<AdminProductDetailResponse>(
    `/admin/products/${productId}`,
    product
  );

  return response.data.data;
}

export async function deactivateAdminProduct(
  productId: string
): Promise<DeleteAdminProductResponse> {
  const response = await adminApiClient.delete<DeleteAdminProductResponse>(
    `/admin/products/${productId}`
  );

  return response.data;
}

export async function importAdminProducts(
  input: AdminProductImportInput
): Promise<AdminProductImportSummary> {
  const response = await adminApiClient.post<AdminProductImportResponse>(
    "/admin/products/import",
    input
  );

  return response.data.data;
}
