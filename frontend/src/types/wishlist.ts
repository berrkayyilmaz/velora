import type { ProductSummary } from "@/types/product";

export type WishlistSort = "newest" | "oldest";

export type WishlistItem = {
  id: string;
  product: ProductSummary;
  createdAt: string;
};

export type WishlistResponse = {
  data: {
    items: WishlistItem[];
  };
  meta: {
    sort: WishlistSort;
  };
};

export type WishlistItemResponse = {
  data: WishlistItem;
};

export type DeleteWishlistItemResponse = {
  data: {
    success: boolean;
  };
};
