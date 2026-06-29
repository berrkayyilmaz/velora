# Velora Architecture Document

Version: 1.1<br>
Status: Draft<br>
Date: 2026-06-29<br>
Source: `docs/PRD.md` v1.1 and `AGENTS.md`

## 1. Purpose

This document defines the MVP architecture for Velora. It translates the PRD into a technical structure that supports product discovery, product catalog browsing, product details, wishlist/favorites, outfit creation, saved outfits, retailer redirects, analytics, and internal admin operations.

This document does not define implementation code. It describes system boundaries, responsibilities, data ownership, and folder organization for the MVP.

Sections 13 and later describe post-MVP architecture direction only. They are not approval
to add Digital Wardrobe or AI services to the current runtime.

## 2. MVP Architecture Principles

- Keep the MVP simple and maintainable.
- Use the approved stack from `AGENTS.md`.
- Keep frontend UI, API access, business logic, and database access separated.
- Prefer type safety across frontend and backend.
- Keep route handlers thin.
- Place business logic in services.
- Place database logic in repositories.
- Track key analytics events from the first MVP release.
- Avoid non-MVP infrastructure such as Kubernetes, Elasticsearch, Qdrant, Redis, payment systems, checkout systems, AI try-on, and AR features.

## 3. System Architecture

Velora MVP uses a mobile-first client, a single backend API, PostgreSQL persistence, and a lightweight internal admin panel.

### 3.1 Main Components

1. Mobile App
   - Built with React Native, Expo, and TypeScript.
   - Runs on iOS and Android.
   - Handles product discovery, product details, wishlist, outfit builder, saved outfits, profile, and retailer redirect actions.

2. Internal Admin Panel
   - Web-based internal tool for Velora administrators only.
   - Handles product management, product import, catalog metadata, and basic analytics review.
   - No public registration, partner accounts, brand dashboards, or role hierarchy in MVP.

3. Backend API
   - Built with Node.js, Fastify, and TypeScript.
   - Exposes API endpoints for mobile app and admin panel.
   - Owns authentication, authorization, validation, business rules, analytics tracking, and data access.

4. PostgreSQL Database
   - Primary persistent storage for users, products, wishlists, outfits, redirect events, and analytics events.
   - Accessed through Prisma ORM.

5. External Retailers
   - Product purchase intent is handled through external `productUrl` redirects.
   - Velora records redirect events before opening retailer URLs.
   - Velora does not handle checkout, payments, orders, or order tracking in MVP.

### 3.2 System Flow

1. A user opens the mobile app and authenticates.
2. The mobile app requests products, filters, wishlist, outfits, and profile data from the backend API.
3. The backend validates requests with Zod, applies business logic in services, and accesses PostgreSQL through repositories and Prisma.
4. The mobile app sends analytics events to the backend for product views, searches, filters, wishlist actions, outfit actions, and retailer redirects.
5. When a user taps "View at Retailer", the app records a redirect event through the backend and then opens the external retailer URL.
6. Internal admins use the admin panel to manage products, brands, categories, source platforms, imports, and basic analytics.

## 4. Frontend Architecture

The user-facing frontend is a React Native Expo application written in TypeScript.

### 4.1 Frontend Responsibilities

- Render the mobile user experience for iOS and Android.
- Provide navigation between authentication, catalog, product detail, wishlist, outfit builder, saved outfits, and profile screens.
- Store short-lived UI state and session-related state.
- Use a dedicated service layer for backend API calls.
- Never call backend endpoints directly inside UI components.
- Handle loading states, empty states, and user-facing errors.
- Trigger analytics events without blocking user actions.
- Open external retailer URLs after redirect tracking succeeds or gracefully handles failure.

### 4.2 Frontend Layers

1. Screens
   - Route-level views connected to navigation.
   - Responsible for screen composition and high-level user interactions.

2. Components
   - Reusable UI elements such as product cards, filter controls, wishlist buttons, outfit product lists, and empty states.

3. Navigation
   - React Navigation setup for auth flow, main tabs/stacks, product detail, wishlist, outfit builder, saved outfits, and profile.

