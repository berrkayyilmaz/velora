import { Archive, Pencil, Plus } from "lucide-react";
import { useState } from "react";

import { CatalogRecordForm } from "@/components/catalog/CatalogRecordForm";
import { PaginationControls } from "@/components/PaginationControls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminCatalogRecords,
  useCreateAdminCatalogRecord,
  useDeactivateAdminCatalogRecord,
  useUpdateAdminCatalogRecord
} from "@/hooks/useAdminCatalog";
import type {
  AdminCatalogInput,
  AdminCatalogListRecord,
  AdminCatalogResource
} from "@/types/admin-catalog";
import { getApiErrorMessage } from "@/utils/api-error";

type CatalogManagementScreenProps = {
  resource: AdminCatalogResource;
  title: string;
  singularLabel: string;
  supportsBaseUrl?: boolean;
};

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

export function CatalogManagementScreen({
  resource,
  title,
  singularLabel,
  supportsBaseUrl = false
}: CatalogManagementScreenProps) {
  const [page, setPage] = useState(1);
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editingRecord, setEditingRecord] = useState<AdminCatalogListRecord | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const recordsQuery = useAdminCatalogRecords(resource, page);
  const createMutation = useCreateAdminCatalogRecord(resource);
  const updateMutation = useUpdateAdminCatalogRecord(resource);
  const deactivateMutation = useDeactivateAdminCatalogRecord(resource);

  const closeForm = () => {
    setFormMode(null);
    setEditingRecord(null);
    createMutation.reset();
    updateMutation.reset();
    deactivateMutation.reset();
  };

  const openCreateForm = () => {
    setSuccessMessage(null);
    setEditingRecord(null);
    setFormMode("create");
    createMutation.reset();
    deactivateMutation.reset();
  };

  const openEditForm = (record: AdminCatalogListRecord) => {
    setSuccessMessage(null);
    setEditingRecord(record);
    setFormMode("edit");
    updateMutation.reset();
    deactivateMutation.reset();
  };

  const submitCreate = async (input: AdminCatalogInput) => {
    try {
      await createMutation.mutateAsync(input);
      setSuccessMessage(`${singularLabel} created.`);
      closeForm();
    } catch {
      return;
    }
  };

  const submitUpdate = async (input: AdminCatalogInput) => {
    if (editingRecord === null) {
      return;
    }

    try {
      await updateMutation.mutateAsync({ id: editingRecord.id, input });
      setSuccessMessage(`${singularLabel} updated.`);
      closeForm();
    } catch {
      return;
    }
  };

  const deactivateRecord = async (record: AdminCatalogListRecord) => {
    setSuccessMessage(null);
    deactivateMutation.reset();

    try {
      const result = await deactivateMutation.mutateAsync(record.id);
      setSuccessMessage(
        result.deactivated
          ? `${singularLabel} deactivated.`
          : `${singularLabel} was already inactive.`
      );
      closeForm();
    } catch {
      return;
    }
  };

  const formError = createMutation.error ?? updateMutation.error;
  const items = recordsQuery.data?.data.items ?? [];

  return (
    <main className="mx-auto w-full max-w-6xl p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <Button
          onClick={openCreateForm}
          type="button"
        >
          <Plus aria-hidden="true" size={17} />
          Create {singularLabel}
        </Button>
      </div>

      {successMessage === null ? null : (
        <p className="mt-5 text-sm" role="status">
          {successMessage}
        </p>
      )}

      {deactivateMutation.isError ? (
        <p className="mt-5 text-sm text-destructive" role="alert">
          {getApiErrorMessage(deactivateMutation.error)}
        </p>
      ) : null}

      {formMode === null ? null : (
        <section aria-labelledby="catalog-form-heading" className="mt-6 border-y border-border py-6">
          <h2 className="text-lg font-semibold" id="catalog-form-heading">
            {formMode === "create" ? `Create ${singularLabel}` : `Edit ${singularLabel}`}
          </h2>
          {formError === null ? null : (
            <p className="mt-4 text-destructive" role="alert">
              {getApiErrorMessage(formError)}
            </p>
          )}
          <CatalogRecordForm
            isSubmitting={createMutation.isPending || updateMutation.isPending}
            key={editingRecord?.id ?? `create-${resource}`}
            onCancel={closeForm}
            onSubmit={formMode === "create" ? submitCreate : submitUpdate}
            record={formMode === "edit" ? (editingRecord ?? undefined) : undefined}
            supportsBaseUrl={supportsBaseUrl}
          />
        </section>
      )}

      <section aria-labelledby="catalog-list-heading" className="mt-8">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-semibold" id="catalog-list-heading">
            {title} List
          </h2>
          {recordsQuery.data === undefined ? null : (
            <span className="text-sm text-muted-foreground">
              {recordsQuery.data.meta.pagination.total.toLocaleString()} records
            </span>
          )}
        </div>

        {recordsQuery.isPending ? (
          <div className="mt-4 grid gap-2" aria-label={`Loading ${title.toLowerCase()}`}>
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : recordsQuery.isError ? (
          <div className="mt-4" role="alert">
            <p className="text-destructive">{getApiErrorMessage(recordsQuery.error)}</p>
            <Button
              className="mt-3"
              onClick={() => void recordsQuery.refetch()}
              type="button"
              variant="outline"
            >
              Retry
            </Button>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            className="mt-4 border-y border-border"
            title={`No ${title.toLowerCase()} found`}
          />
        ) : (
          <>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-3">Name</th>
                    <th className="px-3 py-3">Slug</th>
                    <th className="px-3 py-3">Status</th>
                    {supportsBaseUrl ? <th className="px-3 py-3">Base URL</th> : null}
                    <th className="px-3 py-3">Updated</th>
                    <th className="px-3 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((record) => (
                    <tr className="border-b border-border" key={record.id}>
                      <td className="px-3 py-3 font-medium">{record.name}</td>
                      <td className="px-3 py-3 font-mono text-xs">{record.slug}</td>
                      <td className="px-3 py-3">
                        <Badge variant={record.isActive ? "success" : "outline"}>
                          {record.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      {supportsBaseUrl ? (
                        <td className="px-3 py-3">
                          {"baseUrl" in record ? (record.baseUrl ?? "-") : "-"}
                        </td>
                      ) : null}
                      <td className="whitespace-nowrap px-3 py-3">
                        {formatDate(record.updatedAt)}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex gap-2">
                          <Button
                            aria-label={`Edit ${record.name}`}
                            onClick={() => openEditForm(record)}
                            size="icon"
                            title={`Edit ${record.name}`}
                            type="button"
                            variant="outline"
                          >
                            <Pencil aria-hidden="true" size={16} />
                          </Button>
                          {record.isActive ? (
                            <Button
                              aria-label={`Deactivate ${record.name}`}
                              className="text-destructive"
                              disabled={
                                deactivateMutation.isPending &&
                                deactivateMutation.variables === record.id
                              }
                              onClick={() => void deactivateRecord(record)}
                              size="icon"
                              title={`Deactivate ${record.name}`}
                              type="button"
                              variant="outline"
                            >
                              <Archive aria-hidden="true" size={16} />
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationControls
              hasNextPage={recordsQuery.data.meta.pagination.hasNextPage}
              label={title.toLowerCase()}
              onPageChange={setPage}
              page={page}
            />
          </>
        )}
      </section>
    </main>
  );
}
