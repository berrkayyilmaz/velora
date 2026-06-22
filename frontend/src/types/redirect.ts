export type RedirectSourceScreen =
  | "catalog"
  | "product_detail"
  | "wishlist"
  | "outfit";

export type CreateRetailerRedirectInput = {
  productId: string;
  outfitId?: string;
  sourceScreen: RedirectSourceScreen;
};

export type RetailerRedirect = {
  redirectId: string;
  productUrl: string;
};

export type RetailerRedirectResponse = {
  data: RetailerRedirect;
};
