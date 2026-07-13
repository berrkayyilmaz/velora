# Velora Database Design

Version: 1.1<br>
Status: Draft<br>
Date: 2026-06-29<br>
Source: `docs/PRD.md` v1.1 and `docs/ARCHITECTURE.md` v1.1

## 1. Purpose

This document defines the MVP database design for Velora using PostgreSQL and Prisma ORM.

It is a conceptual data model document. It does not contain Prisma schema code, migrations, SQL, or implementation code.

The design supports the approved MVP scope:

- User accounts and profiles
- Product catalog
- Product search and filtering
- Product detail pages
- Wishlist / favorites
- Outfit creation and saving
- Retailer redirects
- MVP analytics
- Internal admin product and analytics operations

The design intentionally excludes AI virtual try-on, AI stylist recommendations, checkout, payments, order tracking, social features, public web features, partner dashboards, and advanced recommendation infrastructure.

Section 23 defines planning-level database additions for post-MVP Phase 2 Digital Wardrobe
and Phase 3 Virtual Try-On. Those models are not part of the current Prisma schema or MVP
data contract.

## 2. Database Principles

- PostgreSQL is the single source of truth for MVP data.
- Prisma ORM should manage application-level database access and migrations.
- Tables should be relational and easy to query.
- MVP search and filtering should use PostgreSQL indexes and queries.
- Do not introduce Elasticsearch, Qdrant, Redis, or a dedicated analytics pipeline in MVP.
- User-owned records must be scoped by `userId`.
- Admin-only operations must use admin authentication and must not be exposed to normal users.
- Analytics writes should be best-effort and must not block core product workflows.
- Redirect tracking should be queryable independently from generic analytics events.

## 3. Naming And Type Conventions

These conventions should guide the later Prisma schema:

- Primary keys should use stable unique IDs.
- Timestamps should use `createdAt` and `updatedAt` where records are mutable.
- Join models should use explicit records rather than implicit many-to-many relations when metadata such as creation time may matter.
- Monetary values should use a decimal-compatible type, not floating point.
- URLs should be stored as strings and validated at the application boundary.
- Enum-like fields should remain simple for MVP and can become stricter later if needed.

## 4. Model Overview

Core customer models:

- `User`
- `PasswordResetToken`

Internal admin models:

- `AdminUser`

Catalog models:

- `Product`
- `Brand`
- `Category`
- `SourcePlatform`

Wishlist and outfit models:

- `Wishlist`
- `WishlistItem`
- `Outfit`
- `OutfitProduct`

Analytics and redirect models:

- `AnalyticsEvent`
- `RedirectEvent`

Post-MVP planned models:

- Phase 2: `WardrobeItem`, `WardrobeItemMedia`, `OutfitWardrobeItem`
- Phase 3: `UserAvatar`, `TryOnConsent`, `TryOnJob`, `TryOnResult`

## 5. User Model

### Purpose

Stores customer accounts for the mobile app. Users own wishlists, outfits, analytics events, and redirect events.

### Fields

| Field | Required | Purpose |
| --- | --- | --- |
| `id` | Yes | Primary identifier. |
| `email` | Yes | Unique login email. |
| `passwordHash` | Yes | Securely hashed password. Plain text passwords must never be stored. |
| `displayName` | No | Basic editable profile name. |
| `createdAt` | Yes | Account creation timestamp. |
| `updatedAt` | Yes | Last update timestamp. |

### Relationships

- One `User` has one default `Wishlist`.
- One `User` has many `Outfit` records.
- One `User` has many `AnalyticsEvent` records.
- One `User` has many `RedirectEvent` records.
- One `User` has many `PasswordResetToken` records.

### Indexes

- Unique index on `email`.
- Index on `createdAt` for registration analytics.

### MVP Notes

- Email and password authentication is required for MVP.
- Passwords must be stored as hashes only.
- Profile fields should remain minimal until exact editable profile fields are refined.
- User data access must always be scoped to the authenticated user.

### Post-MVP Considerations

- Social login identities.
- Profile photo.
- Style preferences.
- Personalized fashion preferences.
- Preference-based recommendations.
- One optional Digital Wardrobe relationship.
- One optional, separately protected try-on profile relationship.

## 6. PasswordResetToken Model

### Purpose

Supports MVP password reset without storing reset tokens in plain text.

### Fields

