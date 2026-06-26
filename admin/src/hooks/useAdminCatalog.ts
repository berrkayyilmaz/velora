import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createAdminCatalogRecord,
  deactivateAdminCatalogRecord,
  getAdminCatalogRecords,
  updateAdminCatalogRecord
} from "@/services/admin-catalog.service";
import type {
  AdminCatalogInput,
  AdminCatalogResource,
  UpdateAdminCatalogInput
} from "@/types/admin-catalog";

const ADMIN_CATALOG_PAGE_SIZE = 20;
const ADMIN_CATALOG_REFERENCE_PAGE_SIZE = 100;

export const adminCatalogQueryKeys = {
  all: (resource: AdminCatalogResource) => ["admin-catalog", resource] as const,
  list: (resource: AdminCatalogResource, page: number) =>
    [...adminCatalogQueryKeys.all(resource), "list", page] as const,
  referenceList: (resource: AdminCatalogResource) =>
    [...adminCatalogQueryKeys.all(resource), "reference-list"] as const
};

export function useAdminCatalogRecords(resource: AdminCatalogResource, page: number) {
  return useQuery({
    queryKey: adminCatalogQueryKeys.list(resource, page),
    queryFn: () =>
      getAdminCatalogRecords(resource, { page, pageSize: ADMIN_CATALOG_PAGE_SIZE })
  });
}

export function useAdminCatalogReferenceRecords(resource: AdminCatalogResource) {
  return useQuery({
    queryKey: adminCatalogQueryKeys.referenceList(resource),
    queryFn: () =>
      getAdminCatalogRecords(resource, {
        page: 1,
        pageSize: ADMIN_CATALOG_REFERENCE_PAGE_SIZE
      })
  });
}

export function useCreateAdminCatalogRecord(resource: AdminCatalogResource) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AdminCatalogInput) => createAdminCatalogRecord(resource, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminCatalogQueryKeys.all(resource) });
    }
  });
}

export function useUpdateAdminCatalogRecord(resource: AdminCatalogResource) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: UpdateAdminCatalogInput) =>
      updateAdminCatalogRecord(resource, id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminCatalogQueryKeys.all(resource) });
    }
  });
}

export function useDeactivateAdminCatalogRecord(resource: AdminCatalogResource) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deactivateAdminCatalogRecord(resource, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminCatalogQueryKeys.all(resource) });
    }
  });
}
