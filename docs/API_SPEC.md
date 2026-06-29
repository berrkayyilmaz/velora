# Velora MVP REST API Specification

Version: 1.1<br>
Status: Draft<br>
Date: 2026-06-29<br>
Source: `docs/PRD.md`, `docs/ARCHITECTURE.md`, and `docs/DATABASE.md`

## 1. Purpose

This document defines the MVP REST API specification for the Velora Fastify backend.

It is an API contract document. It does not contain Fastify route implementation code, Prisma schema code, migrations, SQL, or frontend implementation code.

The API supports the approved MVP scope:

- Health checks
- User authentication
- User profile
- Product discovery
- Product search and filtering
- Product detail pages
- Wishlist / favorites
- Outfit creation and saving
- Retailer redirect tracking
- MVP analytics events
- Internal admin authentication
- Internal admin product management
- Internal admin catalog management
- Internal admin analytics

The API intentionally excludes AI virtual try-on, AI stylist recommendations, checkout, payments, order tracking, social features, public web app APIs, partner dashboards, and advanced recommendation systems.

Section 17 contains non-contract API planning for post-MVP Phase 2 Digital Wardrobe and
Phase 3 Virtual Try-On. It does not add endpoints to the current backend and does not change
the MVP `/api/v1` contract.

## 2. API Conventions

### 2.1 Base Path

All MVP endpoints should use:

- `/api/v1`

### 2.2 Authentication Levels

| Auth Level | Meaning |
| --- | --- |
| Public | No authentication required. |
| Optional user auth | Request may include user authentication. If present, related events should be tied to the user. |
| User auth | Requires an authenticated mobile app user. |
| Admin auth | Requires an authenticated internal Velora admin user. |

The concrete auth token/session mechanism should be selected during implementation. This specification only defines which endpoints require user or admin authentication.

### 2.3 Common Response Envelope

Successful responses should return a consistent shape:

| Field | Purpose |
| --- | --- |
| `data` | Main response payload. |
| `meta` | Optional pagination, sorting, or summary metadata. |

Error responses should return:

| Field | Purpose |
| --- | --- |
| `error.code` | Stable machine-readable error code. |
| `error.message` | User-safe error message. |
| `error.details` | Optional validation details. |

### 2.4 Pagination Query Parameters

List endpoints should support simple pagination where useful.

| Parameter | Required | Purpose |
| --- | --- | --- |
| `page` | No | Page number. Defaults to 1. |
| `pageSize` | No | Number of records per page. Defaults should be conservative. |

Pagination response metadata should include:

| Field | Purpose |
| --- | --- |
| `page` | Current page. |
| `pageSize` | Current page size. |
| `total` | Total records matching the query when practical. |
| `hasNextPage` | Whether another page exists. |

### 2.5 Common Data Shapes

#### UserProfile

| Field | Purpose |
| --- | --- |
| `id` | User ID. |
| `email` | User email. |
| `displayName` | Optional basic profile display name. |
| `createdAt` | Account creation timestamp. |
| `updatedAt` | Last update timestamp. |

#### AuthSession

| Field | Purpose |
| --- | --- |
| `user` | `UserProfile`. |
| `authToken` | Auth token or session credential chosen during implementation. |

#### AdminSession

| Field | Purpose |
| --- | --- |
| `adminUser` | Admin user ID and email. |
| `authToken` | Admin auth token or session credential chosen during implementation. |

#### ProductSummary

| Field | Purpose |
| --- | --- |
| `id` | Product ID. |
| `title` | Product title. |
| `brand` | Brand summary: `id`, `name`, `slug`. |
| `category` | Category summary: `id`, `name`, `slug`. |
| `sourcePlatform` | Source platform summary: `id`, `name`, `slug`. |
| `price` | Product price. |
| `imageUrl` | Primary image URL. |
| `color` | Primary color. |
| `isFavorited` | Whether current authenticated user has saved the product. |

#### ProductDetail

Includes all `ProductSummary` fields plus:

| Field | Purpose |
| --- | --- |
| `productUrl` | External retailer URL. |
| `description` | Optional product description. |
| `availableColors` | Optional available colors. |
| `tags` | Optional product tags. |
| `createdAt` | Product creation timestamp. |
| `updatedAt` | Last update timestamp. |