| Field | Required | Purpose |
| --- | --- | --- |
| `id` | Yes | Primary identifier. |
| `userId` | Yes | User requesting password reset. |
| `tokenHash` | Yes | Secure hash of the reset token. |
| `expiresAt` | Yes | Expiration timestamp. |
| `usedAt` | No | Timestamp set after successful use. |
| `createdAt` | Yes | Creation timestamp. |

### Relationships

- Many `PasswordResetToken` records belong to one `User`.

### Indexes

- Index on `userId`.
- Unique index on `tokenHash`.
- Index on `expiresAt` for cleanup.

### MVP Notes

- Required because password reset is approved for MVP.
- Raw reset tokens should only be shown or sent once and should never be stored.
- Expired or used tokens should not be accepted.

### Post-MVP Considerations

- Password reset delivery mechanism may evolve after the MVP decision is made.
- Token cleanup can become a scheduled maintenance task.

## 7. AdminUser Model

### Purpose

Stores internal Velora administrator accounts for the admin panel.

### Fields

| Field | Required | Purpose |
| --- | --- | --- |
| `id` | Yes | Primary identifier. |
| `email` | Yes | Unique admin login email. |
| `passwordHash` | Yes | Securely hashed admin password. |
| `createdAt` | Yes | Admin account creation timestamp. |
| `updatedAt` | Yes | Last update timestamp. |

### Relationships

- No required relationships in MVP.
- Admin actions operate on products, brands, categories, source platforms, and analytics through authenticated admin APIs.

### Indexes

- Unique index on `email`.

### MVP Notes

- Internal admin login only.
- No public registration.
- No partner or brand accounts.
- No role hierarchy in MVP.

### Post-MVP Considerations

- Role-based permissions.
- Multi-admin roles.
- Audit logging for admin actions.
- Partner or brand accounts, if later approved.

## 8. Brand Model

### Purpose

Normalizes product brands for product management, search, and filtering.

Brand should be represented as its own model in MVP because brand filtering and admin brand management are approved requirements.

### Fields

| Field | Required | Purpose |
| --- | --- | --- |
| `id` | Yes | Primary identifier. |
| `name` | Yes | Brand display name. |
| `slug` | Yes | Stable URL/API-friendly identifier. |
| `createdAt` | Yes | Creation timestamp. |
| `updatedAt` | Yes | Last update timestamp. |

### Relationships

- One `Brand` has many `Product` records.

### Indexes

- Unique index on `name`.
- Unique index on `slug`.

### MVP Notes

- Supports product filtering by brand.
- Supports admin catalog management.
- Keeps seeded and real product data consistent.

### Post-MVP Considerations

- Brand metadata.
- Brand partnership data.
- Brand dashboards, only if later approved.

## 9. Category Model

### Purpose

Normalizes MVP product categories for catalog filtering and outfit category guidance.

Category should be represented as its own model in MVP because category filtering and admin category management are approved requirements.

### Fields

| Field | Required | Purpose |
| --- | --- | --- |
| `id` | Yes | Primary identifier. |
| `name` | Yes | Category display name. |
| `slug` | Yes | Stable URL/API-friendly identifier. |
| `createdAt` | Yes | Creation timestamp. |
| `updatedAt` | Yes | Last update timestamp. |

### Relationships

- One `Category` has many `Product` records.

### Indexes

- Unique index on `name`.
- Unique index on `slug`.

### MVP Notes

Approved MVP categories are:

- Tops
- Bottoms
- Dresses
- Outerwear
- Shoes
- Bags
- Accessories

### Post-MVP Considerations

- Category hierarchy.
- Men-specific categories.
- Additional category metadata for recommendations or outfit guidance.

## 10. SourcePlatform Model

### Purpose

Normalizes the retailer or source platform associated with each product.

Source platform should be represented as its own model in MVP because filtering by source platform, admin source platform management, and redirect analytics are approved requirements.

### Fields

| Field | Required | Purpose |
| --- | --- | --- |
| `id` | Yes | Primary identifier. |
| `name` | Yes | Retailer or platform display name. |
| `slug` | Yes | Stable URL/API-friendly identifier. |
| `baseUrl` | No | Optional retailer base URL for admin reference. |
| `createdAt` | Yes | Creation timestamp. |
| `updatedAt` | Yes | Last update timestamp. |

### Relationships

- One `SourcePlatform` has many `Product` records.
- One `SourcePlatform` has many `RedirectEvent` records.

### Indexes

- Unique index on `name`.
- Unique index on `slug`.

### MVP Notes

