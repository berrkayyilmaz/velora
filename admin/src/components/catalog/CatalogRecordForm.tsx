import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
        <Input
          className="mt-1"
          id="catalog-name"
          maxLength={120}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          required
          value={form.name}
        />
      </label>

      <label className="text-sm font-medium" htmlFor="catalog-slug">
        Slug
        <Input
          className="mt-1"
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
          <Input
            className="mt-1"
            id="catalog-base-url"
            onChange={(event) => setForm({ ...form, baseUrl: event.target.value })}
            placeholder="https://example.com"
            type="url"
            value={form.baseUrl}
          />
        </label>
      ) : null}

      <div className="flex gap-3">
        <Button
          isLoading={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Saving" : record === undefined ? "Create" : "Save Changes"}
        </Button>
        <Button
          disabled={isSubmitting}
          onClick={onCancel}
          type="button"
          variant="outline"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