4. Services
   - Typed API clients for authentication, products, wishlist, outfits, profile, redirects, and analytics.
   - The only frontend layer that should know backend endpoint paths.

5. Store
   - Zustand stores for session state and local UI workflows such as outfit builder draft state.
   - Server-owned data should still be loaded and persisted through services.

6. Types
   - Shared frontend TypeScript types for products, outfits, wishlist items, users, filters, and analytics payloads.

7. Utils
   - Small helper functions for formatting prices, building filter labels, validating local form input, and opening external URLs.

### 4.3 Mobile App Feature Areas

- Authentication
  - Sign up, log in, log out, and password reset request flow.

- Product Discovery
  - Catalog browsing, search, filtering by brand, category, price range, source platform, and color.

- Product Detail
  - Product image, title, brand, category, price, color, source platform, optional description, optional available colors, optional tags, favorite action, add-to-outfit action, and retailer redirect action.

- Wishlist
  - Single default wishlist per user.
  - Favorite/unfavorite products.
  - View saved products.
  - Sort by newest saved or oldest saved.
  - Add wishlist products to an outfit.

- Outfit Builder
  - Add products from catalog or wishlist.
  - Require outfit name before saving.
  - Add or remove products at any time.
  - Display included categories and optional missing-category guidance.
  - No enforced fashion rules in MVP.

- Saved Outfits
  - View, edit, and delete saved outfits.

- Profile
  - View and edit basic profile information.

## 5. Backend Architecture

The backend is a Fastify API written in TypeScript with Prisma ORM, PostgreSQL, and Zod validation.

### 5.1 Backend Responsibilities

- Authenticate users and internal admins.
- Enforce user-level data ownership for profiles, wishlists, and outfits.
- Validate all request payloads and query parameters.
- Serve product catalog, filters, and product detail data.
- Manage wishlist and outfit workflows.
- Record analytics and retailer redirect events.
- Support internal admin product, catalog, import, and analytics operations.
- Keep core functionality resilient if analytics tracking fails.

### 5.2 Backend Layers

1. Routes
   - Fastify route definitions.
   - Responsible for request/response wiring only.
   - Should stay thin and delegate logic to services.

2. Schemas
   - Zod schemas for request validation, response shapes, and shared input constraints.

3. Services
   - Business logic for auth, products, wishlist, outfits, redirects, analytics, profile, and admin operations.
   - Responsible for orchestration across repositories.

4. Repositories
   - Database access layer.
   - Encapsulates Prisma queries.
   - Keeps route handlers and services independent from raw database query details.

5. Plugins
   - Fastify plugins for Prisma, authentication, request context, error handling, and other reusable server capabilities.

6. Config
   - Environment variable loading and validation.
   - API configuration, database connection configuration, auth settings, and runtime flags.

7. Types
   - Backend TypeScript types and shared domain contracts.

### 5.3 API Domains

- Authentication API
  - User signup, login, logout, password reset request, and password reset completion.

- Profile API
  - Read and update basic authenticated user profile data.

- Product API
  - List products.
  - Search products.
  - Filter products.
  - Get product details.

- Wishlist API
  - Get current user's wishlist.
  - Favorite product.
  - Unfavorite product.
  - Sort wishlist by supported order options.

- Outfit API
  - Create outfit.
  - Get saved outfits.
  - Get outfit detail.
  - Edit outfit.
  - Delete outfit.
  - Add product to outfit.
  - Remove product from outfit.

- Redirect API
  - Record retailer redirect events before the client opens external URLs.

- Analytics API
  - Record approved MVP analytics events.
  - Serve basic internal analytics for admin panel.

- Admin API
  - Internal admin authentication.
  - Product CRUD.
  - Product search and filtering.
  - Product import from CSV or JSON.
  - Manage categories, brands, and source platforms.
  - View basic analytics and redirect counts.

## 6. Database Architecture

PostgreSQL is the single source of truth for MVP data. Prisma ORM manages database access and migrations.

### 6.1 Core Domain Entities

#### User

Represents a customer account.

Key data:
- `id`
- `email`
- `passwordHash`
- Basic editable profile fields
- `createdAt`
- `updatedAt`