- Supports filtering products by retailer/source platform.
- Supports redirect analytics by retailer/source platform.
- Does not imply formal affiliate integration in MVP.

### Post-MVP Considerations

- Affiliate network metadata.
- Partner configuration.
- Revenue reporting, only if later approved.

## 11. Product Model

### Purpose

Stores fashion products shown in the mobile catalog and managed in the admin panel.

### Fields

| Field | Required | Purpose |
| --- | --- | --- |
| `id` | Yes | Primary identifier. |
| `title` | Yes | Product display title. |
| `brandId` | Yes | Brand relationship. |
| `categoryId` | Yes | Category relationship. |
| `sourcePlatformId` | Yes | Retailer/source platform relationship. |
| `price` | Yes | Product price. |
| `imageUrl` | Yes | Primary product image URL. |
| `productUrl` | Yes | External retailer URL. Required for redirects. |
| `color` | Yes | Primary color used for filtering and outfit building. |
| `description` | No | Optional product description. |
| `availableColors` | No | Optional available colors if data exists. |
| `tags` | No | Optional product tags if data exists. |
| `isActive` | Yes | Whether product is visible in the catalog. |
| `createdAt` | Yes | Creation timestamp. |
| `updatedAt` | Yes | Last update timestamp. |

### Relationships

- Many `Product` records belong to one `Brand`.
- Many `Product` records belong to one `Category`.
- Many `Product` records belong to one `SourcePlatform`.
- One `Product` has many `WishlistItem` records.
- One `Product` has many `OutfitProduct` records.
- One `Product` has many `AnalyticsEvent` records.
- One `Product` has many `RedirectEvent` records.

### Indexes

- Index on `brandId`.
- Index on `categoryId`.
- Index on `sourcePlatformId`.
- Index on `color`.
- Index on `price`.
- Index on `isActive`.
- Composite index on `categoryId` and `price`.
- Composite index on `brandId` and `categoryId`.
- Optional text-search-friendly index strategy for `title` using PostgreSQL capabilities if needed for MVP search.

### MVP Notes

- Product search and filtering should remain PostgreSQL-backed.
- Every product must have a `productUrl`.
- Product data can start as seeded mock data and later be partially replaced with real approved product data.
- `description`, `availableColors`, and `tags` are optional because product data quality may vary.
- `isActive` allows admins to hide products without deleting historical references.

### Post-MVP Considerations

- Size availability.
- Fit type.
- Material.
- Sustainability attributes.
- Richer media.
- Product variants.
- Advanced recommendation attributes.

## 12. Wishlist Model

### Purpose

Represents the user's default wishlist container.

Although the MVP supports a single default wishlist, this model keeps the design aligned with the architecture and leaves room for future collection-based organization without requiring a major redesign.

### Fields

| Field | Required | Purpose |
| --- | --- | --- |
| `id` | Yes | Primary identifier. |
| `userId` | Yes | Owner user. |
| `createdAt` | Yes | Creation timestamp. |
| `updatedAt` | Yes | Last update timestamp. |

### Relationships

- One `Wishlist` belongs to one `User`.
- One `Wishlist` has many `WishlistItem` records.

### Indexes

- Unique index on `userId` for the default MVP wishlist.

### MVP Notes

- Each user has one default wishlist.
- The product experience should present this as a simple favorites/wishlist feature, not as collections.

### Post-MVP Considerations

- Named collections.
- Multiple wishlists per user.
- Shared wishlists.
- Collaborative wishlists.
- Public wishlists.

## 13. WishlistItem Model

### Purpose

Stores products saved by a user in their default wishlist.

### Fields

| Field | Required | Purpose |
| --- | --- | --- |
| `id` | Yes | Primary identifier. |
| `wishlistId` | Yes | Wishlist container relationship. |
| `productId` | Yes | Saved product relationship. |
| `createdAt` | Yes | Save timestamp used for sorting. |

### Relationships

- Many `WishlistItem` records belong to one `Wishlist`.
- Many `WishlistItem` records reference one `Product`.

### Indexes

- Unique composite index on `wishlistId` and `productId`.
- Index on `wishlistId` and `createdAt` for newest/oldest sorting.
- Index on `productId` for product-level analytics and cleanup support.

### MVP Notes

- Users can favorite and unfavorite products.
- Users can view all saved products.
- Users can sort by newest saved or oldest saved.
- Users can add wishlist products to outfits.

### Post-MVP Considerations

