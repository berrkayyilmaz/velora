import type { PrismaClient } from "@prisma/client";

import {
  findActiveProductById,
  findActiveProducts,
  findFavoritedProductIds,
  type ProductDetailRecord,
  type ProductSummaryRecord
} from "../repositories/product.repository.js";
import type {
  ProductDetailResponse,
  ProductListQuery,
  ProductListResponse,
  ProductSummaryResponse
} from "../schemas/product.schemas.js";

export class ProductServiceError extends Error {
  constructor(
    readonly code: string,
    readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "ProductServiceError";
  }
}

function toProductSummary(
  product: ProductSummaryRecord,
  favoritedProductIds: Set<string>
): ProductSummaryResponse {
  return {
    id: product.id,
    title: product.title,
    brand: product.brand,
    category: product.category,
    sourcePlatform: product.sourcePlatform,
    price: product.price.toString(),
    imageUrl: product.imageUrl,
    color: product.color,
    isFavorited: favoritedProductIds.has(product.id)
  };
}

function toProductDetail(
  product: ProductDetailRecord,
  favoritedProductIds: Set<string>
): ProductDetailResponse {
  return {
    ...toProductSummary(product, favoritedProductIds),
    productUrl: product.productUrl,
    description: product.description,
    availableColors: product.availableColors,
    tags: product.tags,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString()
  };
}

export async function listProducts(
  prisma: PrismaClient,
  userId: string,
  query: ProductListQuery
): Promise<ProductListResponse> {
  const { products, total } = await findActiveProducts(prisma, query);
  const favoritedProductIds = new Set(
    await findFavoritedProductIds(
      prisma,
      userId,
      products.map((product) => product.id)
    )
  );

  return {
    data: {
      items: products.map((product) => toProductSummary(product, favoritedProductIds))
    },
    meta: {
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        hasNextPage: query.page * query.pageSize < total
      }
    }
  };
}

export async function getProductDetail(
  prisma: PrismaClient,
  userId: string,
  productId: string
): Promise<ProductDetailResponse> {
  const product = await findActiveProductById(prisma, productId);

  if (product === null) {
    throw new ProductServiceError("PRODUCT_NOT_FOUND", 404, "Product was not found.");
  }

  const favoritedProductIds = new Set(await findFavoritedProductIds(prisma, userId, [product.id]));

  return toProductDetail(product, favoritedProductIds);
}