#### Product

Represents a fashion product available in the catalog.

Key data:
- `id`
- `title`
- `brandId`
- `categoryId`
- `price`
- `imageUrl`
- `productUrl`
- `sourcePlatformId`
- `color`
- Optional `description`
- Optional available colors
- Optional product tags
- `createdAt`
- `updatedAt`

#### Brand

Represents a product brand managed through the admin panel.

Key data:
- `id`
- `name`
- `createdAt`
- `updatedAt`

#### Category

Represents MVP categories such as tops, bottoms, dresses, outerwear, shoes, bags, and accessories.

Key data:
- `id`
- `name`
- `createdAt`
- `updatedAt`

#### Source Platform

Represents the retailer or platform where the product comes from.

Key data:
- `id`
- `name`
- `createdAt`
- `updatedAt`

#### Wishlist

Represents the user's default wishlist.

Key data:
- `id`
- `userId`
- `createdAt`
- `updatedAt`

The MVP supports one default wishlist per user. The model should not require a major redesign if collection-based wishlist organization is added later.

#### Wishlist Item

Represents a saved product in a user's wishlist.

Key data:
- `id`
- `wishlistId`
- `productId`
- `createdAt`

#### Outfit

Represents a saved outfit created by a user.

Key data:
- `id`
- `userId`
- `name`
- `createdAt`
- `updatedAt`

#### Outfit Product

Represents a product included in an outfit.

Key data:
- `id`
- `outfitId`
- `productId`
- `createdAt`

#### Redirect Event

Represents a retailer redirect click.

Key data:
- `id`
- `userId`, nullable when unauthenticated tracking is allowed
- `productId`
- `outfitId`, nullable
- `sourceScreen`
- `sourcePlatformId`
- `createdAt`

#### Analytics Event

Represents approved MVP analytics events.

Key data:
- `id`
- `userId`, nullable when unauthenticated tracking is allowed
- `eventType`
- Related entity identifiers such as `productId` or `outfitId`
- `sourceScreen`, nullable
- Event metadata for simple contextual fields
- `createdAt`

#### Password Reset Token

Represents account recovery state.

Key data:
- `id`
- `userId`
- Token hash
- Expiration timestamp
- Used timestamp
- `createdAt`

#### Admin User

Represents an internal Velora administrator.

Key data:
- `id`
- `email`
- `passwordHash`
- `createdAt`
- `updatedAt`

The MVP should keep admin access minimal. It should not include partner accounts, brand accounts, role-based permissions, or multi-admin role hierarchy.

### 6.2 Data Ownership Rules

- Users can only access their own profile, wishlist, and outfits.
- Wishlist items are scoped through the authenticated user's wishlist.
- Outfits are scoped by `userId`.
- Admin product and analytics access is restricted to authorized internal administrators.
- Product catalog data is readable by authenticated users and manageable only by admins.

### 6.3 MVP Database Guidance

- Use relational tables for users, products, brands, categories, source platforms, wishlists, outfits, redirect events, and analytics events.
- Keep product search and filtering database-backed with standard PostgreSQL queries.
- Do not introduce Elasticsearch or other search infrastructure in MVP.
- Store analytics events in PostgreSQL for MVP simplicity.
- Optimize only after real usage data shows a need.

## 7. Admin Panel Architecture

The admin panel is an internal web-based tool for Velora operations during MVP validation.

### 7.1 Admin Panel Responsibilities

- Authenticate internal administrators.
- View, create, edit, delete, search, and filter products.
- Import products from structured CSV or JSON files.
- Manage product categories.
- Manage brands.
- Manage source platforms.
- View user registration counts.
- View product view counts.
- View wishlist activity.
- View outfit creation activity.
- View retailer redirect counts.
- View basic event analytics.

### 7.2 Admin Panel Boundaries

The admin panel must not include:

- Public registration
- Partner accounts
- Brand dashboards
- Role-based permissions
- Multi-admin roles
- Affiliate management tools
- Revenue reporting
- Content management system
- Customer-facing web experience

### 7.3 Admin Panel Integration