- Collection membership.
- Shared wishlist visibility.
- Collaborative ownership.
- Public wishlist discovery.

## 14. Outfit Model

### Purpose

Stores saved outfits created by users.

### Fields

| Field | Required | Purpose |
| --- | --- | --- |
| `id` | Yes | Primary identifier. |
| `userId` | Yes | Owner user. |
| `name` | Yes | Required outfit name. |
| `createdAt` | Yes | Creation timestamp. |
| `updatedAt` | Yes | Last update timestamp. |

### Relationships

- Many `Outfit` records belong to one `User`.
- One `Outfit` has many `OutfitProduct` records.
- One `Outfit` has many `AnalyticsEvent` records.
- One `Outfit` has many `RedirectEvent` records when redirects originate from outfits.

### Indexes

- Index on `userId`.
- Index on `userId` and `updatedAt` for saved outfit lists.
- Index on `createdAt` for outfit creation analytics.

### MVP Notes

- Outfit name is required.
- Outfits can include products from multiple brands and source platforms.
- No required categories.
- No maximum number of products per category.
- No outfit scoring or style validation.

### Post-MVP Considerations

- Outfit cover image.
- Outfit notes.
- Outfit duplication.
- Curated outfit inspiration.
- AI outfit scoring or recommendations.
- Sharing or public visibility.

## 15. OutfitProduct Model

### Purpose

Join model between outfits and products.

An explicit join model is preferred because it stores when a product was added and can support future ordering or display metadata.

### Fields

| Field | Required | Purpose |
| --- | --- | --- |
| `id` | Yes | Primary identifier. |
| `outfitId` | Yes | Outfit relationship. |
| `productId` | Yes | Product relationship. |
| `createdAt` | Yes | Timestamp when product was added to outfit. |

### Relationships

- Many `OutfitProduct` records belong to one `Outfit`.
- Many `OutfitProduct` records reference one `Product`.

### Indexes

- Unique composite index on `outfitId` and `productId`.
- Index on `outfitId`.
- Index on `productId`.
- Index on `createdAt` for analytics.

### MVP Notes

- Users can add and remove products at any time.
- Products can come from different brands and retailers.
- The database should not enforce category rules.

### Post-MVP Considerations

- Manual product ordering inside an outfit.
- Product placement metadata.
- Outfit section labels.
- Outfit version history.

## 16. AnalyticsEvent Model

### Purpose

Stores approved MVP analytics events in PostgreSQL.

This model gives Velora a unified activity stream for product validation, engagement metrics, and admin analytics.

### Fields

| Field | Required | Purpose |
| --- | --- | --- |
| `id` | Yes | Primary identifier. |
| `userId` | No | Authenticated user when available. |
| `eventType` | Yes | Approved MVP event name. |
| `productId` | No | Related product when applicable. |
| `outfitId` | No | Related outfit when applicable. |
| `sourceScreen` | No | Catalog, product detail, wishlist, outfit, profile, auth, admin, or other approved source. |
| `metadata` | No | Small event-specific context. |
| `createdAt` | Yes | Event timestamp. |

### Relationships

- Many `AnalyticsEvent` records may belong to one `User`.
- Many `AnalyticsEvent` records may reference one `Product`.
- Many `AnalyticsEvent` records may reference one `Outfit`.

### Indexes

- Index on `eventType`.
- Index on `createdAt`.
- Index on `userId` and `createdAt`.
- Index on `productId` and `eventType`.
- Index on `outfitId` and `eventType`.
- Composite index on `eventType` and `createdAt` for admin dashboard counts.

### MVP Notes

Approved MVP events are:

- User Registered
- User Logged In
- User Logged Out
- Password Reset Requested
- Product Viewed
- Product Searched
- Product Filter Applied
- Product Favorited
- Product Unfavorited
- Outfit Created
- Outfit Saved
- Outfit Edited
- Outfit Deleted
- Product Added To Outfit
- Product Removed From Outfit
- Retailer Redirect Clicked

Analytics writes should not block core user actions.

### Post-MVP Considerations

- Dedicated analytics warehouse.
- Event pipeline.
- Session tracking.
- Funnel analysis.
- A/B testing.
- More detailed device and attribution context.

## 17. RedirectEvent Model

### Purpose

Stores retailer redirect clicks as first-class records.

`RedirectEvent` should be separate from `AnalyticsEvent` in MVP. Retailer redirects are a primary product validation signal and a future affiliate revenue signal. Keeping them separate makes redirect reporting simple and durable while still allowing each redirect to also create a `Retailer Redirect Clicked` analytics event.

