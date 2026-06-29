# Velora Closed Beta Readiness Checklist

Version: 1.0  
Status: Draft  
Last updated: 2026-06-26

## 1. Purpose

This document audits Velora's readiness for a closed beta and defines the gates required before closed beta, public beta, and production release.

It is documentation only. It does not add product features, change runtime code, create production secrets, deploy infrastructure, or run builds.

## 2. Readiness Summary

Current recommendation:

- Internal team validation: Go
- Closed beta with external invite-only testers: No-Go until required closed beta items are complete
- Public beta: No-Go
- Production: No-Go

Rationale:

The MVP product surface is largely implemented for internal validation, including mobile user flows, backend APIs, admin tooling, seed/import support, analytics storage, and smoke test documentation. The main blockers for closed beta are operational rather than core product scope: deployed staging infrastructure, real product data, EAS preview builds, admin access controls, email/account recovery expectations, and completed smoke testing on real devices.

## 3. What Is Ready

### Product Scope

- Mobile-first MVP scope is defined in `docs/PRD.md`.
- MVP excludes AI try-on, AI stylist recommendations, checkout, payments, social features, AR, and partner dashboards.
- User-facing mobile app supports the core discovery-to-outfit flow.
- Internal admin web app exists for product, catalog, import, and analytics operations.

### Backend

- Fastify backend exists under `backend/`.
- API routes are served under `/api/v1`.
- Health endpoint exists.
- User registration and login are implemented.
- Password reset request and confirmation are implemented with development-token response.
- Authenticated profile read/update is implemented.
- Product catalog, search, filtering, filter options, and product detail are implemented.
- Wishlist add/list/remove is implemented.
- Outfit create/list/detail/edit/delete and product add/remove are implemented.
- Retailer redirect event creation is implemented.
- Analytics event storage is implemented.
- Admin authentication is implemented.
- Admin product management and JSON import are implemented.
- Admin catalog management is implemented.
- Admin analytics summary, events, and redirects are implemented.

### Frontend Mobile

- Expo React Native app exists under `frontend/`.
- Sign-in, registration, password reset, protected routing, and logout exist.
- Product catalog, search, filters, and product detail exist.
- Wishlist add/remove/list flow exists.
- Outfit create/list/detail/edit/delete and add/remove product flows exist.
- Retailer redirect integration exists.
- Profile read/update exists.
- Session persistence and global unauthorized handling exist.
- Automatic analytics calls exist for key client flows.

### Admin Web

- Vite React admin app exists under `admin/`.
- Admin login, session persistence, route protection, navigation, and logout exist.
- Dashboard summary and analytics lists exist.
- Product list/create/edit/soft-delete and import flows exist.
- Brand, category, and source platform list/create/edit/deactivate flows exist.

### Documentation And Validation

- `README.md` documents setup, commands, environment variables, and current MVP status.
- `docs/TEST_PLAN.md` defines manual backend, mobile, and admin smoke tests.
- `docs/MOBILE_BUILD.md` documents Expo Go, Android emulator, physical device, and EAS preparation.
- `docs/DEPLOYMENT.md` documents deployment options, environment strategy, migrations, imports, CORS, CI/CD, rollback, and risks.
- Root validation scripts exist:
  - `npm.cmd run validate`
  - `npm.cmd run validate:backend`
  - `npm.cmd run validate:frontend`
  - `npm.cmd run validate:admin`
- GitHub Actions CI exists for static validation.

## 4. What Is Not Ready

### Closed Beta Gaps

- No staging or production backend deployment has been created.
- No managed staging or production PostgreSQL database has been configured.
- No admin web deployment has been created.
- No EAS preview build profile exists.
- No native preview build has been generated or smoke tested.
- No Android package name, iOS bundle identifier, or EAS project ID is configured.
- No production or staging API URL strategy is implemented in build profiles.
- Product catalog still relies on placeholder images and example retailer URLs unless replaced through admin import.
- Real password reset email delivery is not implemented.
- Admin web may be publicly reachable if deployed without provider-level access controls.
- Database backup and restore process has not been rehearsed.
- Real device testing has not been recorded as passed.

