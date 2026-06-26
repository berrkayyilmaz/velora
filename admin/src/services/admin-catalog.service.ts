import { adminApiClient } from "@/services/api/client";
import type {
  AdminCatalogDetailResponse,
  AdminCatalogInput,
  AdminCatalogListInput,
  AdminCatalogListRecord,
  AdminCatalogListResponse,
  AdminCatalogResource,
  DeleteAdminCatalogRecordResponse
} from "@/types/admin-catalog";

function getResourcePath(resource: AdminCatalogResource): string {
  return `/admin/${resource}`;
}

export async function getAdminCatalogRecords(
  resource: AdminCatalogResource,
  input: AdminCatalogListInput
): Promise<AdminCatalogListResponse> {
  const response = await adminApiClient.get<AdminCatalogListResponse>(getResourcePath(resource), {
    params: input
  });

  return response.data;
}

export async function createAdminCatalogRecord(
  resource: AdminCatalogResource,
  input: AdminCatalogInput
): Promise<AdminCatalogListRecord> {
  const response = await adminApiClient.post<AdminCatalogDetailResponse>(
    getResourcePath(resource),
    input
  );

  return response.data.data;
}

export async function updateAdminCatalogRecord(
  resource: AdminCatalogResource,
  id: string,
  input: AdminCatalogInput
): Promise<AdminCatalogListRecord> {
  const response = await adminApiClient.patch<AdminCatalogDetailResponse>(
    `${getResourcePath(resource)}/${id}`,
    input
  );

  return response.data.data;
}

export async function deactivateAdminCatalogRecord(
  resource: AdminCatalogResource,
  id: string
): Promise<DeleteAdminCatalogRecordResponse["data"]> {
  const response = await adminApiClient.delete<DeleteAdminCatalogRecordResponse>(
    `${getResourcePath(resource)}/${id}`
  );

  return response.data.data;
}
