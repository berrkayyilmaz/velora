# Velora Phase 2 Digital Wardrobe MVP Specification

Version: 1.0<br>
Status: Draft<br>
Date: 2026-06-29<br>
Source: `docs/PRD.md` v1.1, `docs/ARCHITECTURE.md` v1.1,
`docs/DATABASE.md` v1.1, and `docs/API_SPEC.md` v1.1

## 1. Purpose

This document defines the minimum viable scope for Velora Phase 2 Digital Wardrobe.

It does not change the current product MVP. The existing catalog, wishlist, outfit,
retailer redirect, analytics, and admin behavior remain unchanged until Phase 2 is
separately approved and implemented.

This document is a product and contract proposal. It does not contain implementation code,
Prisma schema code, migrations, route handlers, or UI implementation.

## 2. Product Goal

Allow users to privately organize fashion products they already own and combine those
products with Velora catalog products in saved outfits.

The Phase 2 MVP should validate:

- Whether users will create and maintain a digital record of owned products
- Whether wardrobe products make the outfit builder more useful
- Whether users create outfits that combine owned and purchasable products
- Whether mixed outfits increase repeat outfit editing and reuse

Digital Wardrobe is an organization and outfit-planning feature. It is not a marketplace,
resale tool, social wardrobe, or Virtual Try-On feature.

## 3. User Problems

1. Users cannot currently include products they already own in Velora outfits.
2. Outfit planning is incomplete when it contains only products available in the catalog.
3. Users may forget which owned products work with products they are considering buying.
4. Photos and notes about owned fashion products are scattered across camera rolls, saved
   posts, and shopping apps.
5. Users need one private place to review owned products and reuse them across outfits.

## 4. Target Users

Phase 2 serves authenticated Velora users who:

- Already use catalog discovery, wishlist, or saved outfits
- Want to plan purchases around products they own
- Reuse a core set of clothing, shoes, bags, or accessories
- Are willing to add a product image and minimal item details

The Phase 2 MVP retains the current initial focus on women's fashion categories.

## 5. Phase 2 MVP User Flows

### 5.1 Add A Wardrobe Item

1. User opens Digital Wardrobe.
2. User selects Add Item.
3. User chooses or captures a product image.
4. User enters a required title and selects a required category.
5. User optionally enters color, brand label, and notes.
6. The app uploads and validates the image.
7. The app confirms that the item is saved and displays it in the wardrobe.

### 5.2 Browse And View Wardrobe

1. User opens Digital Wardrobe.
2. The app loads active wardrobe items.
3. User optionally searches by title or filters by category.
4. User opens an item to view its image and details.

### 5.3 Edit, Archive, Or Restore An Item

1. User opens an owned wardrobe item.
2. User edits metadata or replaces the primary image.
3. User saves changes.
4. User may archive the item without removing it from saved outfits.
5. User may view archived items and restore an item to active status.

### 5.4 Permanently Delete An Item

1. User opens a wardrobe item and selects Delete.
2. The app explains that deletion removes the item from saved outfits and deletes its media.
3. User confirms permanent deletion.
4. Velora removes outfit relationships and makes the item unavailable immediately.
5. Velora completes private object deletion asynchronously and safely retries failures.

### 5.5 Build A Mixed Outfit

1. User creates or edits an outfit.
2. User switches between Catalog and Wardrobe sources.
3. User adds catalog products, wardrobe items, or both.
4. The outfit builder visually distinguishes catalog products from owned wardrobe items.
5. User names and saves the outfit.
6. Saved outfit detail shows all included items with their source type.

### 5.6 Add From Product Detail

1. User opens a catalog product or wardrobe item detail screen.
2. User selects Add to Outfit.
3. User chooses an existing outfit or creates a new outfit.
4. Velora adds the selected item without changing other outfit items.

## 6. Included In Phase 2 MVP

