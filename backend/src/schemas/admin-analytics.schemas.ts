import { z } from "zod";

import { analyticsEventTypeSchema } from "./analytics.schemas.js";
import { redirectSourceScreenSchema } from "./redirect.schemas.js";

const uuidSchema = z.string().uuid();
const dateTimeQuerySchema = z
  .string()
  .datetime()
  .transform((value) => new Date(value));

const paginationSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  hasNextPage: z.boolean()
});

const appliedDateRangeFiltersSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional()
});

const dateRangeQueryShape = {
  from: dateTimeQuerySchema.optional(),
  to: dateTimeQuerySchema.optional()
} as const;

const paginationQueryShape = {
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20)
} as const;

function hasValidDateRange(value: { from?: Date; to?: Date }): boolean {
  return value.from === undefined || value.to === undefined || value.from <= value.to;
}

export const adminAnalyticsSummaryQuerySchema = z
  .object(dateRangeQueryShape)
  .strict()
  .refine(hasValidDateRange, {
    message: "`from` must be before or equal to `to`.",
    path: ["to"]
  });

export const adminAnalyticsEventsQuerySchema = z
  .object({
    ...dateRangeQueryShape,
    ...paginationQueryShape,
    eventType: analyticsEventTypeSchema.optional(),
    userId: uuidSchema.optional(),
    productId: uuidSchema.optional(),
    outfitId: uuidSchema.optional()
  })
  .strict()
  .refine(hasValidDateRange, {
    message: "`from` must be before or equal to `to`.",
    path: ["to"]
  });

export const adminAnalyticsRedirectsQuerySchema = z
  .object({
    ...dateRangeQueryShape,
    ...paginationQueryShape,
    productId: uuidSchema.optional(),
    sourcePlatformId: uuidSchema.optional(),
    sourceScreen: redirectSourceScreenSchema.optional()
  })
  .strict()
  .refine(hasValidDateRange, {
    message: "`from` must be before or equal to `to`.",
    path: ["to"]
  });

export const adminAnalyticsSummaryResponseSchema = z.object({
  data: z.object({
    userCount: z.number().int().nonnegative(),
    productCount: z.number().int().nonnegative(),
    wishlistItemCount: z.number().int().nonnegative(),
    outfitCount: z.number().int().nonnegative(),
    analyticsEventCount: z.number().int().nonnegative(),
    redirectCount: z.number().int().nonnegative()
  }),
  meta: z.object({
    appliedFilters: appliedDateRangeFiltersSchema
  })
});

export const adminAnalyticsEventSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema.nullable(),
  eventType: z.string(),
  productId: uuidSchema.nullable(),
  outfitId: uuidSchema.nullable(),
  sourceScreen: z.string().nullable(),
  metadata: z.unknown().nullable(),
  createdAt: z.string().datetime()
});

export const adminAnalyticsEventsResponseSchema = z.object({
  data: z.object({
    items: z.array(adminAnalyticsEventSchema)
  }),
  meta: z.object({
    pagination: paginationSchema,
    appliedFilters: appliedDateRangeFiltersSchema.extend({
      eventType: analyticsEventTypeSchema.optional(),
      userId: uuidSchema.optional(),
      productId: uuidSchema.optional(),
      outfitId: uuidSchema.optional()
    })
  })
});

export const adminAnalyticsRedirectSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema.nullable(),
  productId: uuidSchema,
  outfitId: uuidSchema.nullable(),
  sourcePlatformId: uuidSchema,
  sourceScreen: z.string(),
  createdAt: z.string().datetime()
});

export const adminAnalyticsRedirectsResponseSchema = z.object({
  data: z.object({
    items: z.array(adminAnalyticsRedirectSchema)
  }),
  meta: z.object({
    pagination: paginationSchema,
    appliedFilters: appliedDateRangeFiltersSchema.extend({
      productId: uuidSchema.optional(),
      sourcePlatformId: uuidSchema.optional(),
      sourceScreen: redirectSourceScreenSchema.optional()
    })
  })
});

export type AdminAnalyticsSummaryQuery = z.infer<typeof adminAnalyticsSummaryQuerySchema>;
export type AdminAnalyticsEventsQuery = z.infer<typeof adminAnalyticsEventsQuerySchema>;
export type AdminAnalyticsRedirectsQuery = z.infer<typeof adminAnalyticsRedirectsQuerySchema>;
export type AdminAnalyticsSummaryResponse = z.infer<typeof adminAnalyticsSummaryResponseSchema>;
export type AdminAnalyticsEventResponse = z.infer<typeof adminAnalyticsEventSchema>;
export type AdminAnalyticsEventsResponse = z.infer<typeof adminAnalyticsEventsResponseSchema>;
export type AdminAnalyticsRedirectResponse = z.infer<typeof adminAnalyticsRedirectSchema>;
export type AdminAnalyticsRedirectsResponse = z.infer<typeof adminAnalyticsRedirectsResponseSchema>;