- The admin panel should use backend admin APIs.
- Admin UI should not access the database directly.
- Admin authentication should be separate from public customer registration behavior.
- Product imports should pass through backend validation before data is stored.
- Analytics dashboards should read aggregated data from backend analytics endpoints.

## 8. Analytics Architecture

Analytics is an MVP product requirement because it validates whether the product creates user value.

### 8.1 Analytics Principles

- Track approved MVP events from the first release.
- Analytics failure must not break authentication, browsing, wishlist, outfit, or redirect flows.
- Event payloads should stay small and consistent.
- Events should include `userId` when available, timestamp, event type, related entity ID, and source screen when applicable.
- Use PostgreSQL-backed analytics storage for MVP simplicity.

### 8.2 Tracked MVP Events

Authentication events:
- User Registered
- User Logged In
- User Logged Out
- Password Reset Requested

Discovery events:
- Product Viewed
- Product Searched
- Product Filter Applied

Wishlist events:
- Product Favorited
- Product Unfavorited

Outfit events:
- Outfit Created
- Outfit Saved
- Outfit Edited
- Outfit Deleted
- Product Added To Outfit
- Product Removed From Outfit

Retail events:
- Retailer Redirect Clicked

### 8.3 Analytics Data Flow

1. Mobile app or admin panel performs a user action.
2. The client sends the corresponding event to the backend or the backend emits the event while processing the action.
3. The analytics service validates the event type and payload.
4. The analytics repository stores the event in PostgreSQL.
5. Admin analytics endpoints query event data for basic counts and activity summaries.

### 8.4 Redirect Tracking Flow

1. User taps "View at Retailer" from catalog, product detail, wishlist, or outfit.
2. The mobile app sends a redirect tracking request to the backend with product, optional outfit, source screen, and retailer/platform context.
3. The backend records a redirect event and analytics event.
4. The mobile app opens the product's external `productUrl` in the user's browser.
5. Velora does not process checkout, payment, order tracking, or conversion attribution beyond redirects in MVP.

## 9. Folder Structure

The repository should remain a simple monorepo.

### 9.1 Root Structure

```text
velora/
+-- frontend/
+-- backend/
+-- admin/
+-- docs/
+-- AGENTS.md
+-- README.md
+-- package.json
+-- .gitignore
```

### 9.2 Frontend Structure

```text
frontend/
+-- src/
    +-- screens/
    +-- components/
    +-- navigation/
    +-- services/
    +-- store/
    +-- types/
    +-- utils/
```

Recommended screen grouping:

```text
frontend/src/screens/
+-- auth/
+-- products/
+-- wishlist/
+-- outfits/
+-- profile/
```

Recommended service grouping:

```text
frontend/src/services/
+-- authService.ts
+-- productService.ts
+-- wishlistService.ts
+-- outfitService.ts
+-- profileService.ts
+-- redirectService.ts
+-- analyticsService.ts
```

### 9.3 Backend Structure

```text
backend/
+-- prisma/
+-- src/
    +-- routes/
    +-- services/
    +-- repositories/
    +-- schemas/
    +-- config/
    +-- plugins/
    +-- types/
```

Recommended backend domain grouping:

```text
backend/src/
+-- routes/
|   +-- auth.routes.ts
|   +-- profile.routes.ts
|   +-- products.routes.ts
|   +-- wishlist.routes.ts
|   +-- outfits.routes.ts
|   +-- redirects.routes.ts
|   +-- analytics.routes.ts
|   +-- admin.routes.ts
+-- services/
|   +-- auth.service.ts
|   +-- profile.service.ts
|   +-- product.service.ts
|   +-- wishlist.service.ts
|   +-- outfit.service.ts
|   +-- redirect.service.ts
|   +-- analytics.service.ts
|   +-- admin.service.ts
+-- repositories/
|   +-- user.repository.ts
|   +-- product.repository.ts
|   +-- wishlist.repository.ts
|   +-- outfit.repository.ts
|   +-- analytics.repository.ts
|   +-- admin.repository.ts
+-- schemas/
+-- config/
+-- plugins/
+-- types/
```

### 9.4 Admin Structure

