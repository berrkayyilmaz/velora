# Velora MVP Smoke Test Plan

- Version: 1.1
- Status: Draft
- Last updated: 2026-07-01

## 1. Purpose

This document defines a repeatable MVP smoke test checklist for Velora. It is intentionally lightweight and manual-first. The goal is to confirm the working MVP across the Fastify backend, Expo mobile app, and internal admin web app without introducing a heavy end-to-end test framework.

Smoke testing should be run before sharing an MVP build, after meaningful backend/frontend/admin changes, and after local database resets.

## 2. Scope

### Included

- Backend health, authentication, profile, catalog, wishlist, Digital Wardrobe, mixed outfits, redirects, analytics, and admin APIs
- Expo mobile authentication, catalog, wishlist, Digital Wardrobe, mixed outfits, retailer redirect, profile, logout, and password reset flows
- Admin login, dashboard analytics, product management, product import, catalog management, and logout flows
- Static validation commands for backend, frontend, and admin workspaces

### Excluded

- Automated E2E browser or device testing
- Production email delivery for password reset
- Payment, checkout, social, AI, AR, and virtual try-on flows
- Load, stress, accessibility, and security penetration testing

## 3. Prerequisites

- Node.js 20.11 or newer
- npm dependencies installed from the repository root with `npm install`
- Docker Desktop running
- Local PostgreSQL container available as `velora-postgres`
- Environment files present:
  - `backend/.env`
  - `frontend/.env`
  - `admin/.env`
- Backend database prepared with Prisma migrations and seed data

## 4. Validation Commands

Run all static validation from the repository root:

```powershell
npm.cmd run validate
```

Run individual validation groups when isolating failures:

```powershell
npm.cmd run validate:backend
npm.cmd run validate:frontend
npm.cmd run validate:admin
```

These scripts run:

- Backend: typecheck, lint, format check
- Frontend: typecheck, lint
- Admin: typecheck, lint, production build

## 5. Local Environment Setup

Start PostgreSQL:

```powershell
docker start velora-postgres
```

Prepare the backend database:

```powershell
cd backend
npm.cmd run prisma:generate
npm.cmd run prisma:migrate
npm.cmd run prisma:seed
cd ..
```

Start the apps in separate terminals:

```powershell
npm.cmd run dev:backend
npm.cmd run dev:frontend
npm.cmd run dev:admin
```

Default local URLs:

- Backend health: `http://localhost:4000/health`
- Backend API: `http://localhost:4000/api/v1`
- Admin web: `http://localhost:5173`
- Expo: use the URL printed by Expo CLI

## 6. Test Accounts

### 6.1 Mobile Test User

Create a fresh mobile test user through the app registration screen, or use the backend API:

```powershell
$body = @{
  email = "smoke-user@example.com"
  password = "Password123!"
  displayName = "Smoke User"
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "http://localhost:4000/api/v1/auth/register" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

If the email already exists, use a timestamped email such as `smoke-user-20260626@example.com`.

Create a second timestamped mobile user when testing wardrobe and outfit
ownership boundaries. The second user must receive `404` when requesting the
first user's wardrobe records or attempting to add them to an outfit.

### 6.2 Admin Test User

The seed script creates catalog data, but it does not create an admin user. Create a local admin from `backend/` with a one-off command:

```powershell
$env:SMOKE_ADMIN_EMAIL = "admin@example.com"
$env:SMOKE_ADMIN_PASSWORD = "AdminPassword123!"