- Private Digital Wardrobe for authenticated users
- Wardrobe list with pagination
- Search by wardrobe item title
- Filter by category
- Active and archived item views
- Create wardrobe item
- View wardrobe item detail
- Edit wardrobe item metadata
- Replace the primary image
- Archive and restore wardrobe item
- Permanently delete wardrobe item
- One required primary image per wardrobe item
- Existing Velora categories for wardrobe organization
- Optional color, free-text brand label, and private notes
- Add wardrobe item to new or existing outfit
- Remove wardrobe item from outfit
- Create and edit outfits containing catalog and wardrobe items
- Clear source labels for catalog products and owned items
- Wardrobe and mixed-outfit analytics events
- Private media storage and deletion handling

## 7. Excluded From Phase 2 MVP

- Virtual Try-On
- Body images, body measurements, or try-on profiles
- AI image generation, background removal, segmentation, or automatic tagging
- AI stylist recommendations or outfit scoring
- Multiple images per wardrobe item in the user experience
- Video uploads
- Automatic product recognition from images
- Automatic brand, category, or color detection
- Barcode, receipt, email, or retailer-account import
- Bulk wardrobe import
- Public wardrobes
- Wardrobe sharing or collaboration
- Social feeds, comments, likes, or follows
- Resale, lending, rental, or marketplace behavior
- Wardrobe valuation
- Laundry, wear-count, or maintenance tracking
- Calendar or trip planning
- In-app checkout or payment
- Admin access to browse private user wardrobes or media

## 8. WardrobeItem Data Model

### 8.1 WardrobeItem

`WardrobeItem` represents one product owned by one user.

| Field | Required | Phase 2 Purpose |
| --- | --- | --- |
| `id` | Yes | Stable unique identifier. |
| `userId` | Yes | Authenticated owner. |
| `title` | Yes | User-facing item name. |
| `categoryId` | Yes | Existing active Velora category. |
| `color` | No | User-provided primary color. |
| `brandLabel` | No | Free-text brand value; not a catalog `Brand` relation. |
| `notes` | No | Private user notes. |
| `status` | Yes | `draft`, `active`, `archived`, or `deletion_pending`. |
| `createdAt` | Yes | Creation timestamp. |
| `updatedAt` | Yes | Last update timestamp. |

Recommended validation:

- `title`: trimmed, 1-120 characters
- `categoryId`: must reference an active category
- `color`: trimmed, maximum 100 characters
- `brandLabel`: trimmed, maximum 120 characters
- `notes`: maximum 1,000 characters

`WardrobeItem` does not include:

- `price`
- `productUrl`
- `sourcePlatformId`
- Affiliate metadata
- Catalog visibility

### 8.2 WardrobeItemMedia

`WardrobeItemMedia` stores metadata for private media held in object storage.

| Field | Required | Phase 2 Purpose |
| --- | --- | --- |
| `id` | Yes | Media identifier. |
| `wardrobeItemId` | Yes | Owning wardrobe item. |
| `storageKey` | Yes | Internal private object key. |
| `mediaType` | Yes | Validated MIME type. |
| `purpose` | Yes | `primary`. |
| `status` | Yes | `uploading`, `ready`, `failed`, or `deletion_pending`. |
| `width` | No | Validated image width. |
| `height` | No | Validated image height. |
| `fileSize` | No | Validated object size. |
| `createdAt` | Yes | Creation timestamp. |
| `deletedAt` | No | Completed deletion timestamp. |

Phase 2 permits one ready primary image for each active wardrobe item. The data model may
support additional media later, but the Phase 2 user experience should not expose a gallery.

### 8.3 OutfitWardrobeItem

`OutfitWardrobeItem` joins an outfit to an owned wardrobe item.

| Field | Required | Phase 2 Purpose |
| --- | --- | --- |
| `id` | Yes | Join record identifier. |
| `outfitId` | Yes | Owned outfit. |
| `wardrobeItemId` | Yes | Owned wardrobe item. |
| `createdAt` | Yes | Added timestamp. |

Integrity rules:

- Outfit and wardrobe item must have the same `userId`.
- An outfit cannot contain the same wardrobe item twice.
- Existing `OutfitProduct` remains responsible for catalog products.
- Phase 2 does not introduce manual item ordering.

### 8.4 Planned Indexes

- `WardrobeItem(userId, status, updatedAt)`
- `WardrobeItem(userId, categoryId)`
- `WardrobeItemMedia(wardrobeItemId, status)`
- Unique `WardrobeItemMedia(storageKey)`
- Unique `OutfitWardrobeItem(outfitId, wardrobeItemId)`
- `OutfitWardrobeItem(outfitId)`
- `OutfitWardrobeItem(wardrobeItemId)`

