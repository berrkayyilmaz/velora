import { Archive, Pencil, Plus, Upload } from "lucide-react";
import { useState } from "react";

import { PaginationControls } from "@/components/PaginationControls";
import { ProductForm } from "@/components/products/ProductForm";
import { ProductImportPanel } from "@/components/products/ProductImportPanel";
import {
  useAdminProduct,
  useAdminProducts,
  useCreateAdminProduct,
  useDeactivateAdminProduct,
  useUpdateAdminProduct
} from "@/hooks/useAdminProducts";
import type { AdminProduct, AdminProductInput } from "@/types/admin-product";
import { getApiErrorMessage } from "@/utils/api-error";

function ProductRow({
  product,
  isDeactivating,
  onDeactivate,
  onEdit
}: {
  product: AdminProduct;
  isDeactivating: boolean;
  onDeactivate: (product: AdminProduct) => void;
  onEdit: (productId: string) => void;
}) {
  return (
    <tr className="border-b border-border">
      <td className="px-3 py-3 font-medium">{product.title}</td>
      <td className="px-3 py-3">{product.brand.name}</td>
      <td className="px-3 py-3">{product.category.name}</td>
      <td className="px-3 py-3">{product.price}</td>
      <td className="px-3 py-3">{product.color}</td>
      <td className="px-3 py-3">{product.sourcePlatform.name}</td>
      <td className="px-3 py-3">{product.isActive ? "Active" : "Inactive"}</td>
      <td className="px-3 py-3">
        <div className="flex gap-2">
          <button
            aria-label={`Edit ${product.title}`}
            className="inline-flex size-9 items-center justify-center rounded-md border border-border"
            onClick={() => onEdit(product.id)}
            title={`Edit ${product.title}`}
            type="button"
          >
            <Pencil aria-hidden="true" size={16} />
          </button>
          <button
            aria-label={`Deactivate ${product.title}`}
            className="inline-flex size-9 items-center justify-center rounded-md border border-border text-destructive disabled:opacity-50"
            disabled={!product.isActive || isDeactivating}
            onClick={() => onDeactivate(product)}
            title={`Deactivate ${product.title}`}
            type="button"
          >
            <Archive aria-hidden="true" size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}

export function ProductsScreen() {
  const [page, setPage] = useState(1);
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isImportVisible, setIsImportVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const productsQuery = useAdminProducts(page);
  const productQuery = useAdminProduct(editingProductId);
  const createMutation = useCreateAdminProduct();
  const updateMutation = useUpdateAdminProduct();
  const deactivateMutation = useDeactivateAdminProduct();

  const closeForm = () => {
    setFormMode(null);
    setEditingProductId(null);
    createMutation.reset();
    updateMutation.reset();
  };

  const openCreateForm = () => {
    setSuccessMessage(null);
    setIsImportVisible(false);
    setEditingProductId(null);
    setFormMode("create");
    createMutation.reset();
  };

  const openEditForm = (productId: string) => {
    setSuccessMessage(null);
    setIsImportVisible(false);
    setEditingProductId(productId);
    setFormMode("edit");
    updateMutation.reset();
  };

  const openImportPanel = () => {
    setSuccessMessage(null);
    closeForm();
    setIsImportVisible(true);
  };

  const submitCreate = async (product: AdminProductInput) => {
    try {
      await createMutation.mutateAsync(product);
      setSuccessMessage("Product created.");
      closeForm();
    } catch {
      return;
    }
  };

  const submitUpdate = async (product: AdminProductInput) => {
    if (editingProductId === null) {
      return;
    }

    try {
      await updateMutation.mutateAsync({ productId: editingProductId, product });
      setSuccessMessage("Product updated.");
      closeForm();
    } catch {
      return;
    }
  };

  const deactivateProduct = (product: AdminProduct) => {
    if (!window.confirm(`Deactivate ${product.title}?`)) {
      return;
    }

    setSuccessMessage(null);
    deactivateMutation.reset();
    deactivateMutation.mutate(product.id, {
      onSuccess: () => {
        setSuccessMessage("Product deactivated.");
        if (editingProductId === product.id) {
          closeForm();
        }
      }
    });
  };

  const formError = createMutation.error ?? updateMutation.error;

  return (
    <main className="mx-auto w-full max-w-7xl p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Products</h1>
        <div className="flex gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium"
            onClick={openImportPanel}
            type="button"
          >
            <Upload aria-hidden="true" size={17} />
            Import JSON
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            onClick={openCreateForm}
            type="button"
          >
            <Plus aria-hidden="true" size={17} />
            Create Product
          </button>
        </div>
      </div>

      {successMessage === null ? null : (
        <p className="mt-5 text-sm" role="status">
          {successMessage}
        </p>
      )}

      {deactivateMutation.isError ? (
        <p className="mt-5 text-destructive" role="alert">
          {getApiErrorMessage(deactivateMutation.error)}
        </p>
      ) : null}

      {isImportVisible ? (
        <ProductImportPanel onClose={() => setIsImportVisible(false)} />
      ) : null}

      {formMode === null ? null : (
        <section aria-labelledby="product-form-heading" className="mt-6 border-y border-border py-6">
          <h2 className="text-lg font-semibold" id="product-form-heading">
            {formMode === "create" ? "Create Product" : "Edit Product"}
          </h2>
          {formMode === "edit" && productQuery.isPending ? (
            <p className="mt-4 text-muted-foreground">Loading product.</p>
          ) : formMode === "edit" && productQuery.isError ? (
            <div className="mt-4" role="alert">
              <p className="text-destructive">{getApiErrorMessage(productQuery.error)}</p>
              <button
                className="mt-3 rounded-md border border-border px-3 py-2"
                onClick={() => void productQuery.refetch()}
                type="button"
              >
                Retry
              </button>
            </div>
          ) : formMode === "create" || productQuery.data !== undefined ? (
            <>
              {formError === null ? null : (
                <p className="mt-4 text-destructive" role="alert">
                  {getApiErrorMessage(formError)}
                </p>
              )}
              <ProductForm
                isSubmitting={createMutation.isPending || updateMutation.isPending}
                key={productQuery.data?.id ?? "create-product"}
                onCancel={closeForm}
                onSubmit={formMode === "create" ? submitCreate : submitUpdate}
                product={formMode === "edit" ? productQuery.data : undefined}
              />
            </>
          ) : null}
        </section>
      )}

      <section aria-labelledby="product-list-heading" className="mt-8">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-semibold" id="product-list-heading">
            Product Catalog
          </h2>
          {productsQuery.data === undefined ? null : (
            <span className="text-sm text-muted-foreground">
              {productsQuery.data.meta.pagination.total.toLocaleString()} products
            </span>
          )}
        </div>

        {productsQuery.isPending ? (
          <p className="mt-4 text-muted-foreground">Loading products.</p>
        ) : productsQuery.isError ? (
          <div className="mt-4" role="alert">
            <p className="text-destructive">{getApiErrorMessage(productsQuery.error)}</p>
            <button
              className="mt-3 rounded-md border border-border px-3 py-2"
              onClick={() => void productsQuery.refetch()}
              type="button"
            >
              Retry
            </button>
          </div>
        ) : productsQuery.data.data.items.length === 0 ? (
          <p className="mt-4 text-muted-foreground">No products found.</p>
        ) : (
          <>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-5xl text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-3">Title</th>
                    <th className="px-3 py-3">Brand</th>
                    <th className="px-3 py-3">Category</th>
                    <th className="px-3 py-3">Price</th>
                    <th className="px-3 py-3">Color</th>
                    <th className="px-3 py-3">Platform</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {productsQuery.data.data.items.map((product) => (
                    <ProductRow
                      isDeactivating={
                        deactivateMutation.isPending && deactivateMutation.variables === product.id
                      }
                      key={product.id}
                      onDeactivate={deactivateProduct}
                      onEdit={openEditForm}
                      product={product}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationControls
              hasNextPage={productsQuery.data.meta.pagination.hasNextPage}
              label="products"
              onPageChange={setPage}
              page={page}
            />
          </>
        )}
      </section>
    </main>
  );
}