### Public Beta And Production Gaps

- No public launch infrastructure exists.
- No store submission metadata, screenshots, privacy labels, or review notes are prepared.
- No production monitoring or external error reporting is configured.
- No automated database-backed tests exist.
- No refresh-token or token revocation flow exists.
- Auth rate limiting is process-local.
- Some API behavior differs from `docs/API_SPEC.md`, as noted in `README.md`.
- Admin product search/filter UI remains incomplete.
- Some backend-returned product detail fields are not displayed in mobile.
- Analytics coverage is not fully aligned with all approved events.

## 5. Required Before Closed Beta

Closed beta means invite-only external testers using a deployed backend and an EAS preview build, not local Expo development.

- [ ] Choose staging providers for backend, PostgreSQL, admin, and EAS.
- [ ] Deploy staging backend over HTTPS.
- [ ] Provision managed staging PostgreSQL.
- [ ] Set secure staging backend environment variables.
- [ ] Run Prisma migrations on staging with `prisma migrate deploy`.
- [ ] Create a controlled staging admin account.
- [ ] Deploy staging admin web app.
- [ ] Add provider-level access protection for staging admin if the URL is public.
- [ ] Configure staging CORS for the deployed admin origin.
- [ ] Replace placeholder catalog data with approved beta product data.
- [ ] Confirm every beta product has a valid image and external product URL.
- [ ] Confirm retailer redirects are stored and product URLs open correctly.
- [ ] Configure `frontend/eas.json` preview profile.
- [ ] Configure Android package name and iOS bundle identifier, or explicitly limit closed beta to Android preview builds first.
- [ ] Configure EAS project ID.
- [ ] Configure preview build `EXPO_PUBLIC_API_BASE_URL` to the staging API URL.
- [ ] Generate at least one EAS preview build.
- [ ] Run `npm.cmd run validate`.
- [ ] Run all smoke tests in `docs/TEST_PLAN.md` against staging.
- [ ] Run mobile smoke tests on at least one Android device or emulator.
- [ ] If iOS testers are included, run smoke tests on iOS as well.
- [ ] Document known limitations for beta testers.
- [ ] Prepare a private feedback channel for beta testers.
- [ ] Define who can access the closed beta and how access will be revoked.
- [ ] Confirm no production secrets are stored in source control.

## 6. Required Before Public Beta

Public beta means broader non-production availability with a higher reliability and trust bar.

- [ ] Complete all closed beta requirements.
- [ ] Complete at least one closed beta cycle with no critical blockers.
- [ ] Use real approved product data, images, and retailer URLs.
- [ ] Configure real password reset email delivery or clearly decide an acceptable beta alternative.
- [ ] Add production-like monitoring and error reporting for backend.
- [ ] Add operational alerting for backend failures.
- [ ] Confirm managed database backups and restore process.
- [ ] Rehearse database restore on a non-production database.
- [ ] Add a staging environment separate from production if closed beta used production-like resources.
- [ ] Define privacy policy and beta terms appropriate for public beta.
- [ ] Prepare app store or distribution metadata.
- [ ] Verify mobile builds on supported Android and iOS devices.
- [ ] Review CORS and admin access restrictions.
- [ ] Define support and incident response ownership.
- [ ] Confirm analytics dashboards answer MVP validation questions.
- [ ] Resolve or explicitly accept API-spec alignment gaps.

## 7. Required Before Production

Production means public release with real users and an expectation of ongoing reliability.

- [ ] Complete public beta requirements.
- [ ] Define production SLO expectations for backend availability and response times.
- [ ] Configure production backend deployment.
- [ ] Configure production managed PostgreSQL with backups.
- [ ] Configure production admin deployment with restricted access.
- [ ] Configure production EAS builds for Android and iOS.
- [ ] Finalize Android package name and iOS bundle identifier.
- [ ] Finalize app icons, splash assets, screenshots, metadata, privacy labels, and review notes.
- [ ] Replace all placeholder product data.
- [ ] Finalize product data source process and ownership.
- [ ] Add real email delivery for password reset.
- [ ] Decide token refresh/revocation strategy or explicitly accept current JWT limitations.
- [ ] Decide rate limiting strategy beyond in-memory process-local limits.
- [ ] Add external monitoring, structured logging, and error reporting.
- [ ] Add database-backed automated checks or integration tests for critical flows.
- [ ] Define rollback process for backend, admin, database, and mobile releases.
- [ ] Rehearse rollback on staging.
- [ ] Review security posture for auth, admin access, CORS, secrets, and user data access.
- [ ] Confirm legal/privacy requirements for user accounts and analytics.
- [ ] Confirm support process and issue escalation path.