### Fields

| Field | Required | Purpose |
| --- | --- | --- |
| `id` | Yes | Primary identifier. |
| `userId` | No | Authenticated user when available. |
| `productId` | Yes | Redirected product. |
| `outfitId` | No | Outfit context when redirect originated from an outfit. |
| `sourcePlatformId` | Yes | Retailer/source platform. |
| `sourceScreen` | Yes | Catalog, product detail, wishlist, or outfit. |
| `createdAt` | Yes | Redirect timestamp. |

### Relationships

- Many `RedirectEvent` records may belong to one `User`.
- Many `RedirectEvent` records belong to one `Product`.
- Many `RedirectEvent` records may belong to one `Outfit`.
- Many `RedirectEvent` records belong to one `SourcePlatform`.

### Indexes

- Index on `createdAt`.
- Index on `userId` and `createdAt`.
- Index on `productId` and `createdAt`.
- Index on `outfitId` and `createdAt`.
- Index on `sourcePlatformId` and `createdAt`.
- Composite index on `sourceScreen` and `createdAt`.

### MVP Notes

- Every redirect should be recorded before the external retailer URL is opened.
- Redirect events should support admin reporting by product, source platform, source screen, and time period.
- Velora does not track checkout, payment, order status, or conversion attribution beyond redirects in MVP.

### Post-MVP Considerations

- Affiliate click IDs.
- Campaign IDs.
- Revenue reporting.
- Partner attribution rules.
- Deeper conversion attribution if approved later.

## 18. Relationship Summary

High-level relationships:

- `User` -> `Wishlist`: one-to-one for MVP.
- `Wishlist` -> `WishlistItem`: one-to-many.
- `WishlistItem` -> `Product`: many-to-one.
- `User` -> `Outfit`: one-to-many.
- `Outfit` -> `OutfitProduct`: one-to-many.
- `OutfitProduct` -> `Product`: many-to-one.
- `Brand` -> `Product`: one-to-many.
- `Category` -> `Product`: one-to-many.
- `SourcePlatform` -> `Product`: one-to-many.
- `SourcePlatform` -> `RedirectEvent`: one-to-many.
- `User` -> `AnalyticsEvent`: one-to-many, nullable for unauthenticated events.
- `User` -> `RedirectEvent`: one-to-many, nullable for unauthenticated events.
- `Product` -> `AnalyticsEvent`: one-to-many where applicable.
- `Product` -> `RedirectEvent`: one-to-many.
- `Outfit` -> `AnalyticsEvent`: one-to-many where applicable.
- `Outfit` -> `RedirectEvent`: one-to-many where applicable.
- `User` -> `PasswordResetToken`: one-to-many.

## 19. Data Ownership And Access Rules

- Users can only access their own profile, wishlist, wishlist items, outfits, and outfit products.
- Outfit products must be accessed through outfits owned by the authenticated user.
- Wishlist items must be accessed through the authenticated user's wishlist.
- Product catalog data is readable by app users and manageable only by admins.
- Admin-only catalog and analytics APIs must require `AdminUser` authentication.
- Analytics and redirect data should be exposed to users only if explicitly needed later; MVP admin analytics is internal only.

## 20. Index Strategy Summary

MVP indexes should support:

- User lookup by email.
- Admin lookup by email.
- Product filtering by brand, category, source platform, color, price, and active status.
- Product search by title.
- Wishlist uniqueness and sorting by saved time.
- Outfit listing by user and recent updates.
- Outfit product uniqueness.
- Analytics counts by event type and time.
- Redirect counts by product, source platform, source screen, outfit, user, and time.

Avoid premature indexing beyond common MVP query paths. Indexes should be revisited after real usage data shows query patterns.

## 21. MVP Data Integrity Rules

- User emails must be unique.
- Admin emails must be unique.
- Brand names and slugs must be unique.
- Category names and slugs must be unique.
- Source platform names and slugs must be unique.
- Products must have a valid product URL.
- Products must belong to one brand, one category, and one source platform.
- Wishlist should be unique per user in MVP.
- A product should appear only once in a user's default wishlist.
- A product should appear only once in the same outfit.
- Outfit names are required.
- Redirect events require a product and source platform.
- Analytics events require an approved event type.

## 22. Post-MVP Database Considerations

Potential future database expansion areas:

