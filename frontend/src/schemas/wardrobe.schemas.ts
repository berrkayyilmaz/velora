import { z } from "zod";

import { wardrobeMediaSchema } from "@/schemas/wardrobe-media.schemas";

const uuidSchema = z.string().uuid();
const optionalNullableText = (maxLength: number) =>
  z.string().trim().min(1).max(maxLength).nullable().optional();

export const wardrobeItemStatusSchema = z.enum([
  "draft",
  "active",
  "archived",
  "deletion_pending"
]);

export const wardrobeEditableStatusSchema = z.enum(["draft", "archived"]);
export const wardrobeSortSchema = z.enum(["newest", "oldest"]);

export const wardrobeListQuerySchema = z.object({
  search: z.string().trim().min(1).max(120).optional(),
  categoryId: uuidSchema.optional(),
  status: wardrobeItemStatusSchema.optional(),
  sort: wardrobeSortSchema.optional()
});

export const createWardrobeItemInputSchema = z.object({
  title: z.string().trim().min(1).max(120),
  categoryId: uuidSchema,
  color: optionalNullableText(100),
  brandLabel: optionalNullableText(120),
  notes: optionalNullableText(1000)
});

export const updateWardrobeItemFieldsSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    categoryId: uuidSchema.optional(),
    color: optionalNullableText(100),
    brandLabel: optionalNullableText(120),
    notes: optionalNullableText(1000),
    status: wardrobeEditableStatusSchema.optional()
  })
  .refine((input) => Object.values(input).some((value) => value !== undefined), {
    message: "At least one field must be provided."
  });

export const updateWardrobeItemInputSchema = updateWardrobeItemFieldsSchema.and(
  z.object({
    wardrobeItemId: uuidSchema
  })
);

export const wardrobeItemFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(120),
  categoryId: uuidSchema,
  color: z.string().trim().max(100),
  brandLabel: z.string().trim().max(120),
  notes: z.string().trim().max(1000),
  status: z.union([wardrobeEditableStatusSchema, z.literal("")])
});

export type WardrobeItemFormValues = z.infer<typeof wardrobeItemFormSchema>;

const categorySummarySchema = z.object({
  id: uuidSchema,
  name: z.string(),
  slug: z.string()
});

export const wardrobeItemSchema = z.object({
  id: uuidSchema,
  title: z.string(),
  category: categorySummarySchema,
  color: z.string().nullable(),
  brandLabel: z.string().nullable(),
  notes: z.string().nullable(),
  status: wardrobeItemStatusSchema,
  primaryMedia: wardrobeMediaSchema.nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

const paginationSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  hasNextPage: z.boolean()
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
      sort: wardrobeSortSchema
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
