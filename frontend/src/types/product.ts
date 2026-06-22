export type CatalogRecord = {
  id: string;
  name: string;
  slug: string;
};

export type ProductSummary = {
  id: string;
  title: string;
  brand: CatalogRecord;
  category: CatalogRecord;
  sourcePlatform: CatalogRecord;
  price: string;
  imageUrl: string;
  color: string;
  isFavorited: boolean;
};

export type ProductDetail = ProductSummary & {
  productUrl: string;
  description: string | null;
  availableColors: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type ProductFilters = {
  brandId?: string;
  categoryId?: string;
  sourcePlatformId?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
};

export type ProductListQuery = ProductFilters & {
  search?: string;
};

export type ProductFilterOptions = {
  brands: CatalogRecord[];
  categories: CatalogRecord[];
  sourcePlatforms: CatalogRecord[];
  colors: string[];
  priceRange: {
    minPrice: string;
    maxPrice: string;
  } | null;
};

export type ProductListResponse = {
  data: {
    items: ProductSummary[];
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

export type ProductDetailResponse = {
  data: ProductDetail;
};

export type ProductFilterOptionsResponse = {
  data: ProductFilterOptions;
};
