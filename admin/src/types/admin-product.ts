export type AdminCatalogRecord = {
  id: string;
  name: string;
  slug: string;
};

export type AdminProduct = {
  id: string;
  title: string;
  brand: AdminCatalogRecord;
  category: AdminCatalogRecord;
  sourcePlatform: AdminCatalogRecord;
  price: string;
  imageUrl: string;
  productUrl: string;
  color: string;
  description: string | null;
  availableColors: string[];
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminProductPagination = {
  page: number;
  pageSize: number;
  total: number;
  hasNextPage: boolean;
};

export type AdminProductListInput = {
  page: number;
  pageSize: number;
};

export type AdminProductListResponse = {
  data: {
    items: AdminProduct[];
  };
  meta: {
    pagination: AdminProductPagination;
  };
};

export type AdminProductDetailResponse = {
  data: AdminProduct;
};

export type AdminProductInput = {
  title: string;
  brandId: string;
  categoryId: string;
  sourcePlatformId: string;
  price: number;
  imageUrl: string;
  productUrl: string;
  color: string;
  description: string | null;
  availableColors: string[];
  tags: string[];
  isActive: boolean;
};

export type UpdateAdminProductInput = {
  productId: string;
  product: AdminProductInput;
};

export type DeleteAdminProductResponse = {
  data: {
    success: boolean;
    deactivated: boolean;
  };
};

export type AdminProductImportInput = {
  products: unknown[];
};

export type AdminProductImportFailure = {
  row: number;
  reason: string;
};

export type AdminProductImportSummary = {
  createdCount: number;
  skippedCount: number;
  failedRows: AdminProductImportFailure[];
};

export type AdminProductImportResponse = {
  data: AdminProductImportSummary;
};