## 8. Manual Test Checklist

Use `docs/TEST_PLAN.md` as the detailed smoke plan. Closed beta cannot proceed until these checks pass against the deployed staging environment.

### Backend Smoke

- [ ] Health endpoints return healthy status.
- [ ] User registration works.
- [ ] User login works.
- [ ] Password reset request and confirmation work in the chosen beta account-recovery mode.
- [ ] Profile read/update works.
- [ ] Product list, search, filters, filter options, and detail work.
- [ ] Wishlist add/list/remove works.
- [ ] Outfit create/list/detail/edit/delete works.
- [ ] Product add/remove in outfit works.
- [ ] Retailer redirect event records and returns product URL.
- [ ] Analytics event endpoint accepts approved events.
- [ ] Admin auth and admin protected endpoints work.

### Mobile Smoke

- [ ] App starts from a clean install.
- [ ] Unauthenticated users land on auth screens.
- [ ] Registration redirects into the main app.
- [ ] Login persists across app restart.
- [ ] Global unauthorized handling returns user to sign-in.
- [ ] Product discovery flow works.
- [ ] Search and filters work together.
- [ ] Product detail actions work.
- [ ] Wishlist flow works.
- [ ] Outfit flow works.
- [ ] Retailer redirect opens external URL and preserves app navigation.
- [ ] Profile update works.
- [ ] Logout clears session.

### Admin Smoke

- [ ] Admin login works.
- [ ] Admin logout works.
- [ ] Dashboard analytics summary loads.
- [ ] Analytics event list loads.
- [ ] Redirect list loads.
- [ ] Products can be listed, created, edited, soft-deleted, and imported.
- [ ] Invalid product imports show failed-row reasons.
- [ ] Brands can be listed, created, edited, and deactivated when safe.
- [ ] Categories can be listed, created, edited, and deactivated when safe.
- [ ] Source platforms can be listed, created, edited, and deactivated when safe.
- [ ] User token cannot access admin routes.

## 9. Admin Preparation Checklist

- [ ] Create a staging admin user through a controlled operational process.
- [ ] Store admin credentials in a secure password manager.
- [ ] Do not commit admin credentials.
- [ ] Restrict staging admin URL access if provider supports it.
- [ ] Confirm admin CORS origin is allowed by backend.
- [ ] Confirm admin can import products successfully.
- [ ] Confirm admin can review analytics and redirect events.
- [ ] Confirm admin can deactivate products without deleting historical data.
- [ ] Document who owns product import and catalog updates during beta.

## 10. Product Data Preparation Checklist

- [ ] Identify approved beta product data source.
- [ ] Confirm data usage rights for beta testing.
- [ ] Prepare product rows with valid brand, category, and source platform references.
- [ ] Ensure all products include title, brand, category, price, color, image URL, product URL, source platform, and active status.
- [ ] Replace example retailer URLs with real purchasable URLs where possible.
- [ ] Replace placeholder images with approved product images.
- [ ] Verify image URLs load on mobile.
- [ ] Verify product URLs open in external browser.
- [ ] Include products across MVP categories: tops, bottoms, dresses, outerwear, shoes, bags, and accessories.
- [ ] Include enough cross-brand products to validate outfit-building behavior.
- [ ] Keep a record of import source and import date.

## 11. Deployment Preparation Checklist