#### WishlistItem

| Field | Purpose |
| --- | --- |
| `id` | Wishlist item ID. |
| `product` | `ProductSummary`. |
| `createdAt` | Saved timestamp. |

#### OutfitSummary

| Field | Purpose |
| --- | --- |
| `id` | Outfit ID. |
| `name` | Outfit name. |
| `productCount` | Number of products in outfit. |
| `productsPreview` | Small list of `ProductSummary` items for preview. |
| `createdAt` | Outfit creation timestamp. |
| `updatedAt` | Last update timestamp. |

#### OutfitDetail

Includes all `OutfitSummary` fields plus:

| Field | Purpose |
| --- | --- |
| `products` | Full list of `ProductSummary` items. |
| `includedCategories` | Categories represented in the outfit. |
| `missingCategoryHints` | Optional soft guidance such as missing shoes or bag. |

#### AnalyticsEvent

| Field | Purpose |
| --- | --- |
| `id` | Analytics event ID. |
| `eventType` | Approved MVP event type. |
| `userId` | User ID when available. |
| `productId` | Related product ID when applicable. |
| `outfitId` | Related outfit ID when applicable. |
| `sourceScreen` | Source screen when applicable. |
| `metadata` | Small event-specific metadata. |
| `createdAt` | Event timestamp. |

#### RedirectEvent

| Field | Purpose |
| --- | --- |
| `id` | Redirect event ID. |
| `userId` | User ID when available. |
| `productId` | Product ID. |
| `outfitId` | Outfit ID when applicable. |
| `sourcePlatform` | Source platform summary. |
| `sourceScreen` | Source screen. |
| `createdAt` | Redirect timestamp. |

## 3. Health Endpoints

| Method | Path | Purpose | Auth requirement | Request body or query parameters | Response shape | Main validation rules | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/health` | Confirm API process is reachable. | Public | None. | `data.status`, `data.service`, `data.timestamp`. | None. | Should not expose sensitive runtime details. |

## 4. Authentication Endpoints

| Method | Path | Purpose | Auth requirement | Request body or query parameters | Response shape | Main validation rules | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/v1/auth/register` | Create a user account. | Public | Body: `email`, `password`, optional `displayName`. | `data` is `AuthSession`. | Email must be valid and unique. Password must meet MVP password policy. `displayName`, if provided, must be a safe string. | Should create the user's default wishlist. Should emit `user_registered`. |
| POST | `/api/v1/auth/login` | Authenticate a user. | Public | Body: `email`, `password`. | `data` is `AuthSession`. | Email must be valid. Password is required. Invalid credentials must return a generic error. | Should emit `user_logged_in` after successful login. |
| POST | `/api/v1/auth/logout` | End current user session. | User auth | None. | `data.success`. | Valid user auth required. | Should emit `user_logged_out`. |
| POST | `/api/v1/auth/password-reset/request` | Request password reset. | Public | Body: `email`. | `data.accepted`. | Email must be valid. Response must not reveal whether account exists. | Should emit `password_reset_requested` when applicable. Delivery mechanism remains an implementation detail. |
| POST | `/api/v1/auth/password-reset/confirm` | Complete password reset. | Public | Body: `token`, `newPassword`. | `data.success`. | Token must be valid, unexpired, and unused. New password must meet MVP password policy. | Raw reset tokens must never be stored. |

## 5. User Profile Endpoints

