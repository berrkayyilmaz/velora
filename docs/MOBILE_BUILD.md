# Velora Mobile Build Readiness

Version: 1.0  
Status: Draft  
Last updated: 2026-06-26

## 1. Purpose

This document captures the current Expo mobile configuration review and the repeatable steps for local Android testing and future EAS build preparation.

It does not change mobile app behavior, branding, release channels, or backend APIs.

## 2. Current Expo Configuration Review

The mobile app uses `frontend/app.json`.

Current configuration:

- App name: `Velora`
- Slug: `velora`
- Version: `0.1.0`
- URL scheme: `velora`
- Orientation: portrait
- UI style: light
- Plugins:
  - `expo-router`
  - `expo-status-bar`
  - `expo-secure-store`
- Typed Expo Router routes enabled
- Android adaptive icon assets are configured
- Android predictive back gesture is disabled
- iOS tablet support is enabled

Current readiness notes:

- No `frontend/eas.json` file exists yet.
- Android package name is not configured yet.
- iOS bundle identifier is not configured yet.
- EAS project ID is not configured yet.
- Build profiles are not defined yet.
- Production API URL is not configured yet.
- App Store and Play Store metadata are not configured yet.
- Final app branding, icons, splash assets, and store screenshots are not finalized.

These are acceptable for Expo Go and local MVP validation, but must be resolved before distributing preview or production builds.

## 3. Mobile Environment Variables

The mobile app reads:

```text
EXPO_PUBLIC_API_BASE_URL
```

The value must include `/api/v1`.

Common local values:

| Target | Value |
| --- | --- |
| Expo web | `http://localhost:4000/api/v1` |
| Android emulator | `http://10.0.2.2:4000/api/v1` |
| iOS simulator on macOS | `http://localhost:4000/api/v1` |
| Physical Android or iOS device | `http://<development-machine-lan-ip>:4000/api/v1` |

After changing `frontend/.env`, restart Expo with a cleared cache:

```powershell
cd frontend
npm.cmd run start -- --clear
```

## 4. Expo Go Testing

Expo Go is the fastest MVP validation path.

Prerequisites:

- Backend is running on `0.0.0.0:4000`
- PostgreSQL is running and migrated
- Seed data has been loaded
- `frontend/.env` points to the correct backend URL for the target device
- Device and development machine are on the same network for physical-device testing

Start Expo:

```powershell
cd frontend
npm.cmd run start
```

Then:

- Press `a` for Android emulator
- Scan the QR code with Expo Go on Android or iOS
- Use Expo web only for quick UI checks, not native behavior validation

Smoke checks:

- Sign up and sign in
- Browse products
- Open product detail
- Add and remove wishlist items
- Create an outfit
- Add and remove outfit products
- Trigger retailer redirect
- Edit profile
- Log out

## 5. Android Emulator Testing

Use this flow for repeatable Windows-based native testing.

1. Start the backend:

```powershell
npm.cmd run dev:backend
```

2. Set the frontend API URL:

```powershell
cd frontend
Set-Content .env "EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:4000/api/v1"
```

3. Start the Android emulator from Android Studio.

4. Start Expo for Android:

```powershell
npm.cmd run android
```

5. Confirm the emulator can reach the backend by opening:

```text
http://10.0.2.2:4000/health
```

Expected result:

- App loads in Expo Go or the development client target
- API calls use the local backend through `10.0.2.2`
- Authenticated MVP flows work against the seeded database

## 6. Physical Device API URL Setup

Physical devices cannot use `localhost` or `10.0.2.2` to reach the development machine.

1. Find the development machine IP address:

```powershell
ipconfig
```

Use the active Wi-Fi or Ethernet adapter's IPv4 address.

2. Set the frontend API URL:

```powershell
cd frontend
Set-Content .env "EXPO_PUBLIC_API_BASE_URL=http://<development-machine-lan-ip>:4000/api/v1"
```

3. Confirm backend binding and firewall:

- Backend `HOST` should be `0.0.0.0`
- Device and machine must be on the same network
- Windows firewall must allow inbound traffic on port `4000`

4. Test from the device browser:

```text
http://<development-machine-lan-ip>:4000/health
```

5. Restart Expo:

```powershell
npm.cmd run start -- --clear
```

## 7. EAS CLI Installation

Install EAS CLI globally:

```powershell
npm install -g eas-cli
```

Confirm installation:

```powershell
eas --version
```

Log in to Expo:

```powershell
eas login
```

Confirm account access:

```powershell
eas whoami
```

## 8. EAS Build Preparation

Before running EAS builds, decide and configure:

- Expo account and project ownership
- Android package name, for example `com.velora.app`
- iOS bundle identifier, for example `com.velora.app`
- Preview and production API base URLs
- App signing approach
- Build profiles in `frontend/eas.json`
- App versioning policy
- Final icon and splash assets
- Store display name and metadata

Initialize EAS configuration from `frontend/` when those decisions are ready:

```powershell
cd frontend
eas build:configure
```

Do not commit production secrets. Use EAS environment variables or secrets for production API configuration when needed.

## 9. Preview Build Command

After `eas build:configure` creates build profiles, run a preview Android build from `frontend/`:

```powershell
eas build --platform android --profile preview
```

If an iOS preview build is needed and Apple credentials are available:

```powershell
eas build --platform ios --profile preview
```

Preview builds should target an MVP validation backend, not a local machine URL.

## 10. Production Build Command

Do not run production builds until release configuration, production API URLs, store metadata, and signing decisions are complete.

When ready, run from `frontend/`:

```powershell
eas build --platform android --profile production
```

For iOS production builds:

```powershell
eas build --platform ios --profile production
```

Build both platforms only after Android and iOS identifiers, credentials, and release environment variables have been verified:

```powershell
eas build --platform all --profile production
```

## 11. Pre-Build Validation Checklist

Run before any preview or production build:

```powershell
cd frontend
npm.cmd run typecheck
npm.cmd run lint
```

Manual checks:

- [ ] Backend target URL is reachable from the intended build environment.
- [ ] `EXPO_PUBLIC_API_BASE_URL` points to a non-localhost URL for distributed builds.
- [ ] Sign-in, registration, catalog, wishlist, outfit, profile, and redirect smoke tests pass.
- [ ] Password reset development-token flow is not treated as production email delivery.
- [ ] App version is correct.
- [ ] Icons and splash assets are acceptable for the intended audience.

## 12. Known Limitations

- There is no `frontend/eas.json` yet, so EAS build profiles are not ready.
- Android package and iOS bundle identifiers are not configured.
- Production API URL and environment strategy are not finalized.
- Real password reset email delivery is not implemented.
- The current app uses functional MVP styling, not final brand design.
- Native release builds have not been run or verified.
- Store submission metadata, screenshots, privacy labels, and review notes are not prepared.
- Expo Go testing does not fully represent production runtime behavior.
- Expo web is useful for quick checks but is not the primary MVP platform.
