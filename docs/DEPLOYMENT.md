# Velora MVP Deployment Plan

Version: 1.0  
Status: Draft  
Last updated: 2026-06-26

## 1. Purpose

This document outlines an MVP-friendly deployment plan for Velora. It is planning documentation only. No production infrastructure, secrets, domains, or deployment automation are created by this document.

The plan covers the current MVP services:

- Fastify backend API
- PostgreSQL database
- Internal admin web app
- Expo mobile app distributed through EAS builds

AI try-on, checkout, social features, partner dashboards, and advanced infrastructure are intentionally outside the MVP deployment scope.

## 2. Recommended MVP Deployment Architecture

Recommended initial production-like architecture:

```text
Mobile App
  |
  | HTTPS
  v
Backend API
  |
  | Managed database connection
  v
PostgreSQL

Admin Web App
  |
  | HTTPS
  v
Backend API
```

Recommended MVP choices:

- Backend API: Railway, Render, or Fly.io
- PostgreSQL: Neon, Supabase, Railway Postgres, or another managed PostgreSQL provider
- Admin web app: Vercel or Netlify
- Mobile app: Expo EAS preview and production builds

MVP preference:

- Use managed services.
- Avoid Kubernetes, Redis, Elasticsearch, queue infrastructure, and custom autoscaling until usage requires them.
- Keep one production backend, one managed production database, and one admin deployment.
- Add a separate staging environment before inviting external testers.

## 3. Backend Deployment Options

### 3.1 Railway

Railway is a good MVP fit when the team wants quick Node.js deployment and optional Railway-managed PostgreSQL.

Recommended use:

- Deploy `backend/` as the app root.
- Build command: `npm install && npm --workspace backend run build`
- Start command: `npm --workspace backend run start`
- Provide `DATABASE_URL`, `JWT_SECRET`, CORS, and rate-limit environment variables in Railway.
- Run migrations as an explicit release step, not as an automatic app start side effect.

Pros:

- Fast setup
- Simple environment variable management
- Easy pairing with Railway Postgres

Risks:

- Need a clear migration workflow
- Usage-based costs should be monitored

### 3.2 Render

Render is a good MVP fit for a managed web service with simple deployment controls.

Recommended use:

- Deploy from the repository with backend-specific build/start commands.
- Use Render environment variables for production secrets.
- Connect to managed PostgreSQL from Render, Neon, Supabase, or another provider.
- Configure health checks against `/health`.

Pros:

- Straightforward web service model
- Good fit for a single Fastify API
- Managed TLS and deploy hooks

Risks:

- Free or low-cost instances may sleep or cold start depending on plan
- Migration workflow still needs explicit handling

### 3.3 Fly.io

Fly.io is a good option if regional placement or Docker-based deployment becomes important.

Recommended use:

- Create a Docker deployment only when needed.
- Keep one small backend app initially.
- Use a managed external PostgreSQL provider unless Fly Postgres operational ownership is acceptable.

Pros:

- Strong regional deployment controls
- Good long-term path for a Node backend

Risks:

- More operational decisions than Railway or Render
- Docker and deployment config add setup overhead

### 3.4 Backend Recommendation

For the first MVP validation environment, use Railway or Render unless there is a specific reason to choose Fly.io.

Recommended first path:

1. Managed PostgreSQL on Neon, Supabase, or Railway.
2. Backend API on Railway or Render.
3. Admin web app on Vercel or Netlify.
4. EAS preview build pointed at the deployed backend URL.

## 4. PostgreSQL Production Options

### 4.1 Neon

Good fit for serverless managed PostgreSQL with branching and straightforward connection strings.

Use when:

- The team wants separate development, staging, and production branches.
- The backend host is separate from the database provider.

Notes:

- Confirm Prisma connection behavior and pooling recommendations.
- Store only provider-issued production connection strings in backend host secrets.

### 4.2 Supabase

Good fit when managed PostgreSQL plus future product tooling may be useful.

Use when:

- The team may later want storage, dashboard inspection, or Supabase ecosystem tools.
- PostgreSQL remains the source of truth through Prisma.

Notes:

- Do not introduce Supabase auth unless explicitly chosen later.
- Keep the current Fastify authentication model for MVP consistency.

### 4.3 Railway Postgres

Good fit when deploying backend and database together on Railway.

Use when:

- Speed and simplicity matter more than database portability during early validation.

Notes:

- Make sure backups and restore processes are understood before real users are added.

### 4.4 Other Managed PostgreSQL

Any managed PostgreSQL provider can work if it supports:

- PostgreSQL-compatible connection strings
- Automated backups
- Secure TLS connections
- Reasonable monitoring
- Restore process documentation