| Method | Path | Purpose | Auth requirement | Request body or query parameters | Response shape | Main validation rules | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/me` | Get authenticated user's profile. | User auth | None. | `data` is `UserProfile`. | Valid user auth required. | Must return only the authenticated user's data. |
| PATCH | `/api/v1/me` | Update basic profile information. | User auth | Body: optional `displayName`. | `data` is `UserProfile`. | `displayName`, if provided, must be a safe string. | Exact MVP profile fields may be refined later; keep minimal. |

## 6. Product Endpoints

| Method | Path | Purpose | Auth requirement | Request body or query parameters | Response shape | Main validation rules | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/products` | List, search, and filter active products. | User auth | Query: `search`, `brandId`, `categoryId`, `sourcePlatformId`, `color`, `minPrice`, `maxPrice`, `sort`, `page`, `pageSize`. | `data.items` list of `ProductSummary`; `meta.pagination`; `meta.appliedFilters`. | Filter IDs must be valid IDs when provided. Prices must be non-negative. `minPrice` must be less than or equal to `maxPrice`. Sort must be supported. | Uses PostgreSQL-backed search and filtering. No Elasticsearch in MVP. |
| GET | `/api/v1/products/filter-options` | Get catalog filter options. | User auth | None. | `data.brands`, `data.categories`, `data.sourcePlatforms`, `data.colors`, optional `data.priceRange`. | Valid user auth required. | Supports frontend filter UI without hardcoding catalog values. |
| GET | `/api/v1/products/:productId` | Get product detail. | User auth | Path: `productId`. | `data` is `ProductDetail`. | Product must exist and be active. | Should emit or allow client to emit `product_viewed`. |

## 7. Wishlist Endpoints

| Method | Path | Purpose | Auth requirement | Request body or query parameters | Response shape | Main validation rules | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/wishlist` | Get current user's default wishlist. | User auth | Query: optional `sort` with `newest` or `oldest`. | `data.items` list of `WishlistItem`; `meta.sort`. | Sort must be supported. | MVP supports one default wishlist only. |
| POST | `/api/v1/wishlist/items` | Favorite a product. | User auth | Body: `productId`. | `data` is `WishlistItem`. | Product must exist and be active. Product must not already exist in user's wishlist. | Should emit `product_favorited`. |
| DELETE | `/api/v1/wishlist/items/:productId` | Unfavorite a product. | User auth | Path: `productId`. | `data.success`. | Product must exist in authenticated user's wishlist. | Should emit `product_unfavorited`. |

## 8. Outfit Endpoints

| Method | Path | Purpose | Auth requirement | Request body or query parameters | Response shape | Main validation rules | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/outfits` | List current user's saved outfits. | User auth | Query: optional `sort`, `page`, `pageSize`. | `data.items` list of `OutfitSummary`; `meta.pagination`. | Valid user auth required. Sort must be supported. | Must only return outfits owned by authenticated user. |
| POST | `/api/v1/outfits` | Create and save an outfit. | User auth | Body: `name`, optional `productIds`. | `data` is `OutfitDetail`. | `name` is required. `productIds`, if provided, must be unique active product IDs. | Should emit `outfit_created`; products added during creation should emit `product_added_to_outfit`. |
| GET | `/api/v1/outfits/:outfitId` | Get outfit detail. | User auth | Path: `outfitId`. | `data` is `OutfitDetail`. | Outfit must belong to authenticated user. | Includes soft category guidance only. No style scoring. |
| PATCH | `/api/v1/outfits/:outfitId` | Edit outfit metadata. | User auth | Path: `outfitId`; body: optional `name`. | `data` is `OutfitDetail`. | Outfit must belong to authenticated user. `name`, if provided, must not be empty. | Should emit `outfit_edited`. |
| DELETE | `/api/v1/outfits/:outfitId` | Delete an outfit. | User auth | Path: `outfitId`. | `data.success`. | Outfit must belong to authenticated user. | Should emit `outfit_deleted`. |
| POST | `/api/v1/outfits/:outfitId/products` | Add product to outfit. | User auth | Path: `outfitId`; body: `productId`. | `data` is `OutfitDetail`. | Outfit must belong to authenticated user. Product must exist and be active. Product must not already be in outfit. | Should emit `product_added_to_outfit`. No category rules enforced. |
| DELETE | `/api/v1/outfits/:outfitId/products/:productId` | Remove product from outfit. | User auth | Path: `outfitId`, `productId`. | `data` is `OutfitDetail`. | Outfit must belong to authenticated user. Product must exist in outfit. | Should emit `product_removed_from_outfit`. |

## 9. Retailer Redirect Endpoints