node --input-type=module -e "import bcrypt from 'bcrypt'; import { PrismaClient } from '@prisma/client'; const prisma = new PrismaClient(); const email = process.env.SMOKE_ADMIN_EMAIL; const password = process.env.SMOKE_ADMIN_PASSWORD; if (!email || !password) throw new Error('Missing admin env vars'); const passwordHash = await bcrypt.hash(password, 12); await prisma.adminUser.upsert({ where: { email }, update: { passwordHash }, create: { email, passwordHash } }); await prisma.`$disconnect(); console.log('Admin user ready:', email);"
```

Use this account only for local smoke testing. Do not commit real production admin credentials.

## 7. Backend Manual Smoke Checklist

Use PowerShell, Postman, or another API client. Confirm each endpoint returns the expected status and response envelope.

### Health

- [ ] `GET /health` returns `status: ok` and database `connected`.
- [ ] `GET /api/v1/health` returns a healthy response.

### User Authentication

- [ ] `POST /api/v1/auth/register` creates a user and returns `data.user` plus `data.authToken`.
- [ ] `POST /api/v1/auth/login` accepts valid credentials and returns an auth token.
- [ ] Invalid login returns a generic authentication error.
- [ ] `POST /api/v1/auth/password-reset/request` returns `data.accepted: true`.
- [ ] In development, password reset request returns `data.resetToken` for an existing user.
- [ ] `POST /api/v1/auth/password-reset/confirm` accepts the reset token and new password.
- [ ] Login with the new password succeeds.

### User Profile

- [ ] `GET /api/v1/me` without a user token fails.
- [ ] `GET /api/v1/me` with a user token returns only the authenticated user profile.
- [ ] `PATCH /api/v1/me` updates `displayName`.

### Products

- [ ] `GET /api/v1/products` with a user token returns seeded active products.
- [ ] `GET /api/v1/products?search=jeans` returns filtered results.
- [ ] `GET /api/v1/products/filter-options` returns brands, categories, source platforms, colors, and price range.
- [ ] `GET /api/v1/products/:productId` returns product detail for an active product.

### Wishlist

- [ ] `GET /api/v1/wishlist` returns the authenticated user's wishlist.
- [ ] `POST /api/v1/wishlist/items` favorites an active product.
- [ ] Adding the same product twice does not create duplicate wishlist records.
- [ ] `DELETE /api/v1/wishlist/items/:productId` removes the product.

### Digital Wardrobe

- [ ] `GET /api/v1/wardrobe` returns only the authenticated user's items.
- [ ] `POST /api/v1/wardrobe` creates a draft item with a valid active `categoryId`.
- [ ] `GET /api/v1/wardrobe/:wardrobeItemId` returns the created item.
- [ ] A second user receives `404` for the first user's wardrobe item.
- [ ] Activating an item without media fails with `WARDROBE_MEDIA_REQUIRED`.
- [ ] `POST /api/v1/wardrobe/:wardrobeItemId/media` accepts one JPEG, PNG, or WebP `file` part and rejects unsupported or oversized uploads.
- [ ] Upload response contains media ID, item ID, type, purpose, status, nullable dimensions, file size, timestamp, and URL without exposing `storageKey`.
- [ ] Reloading item detail preserves `primaryMedia`.
- [ ] `PATCH /api/v1/wardrobe/:wardrobeItemId` activates the item after media is ready.
- [ ] Archiving is reversible; archived items cannot be newly added to outfits.
- [ ] Deleting the last media from an active item returns it to draft.
- [ ] Deleting media from an archived item leaves it archived.
- [ ] `DELETE /api/v1/wardrobe/:wardrobeItemId` removes the item, its outfit relationships, media metadata, and local media file.

### Outfits

- [ ] `GET /api/v1/outfits` returns the authenticated user's saved outfits.
- [ ] `POST /api/v1/outfits` creates an outfit with a required name.
- [ ] `GET /api/v1/outfits/:outfitId` returns outfit detail.
- [ ] `PATCH /api/v1/outfits/:outfitId` renames the outfit.
- [ ] `POST /api/v1/outfits/:outfitId/products` adds an active product.
- [ ] Adding the same product twice does not create duplicates.
- [ ] `DELETE /api/v1/outfits/:outfitId/products/:productId` removes the product.
- [ ] `POST /api/v1/outfits/:outfitId/wardrobe-items` adds an owned active wardrobe item with primary media.
- [ ] Adding the same wardrobe item twice returns the existing mixed outfit without creating a duplicate.
- [ ] Another user cannot add the wardrobe item to an outfit.
- [ ] Mixed outfit detail contains catalog and wardrobe discriminated items ordered by `addedAt`.
- [ ] `productCount`, `wardrobeItemCount`, and total `itemCount` are correct.
- [ ] Legacy `products` and `productsPreview` remain catalog-only.
- [ ] `DELETE /api/v1/outfits/:outfitId/wardrobe-items/:wardrobeItemId` removes the wardrobe item and updates counts.
- [ ] `DELETE /api/v1/outfits/:outfitId` deletes the outfit.

### Redirects And Analytics

- [ ] `POST /api/v1/redirects` records a redirect and returns `productUrl`.
- [ ] Redirect with an outfit owned by another user fails.
- [ ] `POST /api/v1/analytics/events` accepts an approved event type.
- [ ] Invalid analytics event type fails validation.

### Admin APIs

- [ ] `POST /api/v1/admin/auth/login` accepts the local admin credentials.
- [ ] `GET /api/v1/admin/me` fails without an admin token.
- [ ] `GET /api/v1/admin/me` succeeds with an admin token.
- [ ] User tokens fail on admin endpoints.
- [ ] `GET /api/v1/admin/analytics/summary` returns summary counts.
- [ ] `GET /api/v1/admin/products` returns product management records.
- [ ] Admin catalog list endpoints return brands, categories, and source platforms.

## 8. Frontend Mobile Smoke Checklist

Run through Expo web, Android emulator, iOS simulator, or a physical device. For Android emulator API calls, set `EXPO_PUBLIC_API_BASE_URL` to `http://10.0.2.2:4000/api/v1`.

### Authentication