## 5. Admin Web Deployment Options

The admin app is a Vite React app under `admin/`.

Recommended providers:

- Vercel
- Netlify

Recommended build settings:

- App root: `admin/`
- Build command: `npm run build`
- Output directory: `admin/dist` if building from repository root, or `dist` if provider root is `admin/`

Recommended runtime strategy:

- Set `VITE_API_BASE_URL` to the deployed backend API URL plus `/api/v1`, for example `https://api.example.com/api/v1`.
- If using a same-origin reverse proxy, `VITE_API_BASE_URL=/api/v1` can remain valid, but the proxy must forward `/api` to the backend.

Access control note:

- The current admin app requires admin JWT login but is still publicly reachable if deployed on a public URL.
- For MVP, consider additional provider-level protection such as Vercel password protection, Netlify access controls, VPN, or a private preview environment before exposing the admin URL broadly.

## 6. Mobile App API URL Strategy

The mobile app reads:

```text
EXPO_PUBLIC_API_BASE_URL
```

Local values:

- Android emulator: `http://10.0.2.2:4000/api/v1`
- iOS simulator on macOS: `http://localhost:4000/api/v1`
- Physical device: `http://<development-machine-lan-ip>:4000/api/v1`

Preview and production builds:

- Do not use `localhost`, `10.0.2.2`, or LAN IPs.
- Use a stable HTTPS backend URL.
- Example preview value: `https://api-preview.velora.example/api/v1`
- Example production value: `https://api.velora.example/api/v1`

Recommended EAS approach:

- Configure EAS preview builds to use the preview backend URL.
- Configure EAS production builds to use the production backend URL.
- Keep environment values out of source control when they represent real production endpoints or secrets.

Before EAS distribution:

- Configure Android package name.
- Configure iOS bundle identifier.
- Configure EAS project ID.
- Add `frontend/eas.json` build profiles.
- Confirm `docs/MOBILE_BUILD.md` checklist is complete.

## 7. Environment Variables By Service

### 7.1 Backend API

Required production variables:

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | Set to `production`. |
| `HOST` | Usually `0.0.0.0` for managed hosts. |
| `PORT` | Provided by host or set to host-required port. |
| `DATABASE_URL` | Production PostgreSQL connection string. |
| `JWT_SECRET` | Strong production signing secret, minimum 32 characters. |
| `JWT_ACCESS_TOKEN_EXPIRES_IN` | Access-token lifetime, for example `1h`. |
| `CORS_ALLOWED_ORIGINS` | Comma-separated deployed admin and web origins. |
| `AUTH_RATE_LIMIT_MAX` | Auth request limit per route/window. |
| `AUTH_RATE_LIMIT_WINDOW_MS` | Auth rate-limit window in milliseconds. |

Production notes:

- Never reuse local development `JWT_SECRET`.
- Do not commit production `.env` files.
- If the deployment provider injects `PORT`, use that value.
- If the PostgreSQL provider requires TLS parameters in `DATABASE_URL`, preserve them.

### 7.2 Admin Web

Required production variables:

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Deployed backend API base including `/api/v1`, or `/api/v1` when a same-origin proxy exists. |

Production notes:

- Vite exposes `VITE_*` values in the built client.
- Do not put secrets in admin frontend environment variables.
- If admin and backend are on different origins, add the admin origin to backend `CORS_ALLOWED_ORIGINS`.

### 7.3 Mobile App