The admin panel is internal-only and should stay separate from the user-facing mobile app.

```text
admin/
+-- src/
    +-- pages/
    +-- components/
    +-- services/
    +-- types/
    +-- utils/
```

Recommended admin feature grouping:

```text
admin/src/pages/
+-- auth/
+-- products/
+-- imports/
+-- catalog/
+-- analytics/
```

### 9.5 Docs Structure

```text
docs/
+-- PRD.md
+-- ARCHITECTURE.md
```

## 10. API Boundary Guidelines

- Mobile app and admin panel must communicate with the backend through typed service layers.
- UI components should not contain raw endpoint paths.
- Backend routes should validate input and delegate logic to services.
- Services should coordinate business rules and repository calls.
- Repositories should encapsulate Prisma access.
- Analytics should be best-effort and must not block core user actions.
- Product redirects should be tracked before opening external retailer URLs.
- All user-owned data access must be scoped to the authenticated user.
- Admin APIs must require internal admin authentication.

## 11. Explicit MVP Exclusions

The architecture intentionally excludes:

- AI virtual try-on implementation
- AI stylist recommendations
- Python AI services
- FastAPI AI layer
- IDM-VTON integration
- MediaPipe integration
- Public web application
- Customer-facing web experience
- Checkout and payment systems
- Order tracking
- Social features
- User-generated content marketplace
- Advanced recommendation engine
- AR experiences
- Elasticsearch
- Qdrant
- Redis
- Kubernetes
- Brand dashboards
- Partner accounts
- Creator and influencer tools

## 12. Future Architecture Considerations

The following should only be revisited after MVP validation:

- AI styling and virtual try-on services
- Public web application
- Curated outfit inspiration tooling
- Advanced recommendations
- Partner and brand dashboards
- Affiliate attribution and revenue reporting
- Wishlist collections and sharing
- Social features
- More advanced search infrastructure
- Dedicated analytics warehouse or event pipeline

## 13. Post-MVP Architecture Roadmap

### 13.1 Scope Guardrail

The current mobile app, Fastify API, PostgreSQL database, and admin panel remain the MVP
architecture. Phase 2 extends those boundaries for Digital Wardrobe. Phase 3 introduces an
AI processing boundary only after Phase 2 validation and separate privacy approval.

Future architecture should preserve these principles:

- Existing MVP catalog, wishlist, outfit, redirect, and analytics behavior remains valid.
- User-owned wardrobe data is never treated as public catalog data.
- Sensitive try-on data is separated from normal account and product data.
- The backend remains the authority for ownership, consent, and access decisions.
- AI providers or services never receive broader database access.

### 13.2 Phase 2: Digital Wardrobe Architecture

#### Mobile App

Add a wardrobe feature area with:

- Wardrobe list and item detail screens
- Add and edit wardrobe item flows
- Private image upload state and progress
- A source selector in the outfit builder for catalog and wardrobe items
- Mixed outfit rendering using a discriminated item shape

Wardrobe API calls should use a dedicated frontend service and query hooks. Uploaded media
must not be persisted in general application state longer than needed for the upload.

#### Backend API

Add a wardrobe domain with thin routes, Zod schemas, a wardrobe service, and repositories.
The service should enforce ownership, archive/delete rules, media lifecycle rules, and
outfit-reference behavior.

The existing outfit domain should evolve without breaking the MVP catalog-product contract.
The preferred planning approach is:

- Keep the existing `OutfitProduct` relationship for catalog products.
- Add a separate `OutfitWardrobeItem` relationship for user-owned wardrobe products.
- Present both through a discriminated API item shape such as `catalog_product` or
  `wardrobe_item`.
- Merge and order both relationship sets in the outfit service.

This approach avoids a high-risk migration of existing outfit-product records. A generic
single-table polymorphic relationship should be reconsidered only if Phase 2 requirements
show that cross-source ordering or additional item types justify the added integrity
complexity.

#### Database

PostgreSQL remains the source of truth for wardrobe metadata and ownership. Planned Phase 2
models are:

- `WardrobeItem`
- `WardrobeItemMedia`
- `OutfitWardrobeItem`