| Method | Path | Purpose | Auth requirement | Request body or query parameters | Response shape | Main validation rules | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/v1/redirects` | Record retailer redirect before opening product URL. | Optional user auth | Body: `productId`, optional `outfitId`, `sourceScreen`. | `data.redirectId`, `data.productUrl`. | Product must exist and be active. Product must have `productUrl`. `outfitId`, if provided, must belong to authenticated user. `sourceScreen` must be one of approved values. | Creates `RedirectEvent` and should also emit `retailer_redirect_clicked`. Does not handle checkout, payment, orders, or conversion attribution beyond redirects. |

Approved MVP `sourceScreen` values for redirects:

- `catalog`
- `product_detail`
- `wishlist`
- `outfit`

## 10. Analytics Event Endpoints

| Method | Path | Purpose | Auth requirement | Request body or query parameters | Response shape | Main validation rules | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/v1/analytics/events` | Record an MVP analytics event. | Optional user auth | Body: `eventType`, optional `productId`, optional `outfitId`, optional `sourceScreen`, optional `metadata`. | `data.accepted`; optional `data.eventId`. | `eventType` must be approved. Related IDs must exist when provided. `outfitId`, if provided with user auth, must belong to authenticated user. Metadata must stay small and safe. | Analytics failures must not block core user actions. Backend may also emit analytics internally for important flows. |

Approved MVP `eventType` values:

- `user_registered`
- `user_logged_in`
- `user_logged_out`
- `password_reset_requested`
- `product_viewed`
- `product_searched`
- `product_filter_applied`
- `product_favorited`
- `product_unfavorited`
- `outfit_created`
- `outfit_saved`
- `outfit_edited`
- `outfit_deleted`
- `product_added_to_outfit`
- `product_removed_from_outfit`
- `retailer_redirect_clicked`

## 11. Admin Authentication Endpoints

| Method | Path | Purpose | Auth requirement | Request body or query parameters | Response shape | Main validation rules | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/v1/admin/auth/login` | Authenticate internal admin. | Public | Body: `email`, `password`. | `data` is `AdminSession`. | Email must be valid. Password is required. Invalid credentials must return a generic error. | Internal admin login only. No public admin registration. |
| POST | `/api/v1/admin/auth/logout` | End current admin session. | Admin auth | None. | `data.success`. | Valid admin auth required. | No user account logout side effects. |

## 12. Admin Product Management Endpoints

| Method | Path | Purpose | Auth requirement | Request body or query parameters | Response shape | Main validation rules | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/admin/products` | List products for admin management. | Admin auth | Query: `search`, `brandId`, `categoryId`, `sourcePlatformId`, `color`, `isActive`, `page`, `pageSize`. | `data.items` list of admin product records; `meta.pagination`; `meta.appliedFilters`. | Filter IDs must be valid when provided. `isActive` must be boolean when provided. | Includes active and inactive products when requested. |
| GET | `/api/v1/admin/products/:productId` | Get admin product detail. | Admin auth | Path: `productId`. | `data` is admin product detail. | Product must exist. | Admin view may include inactive products. |
| POST | `/api/v1/admin/products` | Create product. | Admin auth | Body: `title`, `brandId`, `categoryId`, `sourcePlatformId`, `price`, `imageUrl`, `productUrl`, `color`, optional `description`, optional `availableColors`, optional `tags`, optional `isActive`. | `data` is admin product detail. | Required fields must be present. Relationship IDs must exist. Price must be non-negative. URLs must be valid. | Product data should pass the same validation used for imports. |
| PATCH | `/api/v1/admin/products/:productId` | Update product. | Admin auth | Path: `productId`; body may include any editable product field. | `data` is admin product detail. | Product must exist. Relationship IDs must exist when provided. Price must be non-negative. URLs must be valid when provided. | Use `isActive` to hide products without breaking historical wishlist, outfit, analytics, or redirect references. |
| DELETE | `/api/v1/admin/products/:productId` | Delete or deactivate product. | Admin auth | Path: `productId`. | `data.success`; optional `data.deactivated`. | Product must exist. | MVP may prefer deactivation when product has historical references. No checkout/order impact exists in MVP. |
| POST | `/api/v1/admin/products/import` | Import products from structured JSON. | Admin auth | Body: `products`, an array of 1-100 product rows. Each row uses the product create fields and exactly one ID or slug for each of brand, category, and source platform. Optional `id` supports repeatable imports. | `data.createdCount`, `data.skippedCount`, `data.failedRows`; each failed row includes its one-based `row` and `reason`. | Every row is validated independently. Catalog references must resolve to existing records. Existing product IDs or product URLs are skipped. | Creates valid new products without updating existing products. Invalid rows do not abort valid rows. No scraping or broad marketplace integration implied. |

