# Velora

Velora is a mobile-first fashion discovery and outfit-building platform. The
current MVP lets authenticated users browse products from multiple brands,
search and filter the catalog, save products, create outfits, and record intent
before opening an external retailer.

The repository also contains an internal admin web application for catalog,
product, and basic analytics operations. AI styling, virtual try-on, checkout,
payments, social features, and partner dashboards are intentionally outside the
MVP.

The product requirements and technical contracts are documented in
[`docs/PRD.md`](docs/PRD.md), [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md),
[`docs/DATABASE.md`](docs/DATABASE.md), and
[`docs/API_SPEC.md`](docs/API_SPEC.md).

## Workspace Structure

```text
velora/
|-- frontend/   Expo React Native app for iOS and Android
|-- backend/    Fastify REST API, Prisma schema, migrations, and seed data
|-- admin/      Vite React internal administration app
|-- docs/       Product, architecture, database, and API specifications
|-- AGENTS.md   Repository engineering constraints
|-- package.json
`-- README.md
```

This is an npm workspace. Dependencies can be installed once from the root.

## Tech Stack

| Area                 | Technologies                                                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Mobile               | Expo, React Native, TypeScript, Expo Router, TanStack Query, Axios, React Hook Form, Zod, Zustand, NativeWind, Expo SecureStore |
| Backend              | Node.js, Fastify, TypeScript, PostgreSQL, Prisma ORM, Zod, bcrypt, JWT                                                          |
| Admin                | Vite, React, TypeScript, React Router, TanStack Query, Axios, Tailwind CSS                                                      |
| Local infrastructure | Docker PostgreSQL 16                                                                                                            |

## Prerequisites

- Node.js 20.11 or newer
- npm
- Docker Desktop
- Expo Go, an Android emulator, or an iOS simulator for mobile development

iOS Simulator requires macOS. Windows developers can use Android or a physical
iOS device through Expo.

## Setup

### 1. Install Dependencies

From the repository root:

```powershell
npm install
```

### 2. Start PostgreSQL

Create the local PostgreSQL container expected by `backend/.env.example`:

```powershell
docker run --name velora-postgres `
  -e POSTGRES_USER=velora `
  -e POSTGRES_PASSWORD=velora_password `
  -e POSTGRES_DB=velora `
  -p 5432:5432 `
  -d postgres:16
```

For an existing container:

```powershell
docker start velora-postgres
```

The repository does not currently include a Docker Compose configuration.

### 3. Create Environment Files

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
Copy-Item admin/.env.example admin/.env
```

Replace `JWT_SECRET` with a local random value of at least 32 characters. Do not
commit `.env` files or production credentials.

### 4. Prepare the Database

```powershell
cd backend
npm.cmd run prisma:generate
npm.cmd run prisma:migrate
npm.cmd run prisma:seed
cd ..
```

The seed command creates seven brands, seven MVP categories, three sample source
platforms, and 21 safe sample products using placeholder images and example
retailer URLs.

### 5. Start the Applications

Use separate terminals from the repository root:

```powershell
npm.cmd run dev:backend
npm.cmd run dev:frontend
npm.cmd run dev:admin
```

Default local endpoints:

- Backend: `http://localhost:4000`
- Health: `http://localhost:4000/health`
- Versioned API: `http://localhost:4000/api/v1`
- Admin: `http://localhost:5173`
- Expo: the URL printed by Expo CLI

## Environment Variables

### Backend

| Variable                      | Purpose                                    | Development example                                                       |
| ----------------------------- | ------------------------------------------ | ------------------------------------------------------------------------- |
| `NODE_ENV`                    | Runtime environment                        | `development`                                                             |
| `HOST`                        | Fastify bind host                          | `0.0.0.0`                                                                 |
| `PORT`                        | Fastify port                               | `4000`                                                                    |
| `DATABASE_URL`                | Prisma PostgreSQL connection               | `postgresql://velora:velora_password@localhost:5432/velora?schema=public` |
| `JWT_SECRET`                  | User and admin access-token signing secret | Local random value, minimum 32 characters                                 |
| `JWT_ACCESS_TOKEN_EXPIRES_IN` | Access-token lifetime                      | `1h`                                                                      |
| `CORS_ALLOWED_ORIGINS`        | Comma-separated browser origin allowlist   | `http://localhost:5173,http://localhost:8081`                             |
| `AUTH_RATE_LIMIT_MAX`         | Requests allowed per auth route/IP/window  | `10`                                                                      |
| `AUTH_RATE_LIMIT_WINDOW_MS`   | Auth throttling window in milliseconds     | `60000`                                                                   |

### Mobile

| Variable                   | Purpose               | Development example            |
| -------------------------- | --------------------- | ------------------------------ |
| `EXPO_PUBLIC_API_BASE_URL` | Versioned backend URL | `http://localhost:4000/api/v1` |

Use `http://10.0.2.2:4000/api/v1` for the standard Android emulator. The iOS
simulator on macOS can use `http://localhost:4000/api/v1`. A physical device
must use `http://<development-machine-lan-ip>:4000/api/v1`; run `ipconfig` on
Windows to find the active adapter's IPv4 address. The backend must bind to
`0.0.0.0`, both devices must share a network, and port `4000` must be allowed
through the local firewall. Restart Expo with `npm.cmd run start -- --clear`
after changing this value.