Detailed conceptual fields and relationships are defined in `docs/DATABASE.md`.

#### Private Object Storage

User-owned images should be stored in managed private object storage, not as database binary
data and not at permanent public URLs. The backend should issue short-lived upload or read
authorization after checking user ownership.

A planned upload flow is:

1. Authenticated client requests permission to upload media for an owned wardrobe item.
2. Backend validates ownership, file type, size, and intended media purpose.
3. Client uploads directly to private object storage using short-lived credentials.
4. Backend confirms the upload and creates the media record.
5. Background or provider-specific image optimization may occur without blocking item
   metadata edits.

The exact storage provider is intentionally undecided.

#### User Profile Foundation

Do not expand the base `User` table with body-image or measurement fields. Phase 2 may
prepare an optional one-to-one relationship from `User` to a future `TryOnProfile`, but the
profile and sensitive data should not be created until the user enters the Phase 3 consent
flow.

### 13.3 Phase 3: Virtual Try-On Architecture

Virtual try-on should be added as an isolated asynchronous capability, not embedded in
product or outfit route handlers.

Planned components:

1. Mobile Try-On Experience
   - Consent and limitations
   - Private input upload
   - Supported item selection
   - Job status, result review, retry, and deletion

2. Fastify Try-On Orchestration
   - Authenticates the user and validates ownership
   - Checks consent and category support
   - Creates jobs and exposes status
   - Issues short-lived media access
   - Applies retention and deletion policies

3. AI Processing Boundary
   - May begin with an approved external provider or a separate Python/FastAPI service
   - Receives only the media and metadata required for one job
   - Has no direct access to user tables or general application credentials
   - Returns status and output references through authenticated service-to-service calls

4. Private Media Storage
   - Stores source body media and generated results separately from catalog and wardrobe
     media
   - Uses explicit media purpose and retention metadata
   - Supports deletion across source assets, results, and failed jobs

5. Durable Job Execution
   - Try-on requests should be asynchronous because latency and retries are model-dependent
   - The job mechanism must survive process restarts
   - Queue technology should be selected only when Phase 3 implementation is approved; this
     roadmap does not add Redis or other infrastructure to MVP

Planned processing flow:

1. User accepts the current try-on consent and submits supported inputs.
2. Fastify validates ownership, consent, media readiness, and selected item support.
3. Fastify creates a `TryOnJob` and dispatches only required inputs to the AI boundary.
4. The AI boundary processes the request and stores a private result.
5. Fastify exposes job status and a short-lived result URL to the owning user.
6. Retention or user deletion removes inputs, outputs, and processor-side copies.

### 13.4 Technical Risks

Phase 2 risks:

- Direct uploads can leave orphaned objects when confirmation fails.
- User-entered categories and colors can become inconsistent with catalog taxonomy.
- Mixed item serialization can cause frontend and analytics ambiguity if item type is not
  explicit.
- Archived or deleted wardrobe items may break historical outfit previews without a clear
  snapshot or retention rule.
- Storage cost can grow faster than relational data cost.

Phase 3 risks:

- Input validation cannot fully predict model quality.
- Model capabilities may not support all categories, layering, or mixed-source outfits.
- Long processing times require durable jobs, cancellation, retries, and idempotency.
- Provider behavior can create data residency, deletion, cost, and availability risks.
- Generated outputs may be biased, misleading, or visually inconsistent.
- Self-hosted models add GPU capacity, model lifecycle, security, and operational burden.

### 13.5 Privacy And Security Boundaries

- Wardrobe, try-on profile, media, and jobs must always be scoped by authenticated `userId`.
- Private media should use storage keys internally and short-lived signed access externally.
- Logs, analytics events, and error reports must not contain raw images, signed URLs,
  measurements, or provider credentials.
- Image metadata not required by the product should be removed before durable storage.
- Consent records should be versioned and retained as evidence independently from generated
  results.
- Account deletion and consent withdrawal require idempotent deletion orchestration across
  PostgreSQL, object storage, and any AI processor.
- Administrative access to private user media is not implied by the existing admin role and
  requires separate policy and audit design before implementation.