Admin product detail shape:

| Field | Purpose |
| --- | --- |
| `id` | Product ID. |
| `title` | Product title. |
| `brand` | Brand summary. |
| `category` | Category summary. |
| `sourcePlatform` | Source platform summary. |
| `price` | Product price. |
| `imageUrl` | Primary image URL. |
| `productUrl` | Retailer URL. |
| `color` | Primary color. |
| `description` | Optional description. |
| `availableColors` | Optional colors. |
| `tags` | Optional tags. |
| `isActive` | Catalog visibility. |
| `createdAt` | Creation timestamp. |
| `updatedAt` | Last update timestamp. |

## 13. Admin Catalog Management Endpoints

### 13.1 Brand Endpoints

| Method | Path | Purpose | Auth requirement | Request body or query parameters | Response shape | Main validation rules | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/admin/brands` | List brands. | Admin auth | Query: optional `search`, `page`, `pageSize`. | `data.items` list of brand records; `meta.pagination`. | Valid admin auth required. | Used for product management and filters. |
| POST | `/api/v1/admin/brands` | Create brand. | Admin auth | Body: `name`, optional `slug`. | `data` is brand record. | Name is required and unique. Slug must be unique if provided. | Slug may be generated during implementation if omitted. |
| PATCH | `/api/v1/admin/brands/:brandId` | Update brand. | Admin auth | Path: `brandId`; body: optional `name`, optional `slug`. | `data` is brand record. | Brand must exist. Name and slug must remain unique. | Avoid deleting or changing meaning of brands used by products. |
| DELETE | `/api/v1/admin/brands/:brandId` | Delete brand if unused. | Admin auth | Path: `brandId`. | `data.success`. | Brand must exist and must not be used by products. | If brand is used, return validation error instead of deleting. |

### 13.2 Category Endpoints

| Method | Path | Purpose | Auth requirement | Request body or query parameters | Response shape | Main validation rules | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/admin/categories` | List categories. | Admin auth | Query: optional `search`, `page`, `pageSize`. | `data.items` list of category records; `meta.pagination`. | Valid admin auth required. | MVP categories should match PRD categories. |
| POST | `/api/v1/admin/categories` | Create category. | Admin auth | Body: `name`, optional `slug`. | `data` is category record. | Name is required and unique. Slug must be unique if provided. | Keep category set simple for MVP. |
| PATCH | `/api/v1/admin/categories/:categoryId` | Update category. | Admin auth | Path: `categoryId`; body: optional `name`, optional `slug`. | `data` is category record. | Category must exist. Name and slug must remain unique. | Changes affect product filtering and outfit category guidance. |
| DELETE | `/api/v1/admin/categories/:categoryId` | Delete category if unused. | Admin auth | Path: `categoryId`. | `data.success`. | Category must exist and must not be used by products. | If category is used, return validation error instead of deleting. |

### 13.3 Source Platform Endpoints

