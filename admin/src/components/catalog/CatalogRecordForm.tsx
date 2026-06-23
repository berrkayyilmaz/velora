import { type FormEvent, useState } from "react";

import type { AdminCatalogInput, AdminCatalogListRecord } from "@/types/admin-catalog";

type CatalogRecordFormProps = {
  record?: AdminCatalogListRecord;
  supportsBaseUrl: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (input: AdminCatalogInput) => Promise<void>;
};

type CatalogRecordFormState = {
  name: string;
  slug: string;
  baseUrl: string;
};

const inputClassName =
  "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring";

function getInitialState(record?: AdminCatalogListRecord): CatalogRecordFormState {
  return {
    name: record?.name ?? "",
    slug: record?.slug ?? "",
    baseUrl: record !== undefined && "baseUrl" in record ? (record.baseUrl ?? "") : ""
  };
}

export function CatalogRecordForm({
  record,
  supportsBaseUrl,
  isSubmitting,
  onCancel,
  onSubmit
}: CatalogRecordFormProps) {
  const [form, setForm] = useState<CatalogRecordFormState>(() => getInitialState(record));

  const submitRecord = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const slug = form.slug.trim();
    const baseUrl = form.baseUrl.trim();
    void onSubmit({
      name: form.name.trim(),
      ...(slug.length === 0 ? {} : { slug }),
      ...(supportsBaseUrl ? { baseUrl: baseUrl.length === 0 ? null : baseUrl } : {})
    });
  };

  return (
    <form className="mt-5 grid max-w-2xl gap-4" onSubmit={submitRecord}>
      <label className="text-sm font-medium" htmlFor="catalog-name">
        Name
        <input
          className={inputClassName}
          id="catalog-name"
          maxLength={120}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          required
          value={form.name}
        />
      </label>

      <label className="text-sm font-medium" htmlFor="catalog-slug">
        Slug
        <input
          className={inputClassName}
          id="catalog-slug"
          maxLength={120}
          onChange={(event) => setForm({ ...form, slug: event.target.value })}
          placeholder="Generated from name when omitted"
          value={form.slug}
        />
      </label>

      {supportsBaseUrl ? (
        <label className="text-sm font-medium" htmlFor="catalog-base-url">
          Base URL
          <input
            className={inputClassName}
            id="catalog-base-url"
            onChange={(event) => setForm({ ...form, baseUrl: event.target.value })}
            placeholder="https://example.com"
            type="url"
            value={form.baseUrl}
          />
        </label>
      ) : null}

      <div className="flex gap-3">
        <button
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Saving" : record === undefined ? "Create" : "Save Changes"}
        </button>
        <button
          className="rounded-md border border-border px-4 py-2 text-sm font-medium"
          disabled={isSubmitting}
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
