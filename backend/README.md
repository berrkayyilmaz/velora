# Velora Backend

Fastify, TypeScript, Prisma, PostgreSQL, and Zod backend for the Velora MVP.

The backend exposes MVP API routes under `/api/v1`, matching `docs/API_SPEC.md`.
The infrastructure health check also remains available at `/health`.

## Prerequisites

- Node.js 20.11 or newer
- npm
- Docker Desktop, for local PostgreSQL

## Install Dependencies

From the repository root:

```powershell
npm install
```

Or from `backend/` only:

```powershell
cd backend
npm install
```

## Local PostgreSQL With Docker

Start a local PostgreSQL container that matches `backend/.env.example`:

```powershell
docker run --name velora-postgres `
  -e POSTGRES_USER=velora `
  -e POSTGRES_PASSWORD=velora_password `
  -e POSTGRES_DB=velora `
  -p 5432:5432 `
  -d postgres:16
```

Useful Docker commands:

```powershell
docker start velora-postgres
docker stop velora-postgres
docker logs velora-postgres
```

To remove the local database container and data:

```powershell
docker rm -f velora-postgres
```

## Environment Variables

Create a local environment file:

```powershell
cd backend
Copy-Item .env.example .env
```

Variables:

| Variable                      | Purpose                                                            | Example                                                                   |
| ----------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| `NODE_ENV`                    | Runtime environment.                                               | `development`                                                             |
| `HOST`                        | Server bind host.                                                  | `0.0.0.0`                                                                 |
| `PORT`                        | Server port.                                                       | `4000`                                                                    |
| `DATABASE_URL`                | PostgreSQL connection string used by Prisma.                       | `postgresql://velora:velora_password@localhost:5432/velora?schema=public` |
| `JWT_SECRET`                  | Secret used to sign access tokens. Must be at least 32 characters. | `replace-with-a-local-development-secret-at-least-32-characters`          |
| `JWT_ACCESS_TOKEN_EXPIRES_IN` | Access token expiration passed to JWT signing.                     | `1h`                                                                      |

`backend/.env` is gitignored.

## Prisma Commands

Run these from `backend/`:

```powershell
npm.cmd run prisma:generate
npm.cmd run prisma:migrate
npm.cmd run prisma:seed
```

Command purpose:

- `prisma:generate`: generates Prisma Client from `prisma/schema.prisma`.
- `prisma:migrate`: applies development migrations to the configured PostgreSQL database.
- `prisma:seed`: seeds MVP brands, categories, source platforms, and sample fashion products.

## Development Server

From `backend/`:

```powershell
npm.cmd run dev
```

Default local URL:

```text
http://localhost:4000
```

Health check:

```text
GET http://localhost:4000/health
```

Versioned API health check:

```text
GET http://localhost:4000/api/v1/health
```

## Validation Commands

From `backend/`:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run format:check
npm.cmd run build
```

## Implemented Endpoint Groups

MVP API routes are served under `/api/v1`. The infrastructure health check also
remains available at `/health`.

### Health

- `GET /health`
- `GET /api/v1/health`

### User Authentication

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`

Not implemented yet:

- User logout
- Password reset request
- Password reset confirmation

### User Profile

- `GET /api/v1/me`
- `PATCH /api/v1/me`

### Products

- `GET /api/v1/products`
- `GET /api/v1/products/filter-options`
- `GET /api/v1/products/:id`

### Wishlist

- `GET /api/v1/wishlist`
- `POST /api/v1/wishlist/items`
- `DELETE /api/v1/wishlist/items/:productId`

### Outfits

- `GET /api/v1/outfits`
- `POST /api/v1/outfits`
- `GET /api/v1/outfits/:id`
- `PATCH /api/v1/outfits/:id`
- `DELETE /api/v1/outfits/:id`
- `POST /api/v1/outfits/:id/products`
- `DELETE /api/v1/outfits/:id/products/:productId`

### Retailer Redirects

- `POST /api/v1/redirects`

### Analytics Events

- `POST /api/v1/analytics/events`

### Admin Authentication

- `POST /api/v1/admin/auth/login`
- `GET /api/v1/admin/me`

Not implemented yet:

- Admin logout

### Admin Product Management

- `GET /api/v1/admin/products`
- `POST /api/v1/admin/products`
- `GET /api/v1/admin/products/:id`
- `PATCH /api/v1/admin/products/:id`
- `DELETE /api/v1/admin/products/:id`
- `POST /api/v1/admin/products/import`

The import endpoint accepts a JSON body with a `products` array of 1-100 rows.
Each row may reference its brand, category, and source platform by ID or slug.
The response reports created, skipped, and failed rows without failing the
entire batch when one row is invalid.

### Admin Catalog Management

- `GET /api/v1/admin/brands`
- `POST /api/v1/admin/brands`
- `PATCH /api/v1/admin/brands/:id`
- `GET /api/v1/admin/categories`
- `POST /api/v1/admin/categories`
- `PATCH /api/v1/admin/categories/:id`
- `GET /api/v1/admin/source-platforms`
- `POST /api/v1/admin/source-platforms`
- `PATCH /api/v1/admin/source-platforms/:id`

### Admin Analytics

- `GET /api/v1/admin/analytics/summary`
- `GET /api/v1/admin/analytics/events`
- `GET /api/v1/admin/analytics/redirects`

## Notes

- User routes require user JWTs unless they are public auth routes.
- Admin routes require admin JWTs and reject normal user tokens.
- Product deletion is implemented as soft deletion by setting `isActive` to `false`.
- Seed data uses safe placeholder images and example retailer URLs.