| Method | Path | Purpose | Auth requirement | Request body or query parameters | Response shape | Main validation rules | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/admin/source-platforms` | List source platforms. | Admin auth | Query: optional `search`, `page`, `pageSize`. | `data.items` list of source platform records; `meta.pagination`. | Valid admin auth required. | Used for product filtering and redirect analytics. |
| POST | `/api/v1/admin/source-platforms` | Create source platform. | Admin auth | Body: `name`, optional `slug`, optional `baseUrl`. | `data` is source platform record. | Name is required and unique. Slug must be unique if provided. `baseUrl`, if provided, must be valid. | Does not create affiliate integration. |
| PATCH | `/api/v1/admin/source-platforms/:sourcePlatformId` | Update source platform. | Admin auth | Path: `sourcePlatformId`; body: optional `name`, optional `slug`, optional `baseUrl`. | `data` is source platform record. | Source platform must exist. Name and slug must remain unique. `baseUrl`, if provided, must be valid. | Changes affect product filtering and redirect reporting. |
| DELETE | `/api/v1/admin/source-platforms/:sourcePlatformId` | Delete source platform if unused. | Admin auth | Path: `sourcePlatformId`. | `data.success`. | Source platform must exist and must not be used by products or redirect events. | If used, return validation error instead of deleting. |

Catalog record shape:

| Field | Purpose |
| --- | --- |
| `id` | Record ID. |
| `name` | Display name. |
| `slug` | Stable API-friendly identifier. |
| `baseUrl` | Source platform only, optional. |
| `createdAt` | Creation timestamp. |
| `updatedAt` | Last update timestamp. |

## 14. Admin Analytics Endpoints

| Method | Path | Purpose | Auth requirement | Request body or query parameters | Response shape | Main validation rules | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/admin/analytics/summary` | View MVP analytics summary. | Admin auth | Query: optional `from`, `to`. | `data.userRegistrations`, `data.productViews`, `data.wishlistActions`, `data.outfitCreations`, `data.retailerRedirects`, optional time-series summaries. | Date range must be valid. `from` must be before `to`. | Supports MVP admin dashboard. No revenue reporting in MVP. |
| GET | `/api/v1/admin/analytics/events` | Browse analytics events. | Admin auth | Query: `eventType`, `userId`, `productId`, `outfitId`, `from`, `to`, `page`, `pageSize`. | `data.items` list of `AnalyticsEvent`; `meta.pagination`. | Filters must be valid IDs or approved event types. Date range must be valid. | Internal-only. Not exposed to users. |
| GET | `/api/v1/admin/analytics/redirects` | Review retailer redirect analytics. | Admin auth | Query: `productId`, `sourcePlatformId`, `sourceScreen`, `from`, `to`, `page`, `pageSize`. | `data.items` list of `RedirectEvent`; `meta.pagination`; optional `meta.summary`. | Filters must reference valid records. `sourceScreen` must be approved. Date range must be valid. | Redirects are first-class records because they are MVP validation and future affiliate signals. |

## 15. Validation Rules Summary

### 15.1 IDs

- Path IDs must be syntactically valid IDs.
- Related IDs in request bodies must refer to existing records.
- User-owned resources must belong to the authenticated user.
- Admin-managed catalog IDs must exist before use.

### 15.2 User Data

- Email must be valid.
- User email must be unique.
- Password must meet the MVP password policy.
- Passwords must never be returned in API responses.
- Password reset responses must not reveal whether an email exists.

### 15.3 Product Data

- Product title is required.
- Product brand, category, and source platform are required.
- Product price must be non-negative.
- Product image URL and product URL must be valid URLs.
- Product color is required.
- Product description, available colors, and tags are optional.
- Products must have `productUrl` to support retailer redirects.

### 15.4 Wishlist Data

- A user has one default wishlist in MVP.
- A product can appear only once in a user's wishlist.
- Wishlist access is scoped to the authenticated user.

### 15.5 Outfit Data

- Outfit name is required.
- Outfit access is scoped to the authenticated user.
- Product IDs added to outfits must reference active products.
- A product can appear only once in the same outfit.
- No category, style, or scoring rules are enforced in MVP.

### 15.6 Analytics Data

- Event type must be one of the approved MVP event types.
- Analytics metadata must stay small and safe.
- Analytics failures must not block core user actions.

### 15.7 Redirect Data

- Redirects require an active product with a valid `productUrl`.
- Redirects require an approved `sourceScreen`.
- Redirects should be recorded before the client opens the retailer URL.
- Redirect tracking does not include checkout, payments, order tracking, or conversion attribution beyond redirects.

## 16. Explicit MVP Exclusions

The API must not include MVP endpoints for:

- AI virtual try-on
- AI stylist recommendations
- Python AI services
- FastAPI AI layer
- Checkout
- Payments
- Order tracking
- AR experiences
- Social feeds, follows, comments, or public profiles
- User-generated content marketplace
- Brand dashboards
- Partner accounts
- Creator or influencer tools
- Revenue reporting
- Affiliate management tools
- Public web app APIs

## 17. Post-MVP API Planning

### 17.1 Status And Compatibility Rules

The endpoints and shapes in this section are planning candidates, not approved implementation
contracts.