- Social login identity records.
- Profile photos.
- Style preference records.
- Product size availability.
- Fit type and material fields.
- Sustainability attributes.
- Product variants.
- Wishlist collections.
- Shared and collaborative wishlists.
- Curated outfit inspiration.
- Public outfits or social sharing.
- Affiliate attribution metadata.
- Admin audit logs.
- Role-based permissions.
- Dedicated analytics warehouse or event pipeline.
- AI styling and try-on data, only when explicitly approved.

## 23. Post-MVP Data Model Roadmap

### 23.1 Scope And Migration Principles

- The existing MVP schema remains unchanged until Phase 2 implementation is approved.
- Wardrobe metadata belongs in PostgreSQL; image binary data belongs in private object
  storage.
- Wardrobe and try-on records must be owned directly or transitively by one `User`.
- Existing catalog `Product` records remain admin-managed and separate from user-owned
  wardrobe records.
- Existing `OutfitProduct` records continue to represent catalog products.
- Phase 2 adds `OutfitWardrobeItem` rather than converting existing outfit relationships to
  nullable polymorphic foreign keys.
- Phase 3 try-on data remains separate from the base `User` table.

### 23.2 Phase 2 Model: WardrobeItem

#### Purpose

Represents one product owned by a user in their private Digital Wardrobe.

#### Planned Fields

| Field | Required | Purpose |
| --- | --- | --- |
| `id` | Yes | Primary identifier. |
| `userId` | Yes | Owning user. |
| `title` | Yes | User-facing item name. |
| `categoryId` | Yes | Existing category used for organization and outfit guidance. |
| `color` | No | User-provided primary color. |
| `brandLabel` | No | Free-text brand name when known; not a catalog `Brand` relationship. |
| `notes` | No | Private user notes. |
| `status` | Yes | Active or archived lifecycle state. |
| `createdAt` | Yes | Creation timestamp. |
| `updatedAt` | Yes | Last update timestamp. |

#### Relationships

- Many `WardrobeItem` records belong to one `User`.
- Many `WardrobeItem` records belong to one `Category`.
- One `WardrobeItem` has many `WardrobeItemMedia` records.
- One `WardrobeItem` has many `OutfitWardrobeItem` records.
- A wardrobe item may be referenced by future `TryOnJob` records as a garment source.

#### Planned Indexes

- Index on `userId` and `status`.
- Index on `userId` and `updatedAt`.
- Index on `userId` and `categoryId`.
- Optional index on normalized color after real filtering requirements are validated.

#### Phase 2 Notes

- Price, retailer, source platform, `productUrl`, and affiliate data are not required.
- Wardrobe items are private and must never appear in the public catalog query.
- Archiving should be preferred when an item remains referenced by an outfit.
- Hard deletion behavior must define whether outfit references are removed or retained as a
  minimal snapshot.

### 23.3 Phase 2 Model: WardrobeItemMedia

#### Purpose

Stores metadata for privately stored wardrobe images without storing image binary data in
PostgreSQL.

#### Planned Fields

| Field | Required | Purpose |
| --- | --- | --- |
| `id` | Yes | Primary identifier. |
| `wardrobeItemId` | Yes | Owning wardrobe item. |
| `storageKey` | Yes | Private object-storage key. |
| `mediaType` | Yes | Approved MIME type. |
| `purpose` | Yes | Primary image or another approved wardrobe-image purpose. |
| `width` | No | Validated image width when available. |
| `height` | No | Validated image height when available. |
| `fileSize` | No | Validated object size for operations and limits. |
| `createdAt` | Yes | Creation timestamp. |
| `deletedAt` | No | Soft deletion or deletion-processing timestamp. |

#### Relationships

- Many `WardrobeItemMedia` records belong to one `WardrobeItem`.
- Ownership is inherited through `WardrobeItem.userId`.

#### Planned Indexes

- Unique index on `storageKey`.
- Index on `wardrobeItemId` and `createdAt`.
- Index on `deletedAt` for cleanup processing.

#### Phase 2 Notes

- API responses should expose short-lived read URLs, not durable storage keys.
- Upload confirmation should create the database record only after object validation.
- Cleanup must handle abandoned uploads and database records whose object deletion is still
  pending.

### 23.4 Phase 2 Model: OutfitWardrobeItem

#### Purpose

Joins a saved outfit to a user-owned wardrobe item while preserving the existing
`OutfitProduct` join for catalog products.

#### Planned Fields

