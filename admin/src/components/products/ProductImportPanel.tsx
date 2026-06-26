import { type FormEvent, useMemo, useState } from "react";

import { useAdminCatalogReferenceRecords } from "@/hooks/useAdminCatalog";
import { useImportAdminProducts } from "@/hooks/useAdminProducts";
import type { AdminCatalogListRecord } from "@/types/admin-catalog";
import { getApiErrorMessage } from "@/utils/api-error";

type ProductImportPanelProps = {
  onClose: () => void;
};

type ExampleSlugs = {
  brandSlug: string | null;
  categorySlug: string | null;
  sourcePlatformSlug: string | null;
};

type ReadyExampleSlugs = {
  brandSlug: string;
  categorySlug: string;
  sourcePlatformSlug: string;
};

const fallbackExampleProducts = buildExampleProducts({
  brandSlug: "existing-brand-slug",
  categorySlug: "existing-category-slug",
  sourcePlatformSlug: "existing-source-platform-slug"
});

function buildExampleProducts({
  brandSlug,
  categorySlug,
  sourcePlatformSlug
}: ReadyExampleSlugs) {
  return JSON.stringify(
    [
      {
        title: "Essential Cotton Shirt",
        brandSlug,
        categorySlug,
        sourcePlatformSlug,
        price: 79.9,
        imageUrl: "https://placehold.co/800x1000/png?text=Product",
        productUrl: "https://example.com/products/essential-cotton-shirt",
        color: "White",
        isActive: true
      }
    ],
    null,
    2
  );
}

function getFirstSlug(records: AdminCatalogListRecord[]): string | null {
  return records[0]?.slug ?? null;
}

function isExampleReady(slugs: ExampleSlugs): slugs is ReadyExampleSlugs {
  return (
    slugs.brandSlug !== null &&
    slugs.categorySlug !== null &&
    slugs.sourcePlatformSlug !== null
  );
}

function getProductsFromJson(value: string): unknown[] {
  const parsed: unknown = JSON.parse(value);

  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (
    typeof parsed === "object" &&
    parsed !== null &&
    "products" in parsed &&
    Array.isArray(parsed.products)
  ) {
    return parsed.products;
  }

  throw new Error("Expected a JSON array or an object with a products array.");
}