- Existing MVP endpoints remain unchanged.
- Existing `/api/v1/outfits/:outfitId/products` endpoints continue to mean catalog products.
- Phase 2 additions should be additive where practical.
- If mixed outfit responses cannot remain backward compatible, they should use a new response
  shape or API version rather than silently changing `ProductSummary` arrays.
- Every wardrobe and try-on endpoint requires user authentication.
- All wardrobe, outfit, media, and try-on ownership must be verified server-side.

### 17.2 Phase 2 Planned Data Shapes

#### WardrobeItem

| Field | Purpose |
| --- | --- |
| `id` | Wardrobe item ID. |
| `title` | User-provided item name. |
| `category` | Category summary. |
| `color` | Optional primary color. |
| `brandLabel` | Optional free-text brand label. |
| `notes` | Optional private notes. |
| `status` | Active or archived. |
| `media` | Private media summaries with short-lived read URLs. |
| `createdAt` | Creation timestamp. |
| `updatedAt` | Last update timestamp. |

Wardrobe responses must not expose object-storage keys, upload credentials, or another user's
records.

#### MixedOutfitItem

Outfit items should use a discriminator:

| Field | Purpose |
| --- | --- |
| `type` | `catalog_product` or `wardrobe_item`. |
| `id` | Outfit relationship ID or stable item identifier selected during contract design. |
| `catalogProduct` | `ProductSummary` when type is `catalog_product`; otherwise absent. |
| `wardrobeItem` | Wardrobe item summary when type is `wardrobe_item`; otherwise absent. |
| `addedAt` | Timestamp when the item was added to the outfit. |

Exactly one source payload must be present. Clients must not infer item type from missing
retailer or price fields.

### 17.3 Phase 2 Candidate Wardrobe Endpoints

| Method | Candidate Path | Purpose | Main Planning Rules |
| --- | --- | --- | --- |
| GET | `/api/v1/wardrobe/items` | List the authenticated user's wardrobe. | Support conservative pagination and optional category, color, and status filters. Return only owned records. |
| POST | `/api/v1/wardrobe/items` | Create wardrobe item metadata. | Require title and category. Do not require price, retailer, source platform, or product URL. |
| GET | `/api/v1/wardrobe/items/:wardrobeItemId` | Get wardrobe item detail. | Item must belong to authenticated user. |
| PATCH | `/api/v1/wardrobe/items/:wardrobeItemId` | Edit wardrobe item metadata or archive status. | Item must belong to authenticated user. Validate category and user-entered fields. |
| DELETE | `/api/v1/wardrobe/items/:wardrobeItemId` | Delete or schedule deletion of a wardrobe item. | Define behavior for outfit references and media cleanup before implementation. |
| POST | `/api/v1/wardrobe/items/:wardrobeItemId/media/upload-request` | Request a private media upload. | Validate ownership, MIME type, file size, and media purpose. Return short-lived upload authorization only. |
| POST | `/api/v1/wardrobe/items/:wardrobeItemId/media/confirm` | Confirm and validate an uploaded object. | Object must match the authorized user, item, size, and type before media becomes ready. |
| DELETE | `/api/v1/wardrobe/items/:wardrobeItemId/media/:mediaId` | Remove wardrobe media. | Media must belong to item and user. Trigger storage deletion. |

The upload-request/confirm split is preferred because direct object-storage uploads should
not create trusted database media records before validation.

### 17.4 Phase 2 Candidate Outfit Extensions

| Method | Candidate Path | Purpose | Main Planning Rules |
| --- | --- | --- | --- |
| POST | `/api/v1/outfits/:outfitId/wardrobe-items` | Add owned wardrobe item to outfit. | Outfit and wardrobe item must belong to the same authenticated user. Prevent duplicate wardrobe item relationships. |
| DELETE | `/api/v1/outfits/:outfitId/wardrobe-items/:wardrobeItemId` | Remove wardrobe item from outfit. | Outfit must belong to user and item must be present. |
| GET | `/api/v1/outfits/:outfitId` or versioned equivalent | Return mixed outfit detail. | Return an explicit discriminated item collection. Preserve current product-only fields during a compatibility period if practical. |

