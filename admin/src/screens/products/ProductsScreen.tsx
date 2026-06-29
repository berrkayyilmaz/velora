import { Archive, Pencil, Plus, Upload } from "lucide-react";
import { useState } from "react";

import { PaginationControls } from "@/components/PaginationControls";
import { ProductForm } from "@/components/products/ProductForm";
import { ProductImportPanel } from "@/components/products/ProductImportPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
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
      <td className="px-3 py-3">
        <Badge variant={product.isActive ? "success" : "outline"}>
          {product.isActive ? "Active" : "Inactive"}
        </Badge>
      </td>
      <td className="px-3 py-3">
        <div className="flex gap-2">
          <Button
            aria-label={`Edit ${product.title}`}
            onClick={() => onEdit(product.id)}
            size="icon"
            title={`Edit ${product.title}`}
            type="button"
            variant="outline"
          >
            <Pencil aria-hidden="true" size={16} />
          </Button>
          <Button
            aria-label={`Deactivate ${product.title}`}
            className="text-destructive"
            disabled={!product.isActive || isDeactivating}
            onClick={() => onDeactivate(product)}
            size="icon"
            title={`Deactivate ${product.title}`}
            type="button"
            variant="outline"
          >
            <Archive aria-hidden="true" size={16} />
          </Button>
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
          <Button
            onClick={openImportPanel}
            type="button"
            variant="outline"
          >
            <Upload aria-hidden="true" size={17} />
            Import JSON
          </Button>
          <Button
            onClick={openCreateForm}
            type="button"
          >
            <Plus aria-hidden="true" size={17} />
            Create Product
          </Button>
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
              <Button
                className="mt-3"
                onClick={() => void productQuery.refetch()}
                type="button"
                variant="outline"
              >
                Retry
              </Button>
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
          <div aria-label="Loading products" className="mt-4 grid gap-2">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : productsQuery.isError ? (
          <div className="mt-4" role="alert">
            <p className="text-destructive">{getApiErrorMessage(productsQuery.error)}</p>
            <Button
              className="mt-3"
              onClick={() => void productsQuery.refetch()}
              type="button"
              variant="outline"
            >
              Retry
            </Button>
          </div>
        ) : productsQuery.data.data.items.length === 0 ? (
          <EmptyState
            className="mt-4 border-y border-border"
            title="No products found"
          />
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
