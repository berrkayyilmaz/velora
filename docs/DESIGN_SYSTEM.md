# Velora Design System v1

## Purpose

Velora Design System v1 provides shared visual rules and reusable UI primitives for the
mobile app and internal admin panel. It standardizes presentation without owning product
data, API calls, navigation, or business logic.

## Principles

- Use semantic tokens instead of feature-specific colors.
- Keep controls compact, readable, and suitable for repeated workflows.
- Use the same component intent and icon family across mobile and admin.
- Support light and dark themes without changing information hierarchy.
- Prefer existing primitives before adding one-off component styling.

## Design Tokens

Both clients expose matching token groups:

- `background`: application canvas
- `surface`: cards, inputs, modals, and navigation surfaces
- `foreground`: primary text and icons
- `mutedForeground`: secondary text and metadata
- `primary`: primary actions and active navigation
- `secondary`: low-emphasis surfaces
- `accent`: fashion-oriented emphasis
- `border`: dividers and control outlines
- `destructive`: destructive actions and errors
- `success`: successful operations and active status

The palette combines neutral surfaces, deep green primary actions, and coral accents.
Dark mode uses higher-luminance equivalents rather than opacity-only color changes.

Spacing follows a 4-point scale. Controls use a 6px radius and cards use an 8px radius.
Typography roles are `display`, `title`, `heading`, `body`, `label`, and `caption`.

### Token Sources

- Mobile TypeScript tokens: `frontend/src/theme/tokens.ts`
- Mobile NativeWind tokens: `frontend/tailwind.config.js`
- Admin TypeScript tokens: `admin/src/theme/tokens.ts`
- Admin CSS tokens: `admin/src/styles/globals.css`

## Components

Both clients provide:

- `Button`: primary, secondary, outline, ghost, and destructive actions
- `Input`: consistent text input treatment and disabled states
- `Card`: bounded content container
- `Badge`: compact status and metadata labels
- `Modal`: accessible overlay or mobile sheet structure
- `Skeleton`: loading placeholder
- `EmptyState`: reusable empty-result messaging and actions

Mobile also includes `ScreenHeader`, `LoadingState`, `ErrorState`, and `ThemeToggle` to
remove repeated screen-level presentation code.

## Theme Behavior

Mobile uses NativeWind class-based dark mode. The theme control is available on the
Profile screen and follows the device theme until manually changed for the current app
session.

Admin initializes from the saved browser preference or the operating-system preference.
The theme control is available in the global admin navigation and persists its selection
in local storage.

## Iconography

Use Lucide icons for interface actions and navigation:

- Mobile: `lucide-react-native`
- Admin: `lucide-react`

Use familiar symbols for navigation, edit, delete, filtering, external links, and theme
controls. Icon-only buttons must include an accessible label and tooltip where supported.

## Usage Rules

- Keep data fetching and mutations in existing hooks and services.
- Pass callbacks and state into design-system components.
- Do not add API calls or navigation logic to `components/ui`.
- Use `Button` for commands and `Badge` for non-interactive statuses.
- Use `EmptyState` for empty collections and `ErrorState` for recoverable mobile errors.
- Use semantic token classes such as `bg-background`, `text-foreground`, and
  `border-border`; avoid new hard-coded neutral palettes.
- Keep cards limited to individual records, summaries, forms, and modals. Do not nest
  cards or turn full page sections into floating cards.

## Locations

- Mobile primitives: `frontend/src/components/ui`
- Admin primitives: `admin/src/components/ui`
