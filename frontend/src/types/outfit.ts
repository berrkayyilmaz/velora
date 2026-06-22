import type { CatalogRecord, ProductSummary } from "@/types/product";

export type OutfitSort = "newest" | "oldest";

export type OutfitSummary = {
  id: string;
  name: string;
  productCount: number;
  productsPreview: ProductSummary[];
  createdAt: string;
  updatedAt: string;
};

export type OutfitDetail = OutfitSummary & {
  products: ProductSummary[];
  includedCategories: CatalogRecord[];
  missingCategoryHints: string[];
};

export type OutfitListResponse = {
  data: {
    items: OutfitSummary[];
  };
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      hasNextPage: boolean;
    };
  };
};

export type OutfitDetailResponse = {
  data: OutfitDetail;
};

export type DeleteOutfitResponse = {
  data: {
    success: boolean;
  };
};

export type CreateOutfitInput = {
  name: string;
  productIds?: string[];
};

export type UpdateOutfitInput = {
  outfitId: string;
  name: string;
};

export type OutfitProductInput = {
  outfitId: string;
  productId: string;
};