Creating an outfit with both sources may later accept separate `productIds` and
`wardrobeItemIds`, or a discriminated `items` array. The final choice should be made with a
versioning plan and must not reinterpret the existing MVP `productIds` field.

### 17.5 Phase 3 Planned Data Shapes

#### TryOnProfile

| Field | Purpose |
| --- | --- |
| `id` | Try-on profile ID. |
| `status` | Active, disabled, or deletion pending. |
| `currentConsent` | Current consent version and purpose summary; no policy text duplication. |
| `createdAt` | Creation timestamp. |
| `updatedAt` | Last update timestamp. |

#### TryOnJob

| Field | Purpose |
| --- | --- |
| `id` | Try-on job ID. |
| `status` | Queued, processing, succeeded, failed, canceled, or deletion pending. |
| `items` | Discriminated catalog or wardrobe item summaries. |
| `result` | Private result summary with a short-lived URL when ready. |
| `failureCode` | Stable user-safe failure reason when applicable. |
| `createdAt` | Job creation timestamp. |
| `completedAt` | Optional terminal timestamp. |
| `expiresAt` | Optional result retention deadline. |

API responses must not expose provider job IDs, internal storage keys, raw model prompts,
processor credentials, or detailed provider errors.

### 17.6 Phase 3 Candidate Profile And Consent Endpoints

| Method | Candidate Path | Purpose | Main Planning Rules |
| --- | --- | --- | --- |
| GET | `/api/v1/me/try-on-profile` | Get optional try-on profile. | Return only authenticated user's profile. |
| POST | `/api/v1/me/try-on-profile` | Create try-on profile after consent flow starts. | Must not silently create or populate sensitive fields during normal registration. |
| PATCH | `/api/v1/me/try-on-profile` | Update approved profile fields. | Permit only fields required by the selected model and approved policy. |
| DELETE | `/api/v1/me/try-on-profile` | Withdraw and delete try-on profile. | Start idempotent deletion across jobs, assets, storage, and processors. |
| POST | `/api/v1/me/try-on-profile/consents` | Record explicit current consent. | Require supported policy version and purpose. |
| DELETE | `/api/v1/me/try-on-profile/consents/current` | Withdraw current consent. | Block new jobs immediately and start applicable deletion workflow. |

### 17.7 Phase 3 Candidate Try-On Endpoints

| Method | Candidate Path | Purpose | Main Planning Rules |
| --- | --- | --- | --- |
| POST | `/api/v1/try-on/assets/upload-request` | Request private source-media upload. | Require current consent; validate type, size, purpose, and ownership. |
| POST | `/api/v1/try-on/assets/:assetId/confirm` | Confirm source media readiness. | Validate object and run approved input-quality checks before allowing jobs. |
| DELETE | `/api/v1/try-on/assets/:assetId` | Delete private source or result asset. | Asset must belong to user; deletion must propagate to storage and processors where applicable. |
| POST | `/api/v1/try-on/jobs` | Create asynchronous try-on request. | Require current consent, ready source media, supported item types/categories, and owned outfit/wardrobe references. Use idempotency protection. |
| GET | `/api/v1/try-on/jobs/:jobId` | Read job status and private result. | Job must belong to authenticated user. Return user-safe status only. |
| GET | `/api/v1/try-on/jobs` | List user's recent jobs. | Conservative pagination and retention-aware results. |
| DELETE | `/api/v1/try-on/jobs/:jobId` | Cancel when possible or delete job and result. | Enforce valid status transitions and idempotent cleanup. |

### 17.8 Post-MVP Validation And Privacy Rules

- Wardrobe and try-on IDs must always be checked against authenticated ownership.
- Outfit and wardrobe item owners must match.
- Upload authorization must be short-lived and limited to one object key, size, type, and
  purpose.
- Read URLs must be short-lived and must not be stored in analytics.
- Private media, storage keys, measurements, consent details, and provider identifiers must
  not be accepted in generic analytics metadata.
- Consent must be current when a try-on job is created and again before external dispatch.
- Unsupported categories or insufficient inputs should fail validation before creating
  expensive AI work where practical.
- Job creation should support idempotency to avoid duplicate AI cost.
- Deletion endpoints should be safe to retry and should expose deletion-pending state when
  cross-system cleanup is asynchronous.