| Field | Required | Purpose |
| --- | --- | --- |
| `id` | Yes | Primary identifier. |
| `outfitId` | Yes | Outfit relationship. |
| `wardrobeItemId` | Yes | Wardrobe item relationship. |
| `createdAt` | Yes | Timestamp when the item was added. |

#### Relationships

- Many `OutfitWardrobeItem` records belong to one `Outfit`.
- Many `OutfitWardrobeItem` records reference one `WardrobeItem`.
- The service must verify that the outfit and wardrobe item have the same `userId`.

#### Planned Indexes

- Unique composite index on `outfitId` and `wardrobeItemId`.
- Index on `outfitId`.
- Index on `wardrobeItemId`.
- Index on `createdAt`.

#### Phase 2 Notes

- Outfit responses should merge `OutfitProduct` and `OutfitWardrobeItem` as discriminated
  items.
- A catalog product and wardrobe item are distinct even if they represent the same physical
  product.
- Cross-source manual ordering is not assumed. If required later, ordering must be designed
  consistently across both join models.

### 23.5 Phase 3 Model: UserAvatar

#### Purpose

Represents a user-owned person/avatar image that may be used as the source person image
for a future Virtual Try-On request.

#### Planned Fields

| Field | Required | Purpose |
| --- | --- | --- |
| `id` | Yes | Primary identifier. |
| `userId` | Yes | Owning user. |
| `storageKey` | Yes | Private object-storage key for the source image. |
| `mediaType` | Yes | Approved image MIME type. |
| `width` | No | Validated image width when available. |
| `height` | No | Validated image height when available. |
| `fileSize` | No | Validated file size. |
| `status` | Yes | Ready, failed, or deletion-pending lifecycle state. |
| `createdAt` | Yes | Creation timestamp. |
| `updatedAt` | Yes | Last update timestamp. |
| `deletedAt` | No | Deletion request or completion timestamp. |

#### Relationships

- Many `UserAvatar` records belong to one `User`.
- One `UserAvatar` may be referenced by many future `TryOnJob` records.

#### Planned Indexes

- Index on `userId` and `status`.
- Unique index on `storageKey`.
- Index on `deletedAt` for deletion processing.

#### Phase 3 Notes

- This model is optional if the first production try-on flow uses a temporary upload-only
  source image instead of saved avatars.
- Storage keys must never be exposed directly to clients.
- Source avatar deletion must block new jobs and trigger object-storage cleanup.

### 23.6 Phase 3 Model: TryOnConsent

#### Purpose

Records versioned, purpose-specific user consent for try-on data processing.

#### Planned Fields

| Field | Required | Purpose |
| --- | --- | --- |
| `id` | Yes | Primary identifier. |
| `userId` | Yes | User granting consent. |
| `policyVersion` | Yes | Version of the accepted disclosure and policy. |
| `purpose` | Yes | Approved processing purpose, such as virtual try-on generation. |
| `grantedAt` | Yes | Consent timestamp. |
| `withdrawnAt` | No | Consent withdrawal timestamp. |
| `createdAt` | Yes | Creation timestamp. |

#### Relationships

- Many `TryOnConsent` records belong to one `User`.
- One `TryOnJob` should record which consent record authorized processing.

#### Planned Indexes

- Index on `userId` and `grantedAt`.
- Composite index on `userId`, `purpose`, and `withdrawnAt`.

#### Phase 3 Notes

- Consent history should be append-oriented rather than overwritten.
- A job must verify current consent at creation and again before dispatching data to an AI
  processor.
- Consent withdrawal must block new jobs immediately and trigger any required deletion
  workflow for retained source/result media.

### 23.7 Phase 3 Model: TryOnJob

#### Purpose

Represents one asynchronous AI try-on processing request.

#### Planned Fields