### Admin

| Variable            | Purpose                  | Development example |
| ------------------- | ------------------------ | ------------------- |
| `VITE_API_BASE_URL` | Versioned admin API base | `/api/v1`           |

Vite proxies `/api` to `http://localhost:4000` during development. A production
admin deployment using the relative value must provide an equivalent same-origin
reverse proxy. A separately hosted admin origin must be included in the backend
`CORS_ALLOWED_ORIGINS` value.

## Backend Commands

Run from `backend/`:

```powershell
npm.cmd run dev
npm.cmd run build
npm.cmd run start
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run format:check
npm.cmd run prisma:generate
npm.cmd run prisma:migrate
npm.cmd run prisma:seed
```

Detailed endpoint and database instructions are in
[`backend/README.md`](backend/README.md).

## Frontend Commands

Run from `frontend/`:

```powershell
npm.cmd run start
npm.cmd run android
npm.cmd run ios
npm.cmd run start -- --web
npm.cmd run typecheck
npm.cmd run lint
```

Detailed mobile setup and screen coverage are in
[`frontend/README.md`](frontend/README.md).

## Admin Commands

Run from `admin/`:

```powershell
npm.cmd run dev
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run preview
```

## Continuous Integration

GitHub Actions runs [`.github/workflows/ci.yml`](.github/workflows/ci.yml) for
every pull request and every push to `main`. The workflow installs the locked
workspace dependencies, generates Prisma Client, and runs:

- Backend typecheck, lint, and format check
- Frontend typecheck and lint
- Admin typecheck, lint, and production build

These checks do not start PostgreSQL because none of them connect to the
database. Database-backed tests can add a service container later when such a
test suite exists.

Run the same local validation set from the repository root with:

```powershell
npm.cmd run validate
```

Manual MVP smoke testing is documented in [`docs/TEST_PLAN.md`](docs/TEST_PLAN.md).

## Current MVP Status

### Implemented

- User email/password registration and login
- Password reset request and confirmation with development-token response
- Persisted mobile sessions, protected routes, global `401` handling, and local logout
- Authenticated profile read and display-name update
- Active product catalog, pagination, search, filters, filter options, and product detail
- Default wishlist add, remove, list, and backend newest/oldest sorting
- Saved outfit create, list, detail, rename, delete, product add, and product remove
- Retailer redirect recording followed by external URL opening
- PostgreSQL analytics-event storage and admin event/redirect review
- Separate admin authentication and persisted admin session
- Global admin navigation, administrator identity display, and local logout
- Admin analytics summary, paginated event and redirect lists
- Admin product list, create, edit, and soft deactivation
- Admin product JSON import with per-row validation and import summaries
- Admin brand, category, and source-platform list, create, and edit
- PostgreSQL schema, initial migration, and idempotent MVP seed data
- GitHub Actions validation for backend, mobile, and admin workspaces

### Release Readiness

The repository is suitable for continued internal MVP validation, but it is not
ready for a public MVP release. The current release decision is **not ready**.

All TypeScript, lint, formatting, Prisma validation, backend build, and admin
build checks pass. Release confidence is still limited by missing approved flows,
production infrastructure gaps, and the absence of automated tests and device
release builds.

## Known Limitations

- Password reset does not send real email yet. In development, the API returns
  the reset token so the MVP flow can be tested locally.
- User and admin logout are local token removal only; the API logout endpoints
  in `API_SPEC.md` are not implemented. There is no refresh-token or token
  revocation flow.
- Authentication endpoints have basic in-memory, per-IP rate limiting. It is
  process-local and must be supplemented by edge or distributed protection for
  multi-instance production deployment. A deleted admin's existing JWT remains
  valid until expiration because admin existence is not rechecked by middleware.
- Analytics does not yet emit the approved registration, login, logout, password
  reset, outfit edit, or outfit delete events. Redirect events and analytics
  events are separate client requests.
- The analytics and redirect endpoints require user authentication even though
  `API_SPEC.md` currently marks them as optional-auth endpoints.
- Product list sorting and `meta.appliedFilters`, analytics metadata, health
  response shape, and admin analytics summary shape do not fully match the
  current API specification.
- Admin product search/filter UI is not implemented. Catalog delete endpoints
  documented in the API specification are also absent.
- The mobile wishlist does not add products directly to outfits; users must open
  product detail first. Wishlist/outfit sorting controls are not exposed.
- Product descriptions, available colors, and tags are returned by the backend
  but are not displayed in the mobile product detail screen.
- Seed products use placeholder images and example retailer URLs. Real approved
  retailer data required for pre-launch shopping validation has not been added.
- Backend CORS uses an explicit environment allowlist. Production reverse-proxy
  configuration, deployment automation, centralized monitoring, and external
  error reporting are not configured. The shared error handler logs only through
  the Fastify logger.
- There are no automated backend, mobile, or admin tests. Native iOS/Android
  release builds and physical-device acceptance tests were not run in this audit.
- Frontend and admin API responses rely on static TypeScript types and are not
  runtime-validated with Zod.
- Prisma reports that `package.json#prisma` seed configuration is deprecated and
  should move to `prisma.config.ts` before upgrading to Prisma 7.