function SlugReferenceList({
  error,
  isError,
  isLoading,
  records,
  title
}: {
  error: unknown;
  isError: boolean;
  isLoading: boolean;
  records: AdminCatalogListRecord[];
  title: string;
}) {
  return (
    <div className="rounded-md border border-border bg-muted/30 p-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      {isLoading ? (
        <p className="mt-2 text-sm text-muted-foreground">Loading slugs...</p>
      ) : isError ? (
        <p className="mt-2 text-sm text-destructive">{getApiErrorMessage(error)}</p>
      ) : records.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">No records available.</p>
      ) : (
        <ul className="mt-2 flex flex-wrap gap-2">
          {records.map((record) => (
            <li
              className="rounded-md border border-border bg-background px-2 py-1 font-mono text-xs"
              key={record.id}
              title={record.name}
            >
              {record.slug}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ProductImportPanel({ onClose }: ProductImportPanelProps) {
  const brandsQuery = useAdminCatalogReferenceRecords("brands");
  const categoriesQuery = useAdminCatalogReferenceRecords("categories");
  const sourcePlatformsQuery = useAdminCatalogReferenceRecords("source-platforms");
  const brands = useMemo(() => brandsQuery.data?.data.items ?? [], [brandsQuery.data]);
  const categories = useMemo(
    () => categoriesQuery.data?.data.items ?? [],
    [categoriesQuery.data]
  );
  const sourcePlatforms = useMemo(
    () => sourcePlatformsQuery.data?.data.items ?? [],
    [sourcePlatformsQuery.data]
  );
  const exampleSlugs = useMemo<ExampleSlugs>(
    () => ({
      brandSlug: getFirstSlug(brands),
      categorySlug: getFirstSlug(categories),
      sourcePlatformSlug: getFirstSlug(sourcePlatforms)
    }),
    [brands, categories, sourcePlatforms]
  );
  const exampleProducts = useMemo(() => {
    if (!isExampleReady(exampleSlugs)) {
      return fallbackExampleProducts;
    }

    return buildExampleProducts(exampleSlugs);
  }, [exampleSlugs]);
  const [customJson, setCustomJson] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const importMutation = useImportAdminProducts();
  const json = customJson ?? exampleProducts;

  const useExampleJson = () => {
    setCustomJson(null);
    setParseError(null);
    importMutation.reset();
  };

  const submitImport = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setParseError(null);
    importMutation.reset();

    try {
      const products = getProductsFromJson(json);

      if (products.length === 0) {
        throw new Error("At least one product row is required.");
      }

      importMutation.mutate({ products });
    } catch (error) {
      setParseError(error instanceof Error ? error.message : "Invalid JSON.");
    }
  };

  const error =
    parseError ?? (importMutation.isError ? getApiErrorMessage(importMutation.error) : null);

  return (
    <section aria-labelledby="product-import-heading" className="mt-6 border-y border-border py-6">
      <h2 className="text-lg font-semibold" id="product-import-heading">
        Import Products
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Paste a JSON array of up to 100 products. Catalog references accept either an ID or one
        of the existing slugs below.
      </p>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <SlugReferenceList
          error={brandsQuery.error}
          isError={brandsQuery.isError}
          isLoading={brandsQuery.isPending}
          records={brands}
          title="Available brandSlugs"
        />
        <SlugReferenceList
          error={categoriesQuery.error}
          isError={categoriesQuery.isError}
          isLoading={categoriesQuery.isPending}
          records={categories}
          title="Available categorySlugs"
        />
        <SlugReferenceList
          error={sourcePlatformsQuery.error}
          isError={sourcePlatformsQuery.isError}
          isLoading={sourcePlatformsQuery.isPending}
          records={sourcePlatforms}
          title="Available sourcePlatformSlugs"
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        <form onSubmit={submitImport}>
          <label className="text-sm font-medium" htmlFor="product-import-json">
            Products JSON
            <textarea
              className="mt-1 min-h-80 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm outline-none focus:border-ring"
              id="product-import-json"
              onChange={(event) => {
                setCustomJson(event.target.value);
              }}
              spellCheck={false}
              value={json}
            />
          </label>

          {error === null ? null : (
            <p className="mt-3 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              disabled={importMutation.isPending}
              type="submit"
            >
              {importMutation.isPending ? "Importing" : "Import Products"}
            </button>
            <button
              className="rounded-md border border-border px-4 py-2 text-sm font-medium"
              disabled={importMutation.isPending}
              onClick={useExampleJson}
              type="button"
            >
              Use Example JSON
            </button>
            <button
              className="rounded-md border border-border px-4 py-2 text-sm font-medium"
              disabled={importMutation.isPending}
              onClick={onClose}
              type="button"
            >
              Close
            </button>
          </div>
        </form>

        <aside className="rounded-md border border-border bg-muted/30 p-4">
          <h3 className="text-sm font-semibold">Example JSON</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            This example uses the first available brand, category, and source platform slugs from
            the current database.
          </p>
          {!isExampleReady(exampleSlugs) ? (
            <p className="mt-2 text-sm text-destructive">
              Add at least one brand, category, and source platform before importing real rows.
            </p>
          ) : null}
          <pre className="mt-3 max-h-96 overflow-auto rounded-md border border-border bg-background p-3 text-xs">
            {exampleProducts}
          </pre>
        </aside>
      </div>

      {importMutation.data === undefined ? null : (
        <div className="mt-6" role="status">
          <h3 className="font-semibold">Import Summary</h3>
          <dl className="mt-3 grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-sm text-muted-foreground">Created</dt>
              <dd className="text-xl font-semibold">{importMutation.data.createdCount}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Skipped</dt>
              <dd className="text-xl font-semibold">{importMutation.data.skippedCount}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Failed</dt>
              <dd className="text-xl font-semibold">{importMutation.data.failedRows.length}</dd>
            </div>
          </dl>

          {importMutation.data.failedRows.length === 0 ? null : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2">Row</th>
                    <th className="px-3 py-2">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {importMutation.data.failedRows.map((failure) => (
                    <tr className="border-b border-border" key={`${failure.row}-${failure.reason}`}>
                      <td className="px-3 py-2">{failure.row}</td>
                      <td className="px-3 py-2">{failure.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