- [ ] Choose backend provider: Railway, Render, or Fly.io.
- [ ] Choose managed PostgreSQL provider: Neon, Supabase, Railway Postgres, or managed Postgres.
- [ ] Choose admin provider: Vercel or Netlify.
- [ ] Configure staging backend environment variables.
- [ ] Configure staging database connection.
- [ ] Run migrations with `prisma migrate deploy`.
- [ ] Configure backend health check.
- [ ] Configure staging admin environment variable `VITE_API_BASE_URL`.
- [ ] Configure backend `CORS_ALLOWED_ORIGINS` with the staging admin origin.
- [ ] Confirm backend logs are available.
- [ ] Confirm database backup settings are enabled.
- [ ] Confirm rollback path for backend deploy.
- [ ] Confirm rollback path for admin deploy.
- [ ] Confirm database restore process is known.

## 12. Mobile Build Preparation Checklist

- [ ] Install EAS CLI.
- [ ] Log in to Expo account.
- [ ] Decide Expo project ownership.
- [ ] Configure Android package name.
- [ ] Configure iOS bundle identifier if iOS beta is included.
- [ ] Configure EAS project ID.
- [ ] Add `frontend/eas.json` with preview profile.
- [ ] Configure preview `EXPO_PUBLIC_API_BASE_URL` to staging backend URL.
- [ ] Run frontend typecheck and lint.
- [ ] Generate Android preview build.
- [ ] Generate iOS preview build if iOS beta is included.
- [ ] Install preview build on tester device.
- [ ] Run mobile smoke checklist on the preview build.
- [ ] Document installation instructions for beta testers.

## 13. Known Risks

- Current environment is not deployed to staging or production.
- Closed beta depends on operational setup that is not yet implemented.
- Real email delivery is absent, making password reset unsuitable for external beta unless handled manually or implemented.
- In-memory auth rate limiting is not enough for multi-instance production.
- No refresh-token or token revocation flow exists.
- Admin web access needs provider-level protection if deployed publicly.
- Mobile builds have not been generated or real-device verified.
- Placeholder seed data is not enough to validate real purchase intent.
- Analytics coverage and API spec alignment gaps may limit validation accuracy.
- No automated database-backed tests exist.
- Backup and restore have not been rehearsed.
- Mobile binary rollback is slower than backend/admin rollback.
- Expo public environment values are visible in app builds and must not contain secrets.

## 14. Go / No-Go Criteria

### Internal Validation

Go when:

- [ ] Local backend, frontend, and admin can be started.
- [ ] `npm.cmd run validate` passes.
- [ ] Local smoke tests pass.

Current status: Go.

### Closed Beta

Go only when:

- [ ] Staging backend is deployed over HTTPS.
- [ ] Managed staging PostgreSQL is deployed and migrated.
- [ ] Staging admin is deployed and access-restricted.
- [ ] Approved beta catalog data is imported.
- [ ] EAS preview build is generated and points to staging API.
- [ ] Mobile smoke tests pass on target beta device platform.
- [ ] Admin smoke tests pass on staging.
- [ ] Password reset beta handling is clearly defined.
- [ ] Known limitations are documented for testers.
- [ ] Feedback and support channel is ready.

No-Go if any of these are true:

- [ ] App points to localhost, `10.0.2.2`, or LAN IP for external testers.
- [ ] Placeholder products are the only catalog data.
- [ ] Admin URL is publicly exposed without acceptable protection.
- [ ] Migrations have not been applied to staging.
- [ ] Smoke tests have not been run against the deployed beta environment.
- [ ] Mobile preview build has not been installed and verified.

Current status: No-Go until closed beta requirements are completed.

### Public Beta

Go only when:

- [ ] Closed beta has run successfully.
- [ ] Critical closed beta issues are resolved.
- [ ] Real product data and retailer URLs are ready.
- [ ] Monitoring, backups, and support process are in place.
- [ ] Store/distribution metadata is prepared.
- [ ] Privacy and beta terms are ready.

Current status: No-Go.

### Production

Go only when:

- [ ] Public beta has validated the core product behavior.
- [ ] Production deployment and rollback processes are rehearsed.
- [ ] Production monitoring and alerting are in place.
- [ ] Security, privacy, and operational gaps are addressed or formally accepted.
- [ ] App store release assets and review requirements are complete.
- [ ] Product data source and update process are reliable.

Current status: No-Go.