| Field | Required | Purpose |
| --- | --- | --- |
| `id` | Yes | Primary identifier. |
| `userId` | Yes | Owning user for direct authorization. |
| `consentId` | Yes | Consent record used to authorize processing. |
| `avatarId` | No | Optional saved `UserAvatar` source person image. |
| `personImageStorageKey` | No | Temporary source person image key when no saved avatar is used. |
| `productId` | No | Catalog product garment input when catalog source is used. |
| `wardrobeItemId` | No | User-owned wardrobe item garment input when wardrobe source is used. |
| `outfitId` | No | Optional outfit context. |
| `status` | Yes | `queued`, `validating`, `processing`, `succeeded`, `failed`, `cancelled`, or `expired`. |
| `provider` | No | Approved processor identifier. |
| `providerVersion` | No | Provider implementation version. |
| `modelVersion` | No | Model/checkpoint version used for generation. |
| `idempotencyKey` | No | User-scoped client key used to prevent duplicate jobs. |
| `attemptCount` | Yes | Number of worker attempts. |
| `maxAttempts` | Yes | Retry limit. |
| `failureCode` | No | Stable user-safe failure category. |
| `failureMessage` | No | User-safe failure description. |
| `processingStartedAt` | No | Processing start timestamp. |
| `completedAt` | No | Terminal timestamp. |
| `cancelledAt` | No | Cancellation timestamp. |
| `expiresAt` | No | Job/result retention deadline. |
| `createdAt` | Yes | Creation timestamp. |
| `updatedAt` | Yes | Last update timestamp. |

#### Relationships

- Many `TryOnJob` records belong to one `User`.
- Many `TryOnJob` records reference one `TryOnConsent`.
- Many `TryOnJob` records may reference one `UserAvatar`.
- A `TryOnJob` may reference one owned `Outfit`.
- A `TryOnJob` references either one catalog `Product` or one owned `WardrobeItem` as the
  garment source.
- One successful `TryOnJob` has one `TryOnResult`.

#### Planned Indexes

- Index on `userId`, `status`, and `createdAt`.
- Index on `userId` and `createdAt`.
- Index on `consentId`.
- Index on `avatarId`.
- Index on `productId`.
- Index on `wardrobeItemId`.
- Index on `outfitId`.
- Index on `expiresAt`.
- Unique composite index on `userId` and `idempotencyKey` where `idempotencyKey` is not
  null.

#### Phase 3 Notes

- Exactly one garment source should be present: `productId` or `wardrobeItemId`.
- Exactly one person source should be present: `avatarId` or `personImageStorageKey`.
- Database-level integrity rules should complement Zod validation for conditional fields.
- Jobs should snapshot the minimum display and processing metadata needed to explain a
  result if source catalog or wardrobe records later change.
- Failure details returned to users must not expose provider internals or sensitive media
  references.
- Worker retries should update `attemptCount` and preserve the original idempotency key.

### 23.8 Phase 3 Model: TryOnResult

#### Purpose

Stores metadata for the generated try-on result image.

#### Planned Fields

| Field | Required | Purpose |
| --- | --- | --- |
| `id` | Yes | Primary identifier. |
| `jobId` | Yes | Generating try-on job. |
| `userId` | Yes | Owning user for direct authorization. |
| `storageKey` | Yes | Private object-storage key for generated result. |
| `mediaType` | Yes | Approved generated image MIME type. |
| `width` | No | Output image width. |
| `height` | No | Output image height. |
| `fileSize` | No | Generated file size. |
| `provider` | Yes | Provider identifier used. |
| `modelVersion` | No | Model/checkpoint version used. |
| `status` | Yes | Ready, failed, deletion-pending, or deleted. |
| `expiresAt` | No | Result retention deadline. |
| `createdAt` | Yes | Creation timestamp. |
| `deletedAt` | No | Deletion timestamp. |

#### Relationships

- One `TryOnResult` belongs to one `TryOnJob`.
- One `TryOnResult` belongs to one `User`.

#### Planned Indexes

- Unique index on `jobId`.
- Unique index on `storageKey`.
- Index on `userId` and `createdAt`.
- Index on `expiresAt` and `deletedAt` for retention cleanup.

#### Phase 3 Notes

- API responses should expose short-lived read URLs, not durable storage keys.
- Storage keys, signed URLs, and raw media must not be copied into analytics metadata.
- Result deletion should be idempotent and should not require deleting the historical job
  record.

### 23.9 Post-MVP Ownership, Retention, And Deletion Rules

- Every wardrobe item must belong to the authenticated user.
- An outfit can reference a wardrobe item only when both share the same owner.
- Every try-on profile, consent, asset, job, and wardrobe input must resolve to one owning
  user.
- Wardrobe deletion must define behavior for outfit references before Phase 2 implementation.
- Try-on avatar, consent withdrawal, account deletion, and result deletion must feed an
  idempotent deletion workflow for jobs, source assets, results, and processor-side copies.
- Database deletion must not be marked complete until required object-storage deletion has
  succeeded or entered a monitored retry state.
- Account deletion must include Digital Wardrobe and Virtual Try-On data when those phases
  are implemented.
