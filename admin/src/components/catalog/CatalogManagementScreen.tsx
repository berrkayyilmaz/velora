import { Pencil, Plus } from "lucide-react";
import { useState } from "react";

import { CatalogRecordForm } from "@/components/catalog/CatalogRecordForm";
import { PaginationControls } from "@/components/PaginationControls";
import {
  useAdminCatalogRecords,
  useCreateAdminCatalogRecord,
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

  const closeForm = () => {
    setFormMode(null);
    setEditingRecord(null);
    createMutation.reset();
    updateMutation.reset();
  };

  const openCreateForm = () => {
    setSuccessMessage(null);
    setEditingRecord(null);
    setFormMode("create");
    createMutation.reset();
  };

  const openEditForm = (record: AdminCatalogListRecord) => {
    setSuccessMessage(null);
    setEditingRecord(record);
    setFormMode("edit");
    updateMutation.reset();
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

  const formError = createMutation.error ?? updateMutation.error;
  const items = recordsQuery.data?.data.items ?? [];

  return (
    <main className="mx-auto w-full max-w-6xl p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <button
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          onClick={openCreateForm}
          type="button"
        >
          <Plus aria-hidden="true" size={17} />
          Create {singularLabel}
        </button>
      </div>

      {successMessage === null ? null : (
        <p className="mt-5 text-sm" role="status">
          {successMessage}
        </p>
      )}

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
          <p className="mt-4 text-muted-foreground">Loading {title.toLowerCase()}.</p>
        ) : recordsQuery.isError ? (
          <div className="mt-4" role="alert">
            <p className="text-destructive">{getApiErrorMessage(recordsQuery.error)}</p>
            <button
              className="mt-3 rounded-md border border-border px-3 py-2"
              onClick={() => void recordsQuery.refetch()}
              type="button"
            >
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <p className="mt-4 text-muted-foreground">No {title.toLowerCase()} found.</p>
        ) : (
          <>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-3">Name</th>
                    <th className="px-3 py-3">Slug</th>
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
                      {supportsBaseUrl ? (
                        <td className="px-3 py-3">
                          {"baseUrl" in record ? (record.baseUrl ?? "-") : "-"}
                        </td>
                      ) : null}
                      <td className="whitespace-nowrap px-3 py-3">
                        {formatDate(record.updatedAt)}
                      </td>
                      <td className="px-3 py-3">
                        <button
                          aria-label={`Edit ${record.name}`}
                          className="inline-flex size-9 items-center justify-center rounded-md border border-border"
                          onClick={() => openEditForm(record)}
                          title={`Edit ${record.name}`}
                          type="button"
                        >
                          <Pencil aria-hidden="true" size={16} />
                        </button>
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