- [ ] App opens to sign-in when unauthenticated.
- [ ] Register creates a user and redirects to the main product area.
- [ ] Log out clears the local session and returns to sign-in.
- [ ] Login restores access to the main product area.
- [ ] Forgot Password requests a reset token.
- [ ] Reset Password accepts token plus new password and returns to sign-in.
- [ ] Login succeeds with the new password.

### Product Discovery

- [ ] Product list loads seeded products.
- [ ] Product cards show image, title, brand, and price.
- [ ] Search filters the product list.
- [ ] Filter options load from the backend.
- [ ] Brand, category, source platform, color, and price filters can be applied.
- [ ] Empty, loading, and error states are visible when applicable.
- [ ] Product detail opens and shows product information.

### Wishlist

- [ ] Product detail can add a product to wishlist.
- [ ] Wishlist screen shows saved products.
- [ ] Wishlist item can be removed.
- [ ] Wishlist state updates after add/remove.

### Digital Wardrobe

- [ ] Wardrobe tab loads the authenticated user's items.
- [ ] Search, category, status, and sort controls update the list.
- [ ] Create flow saves a draft item and opens its detail screen.
- [ ] Detail shows metadata, status, dates, and the empty media state.
- [ ] Image picker uploads a supported image and the image remains after reload.
- [ ] Edit flow activates the item after media upload.
- [ ] Draft and archived items show a clear blocked Add to Outfit state.
- [ ] Active item with media can open the outfit selector.
- [ ] Deleting media updates an active item to draft in list and detail views.
- [ ] Deleting an item returns to the wardrobe list and removes it from cached outfits.

### Outfits

- [ ] Saved outfits screen loads.
- [ ] Create outfit flow creates a named outfit.
- [ ] Product detail can add a product to an outfit.
- [ ] Wardrobe detail can add an active item to an existing outfit.
- [ ] Saved outfit cards show mixed preview media and total `itemCount`.
- [ ] Outfit detail renders catalog products and wardrobe items distinctly.
- [ ] Catalog rows retain retailer and remove actions.
- [ ] Wardrobe rows show image, title, category, color, status, and remove action.
- [ ] Removing either source updates mixed counts without a stale cached row.
- [ ] Outfit can be deleted.

### Retailer Redirect

- [ ] Product detail "View at Retailer" records redirect and opens the external URL.
- [ ] Outfit detail product redirect records redirect with `outfitId`.
- [ ] Returning from an external URL does not break navigation.

### Profile

- [ ] Profile screen loads authenticated user data.
- [ ] `displayName` can be updated.
- [ ] Logout clears the session and query cache.

## 9. Admin Web Smoke Checklist

Use `http://localhost:5173` after creating the local admin user.

### Authentication And Navigation

- [ ] Admin login accepts local admin credentials.
- [ ] Invalid admin login shows an API error.
- [ ] Authenticated admin redirects to dashboard.
- [ ] Admin navigation links work: Dashboard, Products, Brands, Categories, Source Platforms, Analytics.
- [ ] Active navigation state updates per route.
- [ ] Logout clears admin session and query cache, then redirects to `/login`.

### Dashboard And Analytics

- [ ] Dashboard summary cards load users, products, wishlist items, outfits, analytics events, and redirects.
- [ ] Analytics events list loads with pagination.
- [ ] Redirects list loads with pagination.
- [ ] Empty/loading/error states render correctly.

### Product Management

- [ ] Products table loads with pagination.
- [ ] Create product works using existing brand, category, and source platform IDs.
- [ ] Edit product updates fields.
- [ ] Soft-delete product sets inactive status.
- [ ] Product import section shows available slugs.
- [ ] Product import succeeds for valid JSON rows.
- [ ] Product import reports failed rows for invalid slugs without creating those products.

### Catalog Management

- [ ] Brands list loads.
- [ ] Brand create and edit work.
- [ ] Brand deactivate fails clearly if active products depend on the brand.
- [ ] Categories list/create/edit/deactivate behave as expected.
- [ ] Source platforms list/create/edit/deactivate behave as expected.

## 10. Smoke Test Result Template

Use this template when recording a smoke test run:

```text
Date:
Tester:
Git branch/commit:
Backend URL:
Frontend target: Expo web / Android / iOS / physical device
Admin URL:
Database state: migrated / seeded / reset

Validation commands:
- backend:
- frontend:
- admin:

Manual smoke result:
- Backend: pass / fail
- Frontend: pass / fail
- Admin: pass / fail

Issues found:
1.
2.
3.

Release decision:
- continue / block
```

## 11. When To Add Automated E2E Tests

Do not add a heavy E2E framework for the MVP smoke plan yet. Consider Playwright, Detox, or API integration tests later when:

- Manual smoke testing becomes a release bottleneck
- The product has stable release candidates
- Critical flows regress repeatedly
- CI needs database-backed confidence beyond typecheck, lint, format, and build
