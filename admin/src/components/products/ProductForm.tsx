import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import type { AdminProduct, AdminProductInput } from "@/types/admin-product";

type ProductFormProps = {
  product?: AdminProduct;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (product: AdminProductInput) => Promise<void>;
};

type ProductFormState = {
  title: string;
  brandId: string;
  categoryId: string;
  sourcePlatformId: string;
  price: string;
  imageUrl: string;
  productUrl: string;
  color: string;
  description: string;
  availableColors: string;
  tags: string;
  isActive: boolean;
};

function createInitialState(product?: AdminProduct): ProductFormState {
  return {
    title: product?.title ?? "",
    brandId: product?.brand.id ?? "",
    categoryId: product?.category.id ?? "",
    sourcePlatformId: product?.sourcePlatform.id ?? "",
    price: product?.price ?? "",
    imageUrl: product?.imageUrl ?? "",
    productUrl: product?.productUrl ?? "",
    color: product?.color ?? "",
    description: product?.description ?? "",
    availableColors: product?.availableColors.join(", ") ?? "",
    tags: product?.tags.join(", ") ?? "",
    isActive: product?.isActive ?? true
  };
}

function parseList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function ProductForm({ product, isSubmitting, onCancel, onSubmit }: ProductFormProps) {
  const [form, setForm] = useState<ProductFormState>(() => createInitialState(product));

  const submitProduct = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const description = form.description.trim();
    void onSubmit({
      title: form.title.trim(),
      brandId: form.brandId.trim(),
      categoryId: form.categoryId.trim(),
      sourcePlatformId: form.sourcePlatformId.trim(),
      price: Number(form.price),
      imageUrl: form.imageUrl.trim(),
      productUrl: form.productUrl.trim(),
      color: form.color.trim(),
      description: description.length === 0 ? null : description,
      availableColors: parseList(form.availableColors),
      tags: parseList(form.tags),
      isActive: form.isActive
    });
  };

  return (
    <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={submitProduct}>
      <label className="text-sm font-medium sm:col-span-2" htmlFor="product-title">
        Title
        <Input
          className="mt-1"
          id="product-title"
          maxLength={200}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
          required
          value={form.title}
        />
      </label>

      <label className="text-sm font-medium" htmlFor="product-brand-id">
        Brand ID
        <Input
          className="mt-1"
          id="product-brand-id"
          onChange={(event) => setForm({ ...form, brandId: event.target.value })}
          pattern="[0-9a-fA-F-]{36}"
          required
          value={form.brandId}
        />
      </label>

      <label className="text-sm font-medium" htmlFor="product-category-id">
        Category ID
        <Input
          className="mt-1"
          id="product-category-id"
          onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
          pattern="[0-9a-fA-F-]{36}"
          required
          value={form.categoryId}
        />
      </label>

      <label className="text-sm font-medium" htmlFor="product-source-platform-id">
        Source Platform ID
        <Input
          className="mt-1"
          id="product-source-platform-id"
          onChange={(event) => setForm({ ...form, sourcePlatformId: event.target.value })}
          pattern="[0-9a-fA-F-]{36}"
          required
          value={form.sourcePlatformId}
        />
      </label>

      <label className="text-sm font-medium" htmlFor="product-price">
        Price
        <Input
          className="mt-1"
          id="product-price"
          min="0"
          onChange={(event) => setForm({ ...form, price: event.target.value })}
          required
          step="0.01"
          type="number"
          value={form.price}
        />
      </label>

      <label className="text-sm font-medium sm:col-span-2" htmlFor="product-image-url">
        Image URL
        <Input
          className="mt-1"
          id="product-image-url"
          onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
          required
          type="url"
          value={form.imageUrl}
        />
      </label>

      <label className="text-sm font-medium sm:col-span-2" htmlFor="product-url">
        Product URL
        <Input
          className="mt-1"
          id="product-url"
          onChange={(event) => setForm({ ...form, productUrl: event.target.value })}
          required
          type="url"
          value={form.productUrl}
        />
      </label>

      <label className="text-sm font-medium" htmlFor="product-color">
        Color
        <Input
          className="mt-1"
          id="product-color"
          maxLength={100}
          onChange={(event) => setForm({ ...form, color: event.target.value })}
          required
          value={form.color}
        />
      </label>

      <label className="text-sm font-medium" htmlFor="product-available-colors">
        Available colors
        <Input
          className="mt-1"
          id="product-available-colors"
          onChange={(event) => setForm({ ...form, availableColors: event.target.value })}
          placeholder="Black, White"
          value={form.availableColors}
        />
      </label>

      <label className="text-sm font-medium sm:col-span-2" htmlFor="product-description">
        Description
        <Textarea
          className="mt-1"
          id="product-description"
          maxLength={2000}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
          rows={3}
          value={form.description}
        />
      </label>

      <label className="text-sm font-medium sm:col-span-2" htmlFor="product-tags">
        Tags
        <Input
          className="mt-1"
          id="product-tags"
          onChange={(event) => setForm({ ...form, tags: event.target.value })}
          placeholder="casual, summer"
          value={form.tags}
        />
      </label>

      <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2">
        <input
          checked={form.isActive}
          onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
          type="checkbox"
        />
        Active
      </label>

      <div className="flex gap-3 sm:col-span-2">
        <Button
          isLoading={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Saving" : product === undefined ? "Create Product" : "Save Changes"}
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
