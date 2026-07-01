# Velora Frontend

Expo and React Native mobile client for the Velora MVP. The application uses
TypeScript, Expo Router, TanStack Query, Axios, React Hook Form, Zod, Zustand,
and NativeWind.

## Prerequisites

- Node.js 20.11 or newer
- npm
- A running Velora backend and PostgreSQL database
- Expo Go, an Android emulator, or an iOS simulator for mobile development

Backend setup, migration, and seed instructions are documented in
[`../backend/README.md`](../backend/README.md).

## Install Dependencies

From the repository root:

```powershell
npm install
```

Or from `frontend/` only:

```powershell
cd frontend
npm install
```

## Environment Variables

Create the local frontend environment file:

```powershell
cd frontend
Copy-Item .env.example .env
```

| Variable | Purpose | Default example |
| --- | --- | --- |
| `EXPO_PUBLIC_API_BASE_URL` | Versioned Velora backend base URL. | `http://localhost:4000/api/v1` |

The value must include `/api/v1`. It is validated when the application starts.

Platform-specific local API addresses:

| Target | `EXPO_PUBLIC_API_BASE_URL` |
| --- | --- |
| iOS simulator on macOS | `http://localhost:4000/api/v1` |
| Android Studio emulator | `http://10.0.2.2:4000/api/v1` |
| Physical iOS or Android device | `http://<development-machine-lan-ip>:4000/api/v1` |
| Expo web | `http://localhost:4000/api/v1` |

For a physical device, run `ipconfig` on Windows and use the active network
adapter's IPv4 address. The backend must listen on `0.0.0.0`, the device and
development machine must be on the same network, and the local firewall must
allow inbound traffic to port `4000`. Confirm connectivity from the device by
opening `http://<development-machine-lan-ip>:4000/health` in its browser.

After changing `frontend/.env`, restart Expo with a cleared cache:

```powershell
npm.cmd run start -- --clear
```

Native mobile requests are not subject to browser CORS. Expo web origins must be
included in the backend `CORS_ALLOWED_ORIGINS` value.

Authenticated sessions are stored with Expo SecureStore on supported native
platforms. Expo web uses browser local storage for development compatibility.

## Start Commands

Run these from `frontend/`:

```powershell
npm.cmd run start
npm.cmd run android
npm.cmd run ios
npm.cmd run start -- --web
```

`npm.cmd run start` opens the Expo development server and allows selecting a
target interactively.

## Validation Commands

```powershell
npm.cmd run typecheck
npm.cmd run lint
```

There is currently no automated frontend test suite.

## Implemented Screens

### Authentication

- Sign in with email and password
- Register with email, password, and optional display name
- Authenticated and unauthenticated route protection
- Local logout from the profile screen
- Forgot password and reset password screens

### Product Discovery

- Paginated product catalog
- Debounced product search
- Brand, category, retailer, color, and price filters
- Product filter options loaded from the API
- Product detail
- Favorite and unfavorite from product detail
- Add a product to an existing or new outfit
- Tracked retailer redirect

### Wishlist

- Default wishlist list
- Remove products
- Loading, empty, and error states
- Navigation to product detail

### Outfits

- Paginated saved-outfit list
- Create, rename, and delete outfits
- Mixed catalog and wardrobe item previews and counts
- Outfit detail with discriminated mixed items, category information, and soft
  missing-category hints
- Add products from product detail
- Add active wardrobe items with media from wardrobe detail
- Remove catalog products or wardrobe items from an outfit
- Tracked retailer redirects with outfit context

### Digital Wardrobe

- Paginated wardrobe list with search, category, status, and sort controls
- Create, view, edit, archive, activate, and delete wardrobe items
- Draft, active, archived, and deletion-pending status display
- Primary image upload and deletion
- Activation guidance when media is missing
- Add eligible wardrobe items to existing outfits
- Loading, empty, validation, API error, and success states

### Profile

- Load the authenticated profile
- Update or clear the display name
- Local logout and query-cache clearing

## API Integration

The Axios client uses `EXPO_PUBLIC_API_BASE_URL` and attaches the current user
JWT as a bearer token. Implemented user-facing endpoint groups are:

- `/auth/login`
- `/auth/register`
- `/me`
- `/products`
- `/products/filter-options`
- `/products/:id`
- `/wishlist`
- `/wishlist/items`
- `/outfits`
- `/outfits/:id`
- `/outfits/:id/products`
- `/outfits/:id/wardrobe-items`
- `/wardrobe`
- `/wardrobe/:id`
- `/wardrobe/:id/media`
- `/redirects`
- `/analytics/events`

TanStack Query owns server state. Wishlist mutations invalidate wishlist,
product-list, and affected product-detail queries. Outfit mutations update or
remove affected detail data and invalidate saved-outfit lists. Wardrobe metadata
and media mutations invalidate wardrobe lists and affected outfit summaries.
Logout clears the entire query cache before clearing the auth session.

Analytics events are sent automatically after successful product-detail,
filter, wishlist, outfit, and retailer-redirect actions. Analytics requests are
fire-and-forget and do not block the related user flow when tracking fails.

## Project Structure

```text
src/
|-- app/          Expo Router route files
|-- components/   Reusable UI components
|-- config/       Environment and query-client configuration
|-- hooks/        TanStack Query and application hooks
|-- providers/    Application providers
|-- schemas/      Zod form schemas
|-- screens/      Screen implementations
|-- services/     Axios API service functions
|-- store/        Zustand client state
|-- types/        Shared TypeScript domain types
`-- utils/        Error and formatting helpers
```

## Known Limitations

- Native sessions persist in Expo SecureStore. Expo web uses local storage and
  therefore does not provide the same protection against script-based access.
- There is no refresh-token flow. A `401` response clears the persisted session
  and query cache, then returns the user to sign-in.
- Logout is local only because the backend logout endpoint is not implemented.
- Password reset does not send real email yet. In development, the backend
  returns the reset token for local testing.
- Product sorting is not exposed in the catalog UI.
- Catalog cards do not provide direct favorite controls; favorite actions are on
  product detail.
- Wishlist items cannot be added directly to an outfit; users must open product
  detail first.
- Wishlist and outfit newest/oldest sorting controls are not exposed in the UI.
- Product descriptions, available colors, and tags are not displayed.
- Wardrobe image upload uses backend local development storage. Media URLs are
  not private signed URLs and are not production-ready.
- Wardrobe image replacement is not supported; delete the current image before
  uploading another.
- Creating a new outfit directly from wardrobe detail is not implemented; an
  existing outfit must be selected.
- Wardrobe-specific analytics coverage is incomplete.
- The internal admin web panel described by the PRD is not implemented in this
  frontend.
- Expo web cross-origin API calls only work when the web origin is included in
  the backend `CORS_ALLOWED_ORIGINS` value.
- API responses use static TypeScript types but are not runtime-validated with
  Zod.
- Retailer links are opened after an asynchronous API request; browser popup
  policies may affect Expo web, while native iOS and Android use platform link
  handling.
- The UI is functional MVP styling and is not the final design system.