## 9. Media And Image Handling Assumptions

### 9.1 Storage

- PostgreSQL stores metadata only.
- Image bytes are stored in private managed object storage.
- Storage objects must not use permanent public URLs.
- API responses may contain short-lived signed read URLs.
- Storage keys must never be returned to the mobile client.
- The exact storage provider remains an implementation decision.

### 9.2 Accepted Media

Initial proposed limits:

- JPEG, PNG, or WebP
- One primary image per wardrobe item
- Maximum source file size of 10 MB
- Minimum useful dimension target of 512 pixels on the shortest side
- Configurable maximum dimensions and post-upload optimization

These values should be verified against the selected storage and image-processing services
before implementation.

### 9.3 Upload Lifecycle

1. Create wardrobe item metadata in `draft` state.
2. Request upload authorization scoped to that item, user, MIME type, and file size.
3. Upload directly to private object storage.
4. Confirm upload with the backend.
5. Backend verifies object existence, type, size, and ownership scope.
6. Backend creates or activates the media record and changes the item to `active`.
7. Draft items and abandoned uploads expire through a cleanup process.

Upload authorization should be short-lived and valid for one object only.

### 9.4 Image Processing

Phase 2 may perform deterministic optimization such as orientation correction, metadata
removal, resizing, and thumbnail generation. It must not add AI tagging, segmentation,
background generation, or try-on processing.

### 9.5 Failure Handling

- Failed uploads leave the item in draft state and can be retried.
- Unconfirmed objects are removed by scheduled cleanup.
- Replacing an image keeps the current image available until the replacement is ready.
- Old media is deleted only after the replacement is confirmed.
- Object deletion failures enter a monitored retry state.

## 10. Mixed Outfit Builder Changes

### 10.1 Data Compatibility

The current catalog-only outfit contract must remain valid.

Phase 2 should:

- Keep `OutfitProduct` and existing product endpoints unchanged.
- Add `OutfitWardrobeItem` and wardrobe-specific add/remove endpoints.
- Add a discriminated `items` collection to Phase 2 outfit responses.
- Retain the current `products` collection for backward compatibility.
- Add `itemCount` for total catalog and wardrobe items.
- Retain `productCount` as the catalog-product count during the compatibility period.
- Add `wardrobeItemCount`.

### 10.2 Mixed Item Shape

```text
MixedOutfitItem
  type: catalog_product | wardrobe_item
  id: relationship identifier
  addedAt: timestamp
  catalogProduct: ProductSummary when type is catalog_product
  wardrobeItem: WardrobeItemSummary when type is wardrobe_item
```

Exactly one source payload is present.

### 10.3 Builder Behavior

- Users can switch between Catalog and Wardrobe item sources.
- Existing catalog selection and wishlist flows remain available.
- Archived wardrobe items cannot be newly added.
- An archived item already in an outfit remains visible with an Archived badge.
- Deleted wardrobe items are removed from outfits.
- Catalog retailer actions appear only for catalog products.
- Wardrobe products do not display price or retailer actions.
- Existing soft category guidance can use categories from both item sources.
- No category rules, outfit scoring, or style validation are introduced.

## 11. API Contract Proposal

All Phase 2 wardrobe endpoints require user authentication and use the existing API response
envelope.

### 11.1 Wardrobe Item Shape

```text
WardrobeItem
  id
  title
  category: { id, name, slug }
  color
  brandLabel
  notes
  status
  primaryImage: { id, url, width, height }
  createdAt
  updatedAt
```

`primaryImage.url` is short-lived. `storageKey` is never returned.

### 11.2 Wardrobe Endpoints

