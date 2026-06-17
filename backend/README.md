# Velora Backend

Fastify, TypeScript, Prisma, PostgreSQL, and Zod backend for the Velora MVP.

The backend currently exposes routes at the root API path, such as `/health` and
`/auth/login`. `docs/API_SPEC.md` defines `/api/v1` as the target API base path,
but that prefix is not registered in the current implementation.

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

## Validation Commands

From `backend/`:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run format:check
npm.cmd run build
```

## Implemented Endpoint Groups

Current route prefixes do not include `/api/v1`.

### Health

- `GET /health`

### User Authentication

- `POST /auth/register`
- `POST /auth/login`

Not implemented yet:

- User logout
- Password reset request
- Password reset confirmation

### User Profile

- `GET /profile`
- `PATCH /profile`

### Products

- `GET /products`
- `GET /products/:id`

Not implemented yet:

- `GET /products/filter-options`

### Wishlist

- `GET /wishlist`
- `POST /wishlist/items`
- `DELETE /wishlist/items/:productId`

### Outfits

- `GET /outfits`
- `POST /outfits`
- `GET /outfits/:id`
- `PATCH /outfits/:id`
- `DELETE /outfits/:id`
- `POST /outfits/:id/products`
- `DELETE /outfits/:id/products/:productId`

### Retailer Redirects

- `POST /redirects`

### Analytics Events

- `POST /analytics/events`

### Admin Authentication

- `POST /admin/auth/login`
- `GET /admin/me`

Not implemented yet:

- Admin logout

### Admin Product Management

- `GET /admin/products`
- `POST /admin/products`
- `GET /admin/products/:id`
- `PATCH /admin/products/:id`
- `DELETE /admin/products/:id`

Not implemented yet:

- `POST /admin/products/imports`

### Admin Catalog Management

- `GET /admin/brands`
- `POST /admin/brands`
- `PATCH /admin/brands/:id`
- `GET /admin/categories`
- `POST /admin/categories`
- `PATCH /admin/categories/:id`
- `GET /admin/source-platforms`
- `POST /admin/source-platforms`
- `PATCH /admin/source-platforms/:id`

### Admin Analytics

- `GET /admin/analytics/summary`
- `GET /admin/analytics/events`
- `GET /admin/analytics/redirects`

## Notes

- User routes require user JWTs unless they are public auth routes.
- Admin routes require admin JWTs and reject normal user tokens.
- Product deletion is implemented as soft deletion by setting `isActive` to `false`.
- Seed data uses safe placeholder images and example retailer URLs.
