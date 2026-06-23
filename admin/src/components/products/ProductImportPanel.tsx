import { type FormEvent, useState } from "react";

import { useImportAdminProducts } from "@/hooks/useAdminProducts";
import { getApiErrorMessage } from "@/utils/api-error";

type ProductImportPanelProps = {
  onClose: () => void;
};

const exampleProducts = JSON.stringify(
  [
    {
      title: "Essential Cotton Shirt",
      brandSlug: "solenne",
      categorySlug: "tops",
      sourcePlatformSlug: "velora-demo-retail",
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

export function ProductImportPanel({ onClose }: ProductImportPanelProps) {
  const [json, setJson] = useState(exampleProducts);
  const [parseError, setParseError] = useState<string | null>(null);
  const importMutation = useImportAdminProducts();

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

  const error = parseError ?? (importMutation.isError ? getApiErrorMessage(importMutation.error) : null);

  return (
    <section aria-labelledby="product-import-heading" className="mt-6 border-y border-border py-6">
      <h2 className="text-lg font-semibold" id="product-import-heading">
        Import Products
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Paste a JSON array of up to 100 products. Catalog references accept either an ID or slug.
      </p>

      <form className="mt-5" onSubmit={submitImport}>
        <label className="text-sm font-medium" htmlFor="product-import-json">
          Products JSON
          <textarea
            className="mt-1 min-h-80 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm outline-none focus:border-ring"
            id="product-import-json"
            onChange={(event) => setJson(event.target.value)}
            spellCheck={false}
            value={json}
          />
        </label>

        {error === null ? null : (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <div className="mt-4 flex gap-3">
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
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>
      </form>

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