| Method | Path | Purpose | Request | Response |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/wardrobe/items` | List owned wardrobe items. | Query: `search`, `categoryId`, `status`, `sort`, `page`, `pageSize`. | Paginated `WardrobeItem` summaries. |
| POST | `/api/v1/wardrobe/items` | Create draft item metadata. | Body: `title`, `categoryId`, optional `color`, `brandLabel`, `notes`. | Draft `WardrobeItem`. |
| GET | `/api/v1/wardrobe/items/:wardrobeItemId` | Get owned item detail. | Path ID. | `WardrobeItem`. |
| PATCH | `/api/v1/wardrobe/items/:wardrobeItemId` | Edit metadata, archive, or restore. | Editable fields or supported `status`. | Updated `WardrobeItem`. |
| DELETE | `/api/v1/wardrobe/items/:wardrobeItemId` | Permanently delete item. | Path ID and explicit confirmation in client. | `success`, `removedOutfitCount`, `deletionStatus`. |

List defaults:

- `status=active`
- `sort=newest`
- Conservative page size consistent with existing list APIs

### 11.3 Media Endpoints

| Method | Path | Purpose | Request | Response |
| --- | --- | --- | --- | --- |
| POST | `/api/v1/wardrobe/items/:wardrobeItemId/media/upload-request` | Authorize primary image upload. | `mediaType`, `fileSize`. | Upload URL, expiration, and upload token/reference. |
| POST | `/api/v1/wardrobe/items/:wardrobeItemId/media/confirm` | Validate and activate uploaded image. | Upload token/reference. | Updated `WardrobeItem`. |
| DELETE | `/api/v1/wardrobe/items/:wardrobeItemId/media/:mediaId` | Delete or replace media. | Path IDs. | `success`, `deletionStatus`. |

The backend must validate that the item belongs to the user before issuing upload or read
authorization.

### 11.4 Outfit Extensions

| Method | Path | Purpose | Request | Response |
| --- | --- | --- | --- | --- |
| POST | `/api/v1/outfits/:outfitId/wardrobe-items` | Add owned item to outfit. | `wardrobeItemId`. | Phase 2 mixed outfit detail. |
| DELETE | `/api/v1/outfits/:outfitId/wardrobe-items/:wardrobeItemId` | Remove owned item. | Path IDs. | Phase 2 mixed outfit detail. |

The existing create-outfit request may add optional `wardrobeItemIds` while retaining the
meaning of `productIds`. A future generic `items` request should require separate API
versioning review and is not necessary for Phase 2 MVP.

### 11.5 Main Validation Rules

- User must own every wardrobe item being accessed.
- User must own the target outfit.
- Outfit and wardrobe item owner must match.
- Category must exist and be active when creating or editing an item.
- Only active wardrobe items may be newly added to outfits.
- Duplicate wardrobe items in one outfit are rejected or treated idempotently.
- Media type, size, upload scope, and object ownership must be verified.
- Draft items without ready media must not appear in normal wardrobe lists or outfit pickers.
- Storage keys and private upload credentials must not appear in normal API responses.

## 12. Mobile Screen Proposal

### 12.1 Navigation

Add Wardrobe as a fifth authenticated tab:

- Discover
- Wishlist
- Outfits
- Wardrobe
- Profile

### 12.2 Wardrobe List Screen

Responsibilities:

- Load active wardrobe items
- Search by title
- Filter by category
- Switch between active and archived views
- Display image, title, category, optional color, and archived state
- Show loading, empty, error, pagination, and retry states
- Start Add Item flow

### 12.3 Add/Edit Wardrobe Item Screen

Responsibilities:

- Select or capture primary image
- Enter title
- Select category
- Enter optional color, brand label, and notes
- Display upload progress and retry state
- Prevent completion until required metadata and primary image are ready
- Preserve current image while replacement upload is pending

### 12.4 Wardrobe Item Detail Screen

Responsibilities:

- Display primary image and item details
- Add item to outfit
- Edit metadata or replace image
- Archive or restore item
- Permanently delete item with clear consequences

### 12.5 Outfit Builder Changes

Responsibilities:

- Source control for Catalog and Wardrobe
- Preserve current catalog and wishlist product flows
- Show source badge on selected items
- Disable duplicate selections
- Display archived state for retained wardrobe items
- Hide retailer actions for wardrobe items

### 12.6 Saved Outfit Detail Changes

Responsibilities:

- Render discriminated catalog and wardrobe items
- Use `itemCount` for the total
- Show catalog retailer actions only where available
- Allow removal of either item type
- Keep category guidance source-agnostic

## 13. Analytics Events

Phase 2 analytics remains best-effort and must never block wardrobe, media, or outfit
operations.

Approved proposed events:

| Event | Trigger | Main Related Data |
| --- | --- | --- |
| `wardrobe_opened` | User opens wardrobe. | `userId`, `sourceScreen`. |
| `wardrobe_item_created` | Item becomes active after primary image confirmation. | `wardrobeItemId`, `categoryId`. |
| `wardrobe_item_viewed` | User opens item detail. | `wardrobeItemId`. |
| `wardrobe_item_updated` | Metadata or primary image changes successfully. | `wardrobeItemId`, changed-field names only. |
| `wardrobe_item_archived` | Item becomes archived. | `wardrobeItemId`. |
| `wardrobe_item_restored` | Archived item becomes active. | `wardrobeItemId`. |
| `wardrobe_item_deleted` | Permanent deletion is accepted. | `wardrobeItemId`, removed outfit relationship count. |
| `wardrobe_media_upload_failed` | Confirmed upload flow fails. | Failure category only; no URL or storage key. |
| `wardrobe_item_added_to_outfit` | Owned item is added. | `wardrobeItemId`, `outfitId`. |
| `wardrobe_item_removed_from_outfit` | Owned item is removed. | `wardrobeItemId`, `outfitId`. |
| `mixed_outfit_saved` | Saved outfit contains both source types. | `outfitId`, catalog item count, wardrobe item count. |

Phase 2 should add a nullable, indexed `wardrobeItemId` relation to `AnalyticsEvent` rather
than relying only on generic metadata for core wardrobe reporting.

Analytics metadata must not include:

- Image bytes
- Signed URLs
- Storage keys
- Notes
- Free-text brand labels
- Raw upload errors

## 14. Privacy And Deletion Rules

### 14.1 Privacy

- Wardrobe items and images are private by default.
- Only the owning user can access wardrobe metadata or request media URLs.
- Existing admin authentication does not grant access to private wardrobe images.
- Internal support access is excluded until a separate audited access policy is approved.
- Object access must use short-lived authorization.
- Image EXIF and location metadata should be removed before durable use.
- Logs and monitoring must redact upload credentials, signed URLs, and storage keys.
- User notes and brand labels must not be copied to analytics.
- Backups and replicas must follow documented retention and deletion behavior.

### 14.2 Archive

- Archiving is reversible.
- Archived items remain in existing outfits.
- Archived items cannot be newly added to outfits.
- Archived media remains private and available to the owner.

### 14.3 Permanent Deletion

- Deletion requires explicit confirmation.
- Item becomes inaccessible immediately.
- All `OutfitWardrobeItem` relationships are removed transactionally.
- Database media records enter deletion-pending state.
- Object deletion is asynchronous and idempotent.
- Failed object deletion is retried and monitored.
- Completion state must distinguish accepted deletion from completed storage deletion.
- Deleted item content must not remain in analytics metadata.

### 14.4 Account Deletion

When account deletion is implemented, it must include:

- Wardrobe items
- Outfit wardrobe relationships
- Wardrobe media metadata
- Private objects
- Pending upload objects

Virtual Try-On data is not part of Phase 2 and requires its own Phase 3 deletion policy.

## 15. Technical Risks

| Risk | Impact | Phase 2 Mitigation |
| --- | --- | --- |
| Low-quality or irrelevant images | Poor wardrobe and outfit experience | Clear image guidance, deterministic validation, replace-image flow |
| Orphaned uploads | Storage cost and privacy risk | Short-lived authorization, confirmation, expiration cleanup |
| Failed object deletion | Privacy and compliance risk | Deletion-pending state, idempotent retries, monitoring |
| Mixed outfit contract ambiguity | Frontend regressions and inaccurate counts | Discriminated `items`, additive fields, preserve current `products` |
| Cross-user reference error | Serious privacy breach | Service ownership checks plus transactional relationship creation |
| Inconsistent user-entered category or color | Weak filtering and guidance | Reuse normalized categories; keep color optional and user-editable |
| Archived/deleted items in outfits | Broken outfit previews | Preserve archived items; remove deleted relationships with warning |
| Large images and bandwidth | Slow uploads and higher cost | File limits, direct upload, thumbnails, deterministic optimization |
| Signed URL leakage | Unauthorized temporary access | Short expiration, redacted logs, no analytics storage |
| Mobile upload interruptions | Abandoned drafts and user frustration | Retryable uploads, draft cleanup, preserved metadata |
| Storage provider coupling | Migration cost | Store provider-neutral object keys and isolate storage service |
| Analytics over-collection | Privacy risk | Dedicated IDs and approved metadata allowlist |

## 16. Rollout Plan

### 16.1 Stage 0: Contract And Privacy Readiness

- Finalize required and optional wardrobe fields.
- Select private object storage and upload approach.
- Approve file limits, media validation, and metadata-removal behavior.
- Confirm archive and permanent deletion semantics.
- Finalize additive mixed-outfit response compatibility.
- Define retention, cleanup, monitoring, and support ownership.
- Complete a focused privacy and security review.

Exit criteria:

- API and data contracts are approved.
- Storage and deletion behavior can be tested end to end.
- No Phase 3 body or try-on data is included.

### 16.2 Stage 1: Internal Validation

- Enable Digital Wardrobe for internal Velora accounts only.
- Test create, upload, edit, archive, restore, delete, and mixed outfit flows.
- Test interrupted uploads, expired authorization, invalid files, and deletion retries.
- Verify that one user cannot access another user's metadata or media.
- Measure upload success, failure categories, and storage cleanup.

Exit criteria:

- Core flows work on iOS and Android.
- Ownership and signed-media tests pass.
- Deletion retries and orphan cleanup are observable.
- Existing catalog-only outfit flows remain functional.

### 16.3 Stage 2: Closed Beta

- Enable Phase 2 for a small invited cohort through a server-controlled feature flag.
- Provide initial empty-state guidance and lightweight feedback collection.
- Monitor wardrobe activation, item creation, upload reliability, mixed outfit usage, and
  support requests.
- Review whether required fields create excessive abandonment.

Exit criteria:

- Users create and return to wardrobe items.
- Mixed outfits are created without material regressions.
- Upload and deletion reliability meet agreed operational targets.
- No unresolved high-severity privacy or ownership issue exists.

### 16.4 Stage 3: Broader Phase 2 Release

- Expand access gradually.
- Keep rollback capability through the feature flag.
- Monitor storage growth, API latency, image delivery, and analytics quality.
- Revisit optional search and filter improvements only from observed usage.
- Do not begin Phase 3 solely because Phase 2 is technically available.

## 17. Phase 2 Validation Metrics

Targets should be set before closed beta using expected cohort size and storage cost.
Recommended measures are:

- Percentage of enabled users who create one active wardrobe item
- Average active wardrobe items per wardrobe user
- Primary-image upload success rate
- Draft abandonment rate
- Percentage of outfit creators who create a mixed outfit
- Percentage of saved outfits containing at least one wardrobe item
- Return rate to view or edit wardrobe items
- Archive, restore, and permanent deletion usage
- Median time to create the first wardrobe item
- Object cleanup and deletion completion rate
- Support incidents related to media, ownership, or deletion

## 18. Phase 3 Boundary

Virtual Try-On remains a separate future Phase 3.

Phase 2 must not collect:

- Body images
- Body measurements
- Biometric or derived body attributes
- Try-on consent
- AI-generated results
- AI provider identifiers or job data

Phase 2 may provide reusable private-media and ownership patterns, but Phase 3 requires its
own product specification, privacy impact assessment, consent model, data retention policy,
AI quality evaluation, and implementation approval.

## 19. Open Decisions Before Implementation

1. Which managed private object-storage provider will be used?
2. Are the proposed 10 MB and 512-pixel image limits appropriate for target devices?
3. Which deterministic image optimization service or library will be used?
4. How long should draft items and abandoned uploads be retained?
5. What operational target defines completed deletion?
6. Should item search remain title-only for Phase 2 MVP?
7. Should archived items appear in outfit pickers as disabled context or be hidden entirely?
8. Which feature-flag mechanism will control rollout without adding prohibited infrastructure?