Required build-time variables:

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_API_BASE_URL` | Deployed backend API base including `/api/v1`. |

Production notes:

- `EXPO_PUBLIC_*` values are public in the built app.
- Do not place secrets in Expo public environment variables.
- Production builds must use HTTPS API URLs.

## 8. Database Migration Strategy

MVP migration principle:

- Migrations should be explicit, reviewed, and run before deploying code that depends on them.

Recommended flow:

1. Develop schema changes locally with Prisma.
2. Commit generated Prisma migrations.
3. Run static validation in CI.
4. Apply migrations to staging.
5. Smoke test staging.
6. Apply migrations to production during a planned release window.
7. Deploy backend code.
8. Run post-deploy health and smoke checks.

Production migration command:

```powershell
npm --workspace backend exec prisma migrate deploy
```

Notes:

- Use `prisma migrate deploy` for production, not `prisma migrate dev`.
- Back up the production database before risky schema changes.
- Avoid destructive migrations during MVP unless absolutely necessary.
- For changes that require data backfills, write and review a one-time migration/backfill plan.

## 9. Seed And Import Strategy

### 9.1 Development Seed Data

The current seed script creates MVP brands, categories, source platforms, and placeholder products.

Use for:

- Local development
- Local smoke testing
- Reset test databases

Do not use placeholder seed data as final production catalog content.

### 9.2 Production Catalog Setup

Recommended MVP production catalog setup:

1. Run migrations.
2. Create the initial internal admin user through a controlled one-off operational process.
3. Create or import approved brands, categories, source platforms, and products through the admin app.
4. Use admin product JSON import for structured product loading.
5. Review imported products in the admin UI.
6. Confirm mobile product discovery and redirect flows against real approved product URLs.

### 9.3 Import Safety

- Do not scrape retailer websites.
- Use approved product data sources only.
- Keep invalid rows from blocking valid imports.
- Do not auto-create brands, categories, or source platforms from product import data.
- Preserve audit notes for the source of imported production data.

## 10. CORS Production Configuration

Backend CORS is controlled by:

```text
CORS_ALLOWED_ORIGINS
```

Recommended production value:

```text
https://admin.velora.example,https://admin-preview.velora.example
```

Include only browser-based origins that need API access:

- Admin production URL
- Admin preview/staging URL
- Any future customer-facing web URL

Do not include:

- `*`
- Localhost in production
- Unknown preview URLs

Mobile native apps are not subject to browser CORS, but Expo web and admin web are.

If using Vercel or Netlify preview deployments, either:

- Add known preview origins deliberately, or
- Use a stable preview admin URL, or
- Configure a same-origin proxy for preview admin environments.

## 11. CI/CD Considerations

Current CI validates:

- Backend typecheck, lint, and format
- Frontend typecheck and lint
- Admin typecheck, lint, and production build

Recommended MVP additions before production release:

- Backend production build check
- Prisma migration validation
- Optional database-backed smoke checks against a disposable PostgreSQL service
- Admin deploy preview on pull requests
- Backend staging deploy after merge to `main`
- Manual approval before production deploy
- EAS preview build workflow for internal test releases

Recommended release gates:

- `npm.cmd run validate`
- Successful backend staging deploy
- Successful database migration on staging
- Smoke test checklist from `docs/TEST_PLAN.md`
- Mobile preview build smoke test
- Admin smoke test

## 12. Rollback Considerations

### Backend

Rollback options:

- Revert to previous backend deployment through provider dashboard.
- Redeploy previous Git commit.
- Keep backend changes backward-compatible with the current database whenever possible.

Important:

- Code rollback is easy only when database migrations are backward-compatible.
- Avoid deploying code that requires an irreversible migration without a rollback plan.

### Database

Rollback options:

- Restore from managed database backup.
- Apply a reviewed compensating migration.

Important:

- Do not rely on ad hoc manual database edits.
- Confirm backup availability before production releases.
- Practice restore on a non-production database before relying on it.

### Admin Web

Rollback options:

- Use Vercel or Netlify deploy rollback.
- Redeploy previous Git commit.

### Mobile

Rollback options:

- Submit a new EAS build with a fix.
- Use store phased rollout controls when available.
- If using Expo Updates later, publish an update only when the runtime supports it.

Important:

- Mobile binary rollback is slower than web rollback.
- Keep backend API changes backward-compatible with the currently distributed mobile app.

## 13. Known Risks

- No production deployment has been created or tested yet.
- No production `eas.json`, Android package name, iOS bundle identifier, or EAS project ID exists yet.
- Production API URL strategy is not finalized.
- Real password reset email delivery is not implemented.
- Admin web may be publicly reachable unless provider-level access controls are added.
- Authentication rate limiting is in-memory and process-local.
- No refresh-token or server-side token revocation flow exists.
- Current CI does not run database-backed automated tests.
- Mobile release builds have not been verified on real devices.
- Seed data uses placeholder images and example retailer URLs.
- Analytics and redirect endpoint auth behavior differs from the optional-auth wording in `docs/API_SPEC.md`.
- Prisma seed configuration uses `package.json#prisma`, which Prisma warns should move before Prisma 7.
- Backup and restore procedures have not been rehearsed.

## 14. Recommended Next Deployment Planning Steps

1. Choose staging and production providers for backend, PostgreSQL, admin, and EAS.
2. Decide production domains, for example API and admin subdomains.
3. Configure a staging backend and managed staging PostgreSQL database.
4. Add EAS build profiles after mobile identifiers and API URLs are decided.
5. Create a staging admin deployment with restricted access.
6. Run migrations and import approved catalog data into staging.
7. Run `docs/TEST_PLAN.md` smoke checks against staging.
8. Only then prepare production secrets, production database, and production deploys.
