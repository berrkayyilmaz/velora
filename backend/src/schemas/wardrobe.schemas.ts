import { z } from "zod";

const uuidSchema = z.string().uuid();
const wardrobeItemTitleSchema = z.string().trim().min(1).max(120);
const wardrobeItemStatusSchema = z.enum(["draft", "active", "archived", "deletion_pending"]);
const editableWardrobeItemStatusSchema = z.enum(["draft", "archived"]);

const nullableOptionalText = (maxLength: number) =>
  z.string().trim().min(1).max(maxLength).nullable().optional();

const categorySummarySchema = z.object({
  id: uuidSchema,
  name: z.string(),
  slug: z.string()
});

const wardrobeItemSchema = z.object({
  id: uuidSchema,
  title: z.string(),
  category: categorySummarySchema,
  color: z.string().nullable(),
  brandLabel: z.string().nullable(),
  notes: z.string().nullable(),
  status: wardrobeItemStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

const paginationSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  hasNextPage: z.boolean()
});

export const wardrobeListQuerySchema = z
  .object({
    search: z.string().trim().min(1).max(120).optional(),
    categoryId: uuidSchema.optional(),
    status: wardrobeItemStatusSchema.optional(),
    sort: z.enum(["newest", "oldest"]).default("newest"),
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20)
  })
  .strict();

export const wardrobeItemParamsSchema = z.object({
  id: uuidSchema
});

export const createWardrobeItemRequestSchema = z
  .object({
    title: wardrobeItemTitleSchema,
    categoryId: uuidSchema,
    color: nullableOptionalText(100),
    brandLabel: nullableOptionalText(120),
    notes: nullableOptionalText(1000)
  })
  .strict();

export const updateWardrobeItemRequestSchema = z
  .object({
    title: wardrobeItemTitleSchema.optional(),
    categoryId: uuidSchema.optional(),
    color: nullableOptionalText(100),
    brandLabel: nullableOptionalText(120),
    notes: nullableOptionalText(1000),
    status: editableWardrobeItemStatusSchema.optional()
  })
  .strict()
  .refine((input) => Object.values(input).some((value) => value !== undefined), {
    message: "At least one field must be provided."
  });

export const wardrobeListResponseSchema = z.object({
  data: z.object({
    items: z.array(wardrobeItemSchema)
  }),
  meta: z.object({
    pagination: paginationSchema,
    appliedFilters: z.object({
      search: z.string().optional(),
      categoryId: uuidSchema.optional(),
      status: wardrobeItemStatusSchema.optional(),
      sort: z.enum(["newest", "oldest"])
    })
  })
});

export const wardrobeItemResponseSchema = z.object({
  data: wardrobeItemSchema
});

export const deleteWardrobeItemResponseSchema = z.object({
  data: z.object({
    success: z.boolean()
  })
});

export type WardrobeListQuery = z.infer<typeof wardrobeListQuerySchema>;
export type WardrobeItemParams = z.infer<typeof wardrobeItemParamsSchema>;
export type CreateWardrobeItemRequest = z.infer<typeof createWardrobeItemRequestSchema>;
export type UpdateWardrobeItemRequest = z.infer<typeof updateWardrobeItemRequestSchema>;
export type WardrobeItemResponseData = z.infer<typeof wardrobeItemSchema>;
export type WardrobeListResponse = z.infer<typeof wardrobeListResponseSchema>;
export type WardrobeItemResponse = z.infer<typeof wardrobeItemResponseSchema>;
export type DeleteWardrobeItemResponse = z.infer<typeof deleteWardrobeItemResponseSchema>;
