export type AdminCatalogResource = "brands" | "categories" | "source-platforms";

export type AdminCatalogRecord = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminSourcePlatform = AdminCatalogRecord & {
  baseUrl: string | null;
};

export type AdminCatalogListRecord = AdminCatalogRecord | AdminSourcePlatform;

export type AdminCatalogPagination = {
  page: number;
  pageSize: number;
  total: number;
  hasNextPage: boolean;
};

export type AdminCatalogListInput = {
  page: number;
  pageSize: number;
};

export type AdminCatalogListResponse = {
  data: {
    items: AdminCatalogListRecord[];
  };
  meta: {
    pagination: AdminCatalogPagination;
  };
};

export type AdminCatalogDetailResponse = {
  data: AdminCatalogListRecord;
};

export type AdminCatalogInput = {
  name: string;
  slug?: string;
  isActive?: boolean;
  baseUrl?: string | null;
};

export type UpdateAdminCatalogInput = {
  id: string;
  input: AdminCatalogInput;
};

export type DeleteAdminCatalogRecordResponse = {
  data: {
    success: boolean;
    deactivated: boolean;
  };
};
