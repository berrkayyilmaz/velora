import { z } from "zod";

const uuidSchema = z.string().uuid();
const queryTextSchema = z.string().trim().min(1).max(100);
const priceFilterSchema = z.coerce.number().finite().nonnegative();

const catalogRecordSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  slug: z.string()
});

export const productListQuerySchema = z
  .object({
    brandId: uuidSchema.optional(),
    categoryId: uuidSchema.optional(),
    sourcePlatformId: uuidSchema.optional(),
    color: queryTextSchema.optional(),
    minPrice: priceFilterSchema.optional(),
    maxPrice: priceFilterSchema.optional(),
    search: queryTextSchema.optional(),
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20)
  })
  .strict()
  .refine(
    (value) =>
      value.minPrice === undefined ||
      value.maxPrice === undefined ||
      value.minPrice <= value.maxPrice,
    {
      message: "minPrice must be less than or equal to maxPrice.",
      path: ["minPrice"]
    }
  );

export const productParamsSchema = z.object({
  id: uuidSchema
});

const productSummarySchema = z.object({
  id: uuidSchema,
  title: z.string(),
  brand: catalogRecordSchema,
  category: catalogRecordSchema,
  sourcePlatform: catalogRecordSchema,
  price: z.string(),
  imageUrl: z.string(),
  color: z.string(),
  isFavorited: z.boolean()
});

const productDetailSchema = productSummarySchema.extend({
  productUrl: z.string(),
  description: z.string().nullable(),
  availableColors: z.array(z.string()),
  tags: z.array(z.string()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

const paginationSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  hasNextPage: z.boolean()
});

export const productListResponseSchema = z.object({
  data: z.object({
    items: z.array(productSummarySchema)
  }),
  meta: z.object({
    pagination: paginationSchema
  })
});

export const productDetailResponseSchema = z.object({
  data: productDetailSchema
});

export type ProductListQuery = z.infer<typeof productListQuerySchema>;
export type ProductParams = z.infer<typeof productParamsSchema>;
export type ProductSummaryResponse = z.infer<typeof productSummarySchema>;
export type ProductDetailResponse = z.infer<typeof productDetailSchema>;
export type ProductListResponse = z.infer<typeof productListResponseSchema>;
