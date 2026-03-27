# Dark Mode Design Specification

## Overview

Add Light / Dark / Auto theme support to The Mindful Flow. The toggle lives on a new `/settings` page. Preference is persisted to `localStorage`. Implementation uses CSS custom properties so zero component files need dark-mode changes.

## Decisions

- **Toggle location:** New `/settings` page (linked from ⚙️ icon in TopNavBar and bottom nav)
- **Options:** Light / Dark / Auto (Auto follows `prefers-color-scheme`)
- **Persistence:** `localStorage` key `theme` — values `'light' | 'dark' | 'auto'`
- **Implementation strategy:** CSS custom properties — all color tokens become CSS vars, `.dark` class on `<html>` overrides them. Zero changes to page/component files.
- **Animation library:** No change — Framer Motion already in place; no toggle animation needed

## Architecture

### 1. CSS Custom Properties (`main.css`)

All 20+ color tokens are defined as CSS variables under `:root` (light values). A `.dark` selector overrides every token with the dark palette. The existing `.skeleton` shimmer class gets a `.dark .skeleton` override with dark-appropriate gradient colors.

`:root` defines light values. `.dark` overrides with dark values. No JavaScript needed to swap individual colors — toggling a single class on `<html>` is sufficient.

### 2. Tailwind Config (`tailwind.config.js`)

All hardcoded hex values in `theme.extend.colors` are replaced with `var(--color-*)` references. After this change, every existing Tailwind utility class (`bg-surface`, `text-on-surface`, `border-outline-variant`, etc.) automatically reflects whichever theme is active.

### 3. ThemeContext (`src/context/ThemeContext.jsx`)

Manages `'light' | 'dark' | 'auto'` state.

**On mount:**
1. Read `localStorage.getItem('theme')` — default to `'auto'` if not set
2. Apply initial theme (see applyTheme below)
3. Register `matchMedia('(prefers-color-scheme: dark)')` change listener for auto mode

**`applyTheme(value)`:**
- `'light'` → remove `dark` class from `<html>`
- `'dark'` → add `dark` class to `<html>`
- `'auto'` → add/remove `dark` class based on `window.matchMedia('(prefers-color-scheme: dark)').matches`; register listener to update on OS change

**`setTheme(value)`:**
- Save to `localStorage`
- Call `applyTheme(value)`
- Update state

Exposes `{ theme, setTheme }` via context.

### 4. Settings Page (`src/pages/Settings.jsx`)

Route: `/settings`

Three sections:

**Profile card** — avatar circle (first letter of name), display name, email. Read-only, sourced from `useAuth()`.

**Appearance section** — three equal-width buttons: ☀️ Light / 🌙 Dark / 💻 Auto. Active option has `border-primary` and `bg-primary/10` (light) or `border-primary bg-primary/15` (dark). Below the buttons: small helper text "Auto follows your device's system setting."

**Account section** — Notifications row (static display for now), Sign Out button (red-tinted, calls `logout()` from `useAuth()`).

### 5. Navigation Changes

**TopNavBar** — add ⚙️ `settings` icon button (NavLink to `/settings`) between the notification bell and the avatar. Remove the standalone logout button — logout moves to the Settings page.

**BottomNavBar** — replace the "Weekly" tab (`/weekly`, `calendar_view_week` icon) with a "Settings" tab (`/settings`, `settings` icon). The weekly view remains accessible from the top nav on desktop.

**App.jsx** — wrap root with `<ThemeProvider>`, add `<Route path="/settings" element={<PageTransition><Settings /></PageTransition>} />`. Settings is a protected route (same as all other pages).

## Color Palette

### Light (`:root`)

| Token | Value |
|-------|-------|
| `--color-primary` | `#005bc4` |
| `--color-primary-container` | `#4388fd` |
| `--color-primary-dim` | `#004fad` |
| `--color-secondary` | `#006d4a` |
| `--color-secondary-container` | `#6ffbbe` |
| `--color-secondary-dim` | `#005f40` |
| `--color-tertiary` | `#bd0c3b` |
| `--color-tertiary-container` | `#fc4563` |
| `--color-tertiary-fixed-dim` | `#ea3858` |
| `--color-surface` | `#f7f9fb` |
| `--color-surface-bright` | `#f7f9fb` |
| `--color-surface-dim` | `#d4dbdf` |
| `--color-surface-container` | `#eaeff2` |
| `--color-surface-container-low` | `#f0f4f7` |
| `--color-surface-container-high` | `#e3e9ed` |
| `--color-surface-container-highest` | `#dce4e8` |
| `--color-surface-container-lowest` | `#ffffff` |
| `--color-on-surface` | `#2c3437` |
| `--color-on-surface-variant` | `#596064` |
| `--color-on-primary` | `#f9f8ff` |
| `--color-on-secondary` | `#e6ffee` |
| `--color-on-tertiary` | `#fff7f6` |
| `--color-on-primary-container` | `#000311` |
| `--color-on-secondary-container` | `#005e3f` |
| `--color-outline` | `#747c80` |
| `--color-outline-variant` | `#acb3b7` |
| `--color-error` | `#a83836` |
| `--color-error-container` | `#fa746f` |
| `--color-on-error` | `#fff7f6` |
| `--color-background` | `#f7f9fb` |
| `--color-on-background` | `#2c3437` |

### Dark (`.dark`)

| Token | Value |
|-------|-------|
| `--color-primary` | `#adccff` |
| `--color-primary-container` | `#0044a3` |
| `--color-primary-dim` | `#8ab4f8` |
| `--color-secondary` | `#66dba9` |
| `--color-secondary-container` | `#005337` |
| `--color-secondary-dim` | `#4ec994` |
| `--color-tertiary` | `#ffb3b8` |
| `--color-tertiary-container` | `#7a0020` |
| `--color-tertiary-fixed-dim` | `#ff8a93` |
| `--color-surface` | `#0f1719` |
| `--color-surface-bright` | `#1e2a2e` |
| `--color-surface-dim` | `#090e10` |
| `--color-surface-container` | `#1a2428` |
| `--color-surface-container-low` | `#141e22` |
| `--color-surface-container-high` | `#222c30` |
| `--color-surface-container-highest` | `#2a3438` |
| `--color-surface-container-lowest` | `#090e10` |
| `--color-on-surface` | `#dde4e8` |
| `--color-on-surface-variant` | `#8fa3aa` |
| `--color-on-primary` | `#00315c` |
| `--color-on-secondary` | `#00382a` |
| `--color-on-tertiary` | `#4a0014` |
| `--color-on-primary-container` | `#d6e3ff` |
| `--color-on-secondary-container` | `#89f8c7` |
| `--color-outline` | `#596064` |
| `--color-outline-variant` | `#2a3438` |
| `--color-error` | `#ffb4ab` |
| `--color-error-container` | `#7a0020` |
| `--color-on-error` | `#4a0014` |
| `--color-background` | `#0f1719` |
| `--color-on-background` | `#dde4e8` |

## Files Changed

### New files
| File | Purpose |
|------|---------|
| `packages/client/src/context/ThemeContext.jsx` | Theme state, localStorage, `dark` class on `<html>` |
| `packages/client/src/pages/Settings.jsx` | Settings page with theme toggle and sign out |

### Modified files
| File | Change |
|------|--------|
| `packages/client/src/main.css` | CSS vars under `:root` and `.dark`; dark skeleton override |
| `packages/client/tailwind.config.js` | Hex → `var(--color-*)` for all colors |
| `packages/client/src/App.jsx` | Add `ThemeProvider` wrapper, add `/settings` route with lazy import |
| `packages/client/src/components/TopNavBar.jsx` | Add gear icon → `/settings`; remove logout button |
| `packages/client/src/components/BottomNavBar.jsx` | Replace "Weekly" tab with "Settings" tab |
| `packages/client/src/components/HabitCard.jsx` | Replace hardcoded hex in `barColors` with `var(--color-*)` |

**Total: 2 new + 6 modified.**

## Special Cases

### `bg-white/80` in TopNavBar
TopNavBar uses `bg-white/80` directly (not a token). This must be changed to `bg-surface-container-lowest/80` so the blur-backdrop header picks up the dark surface color.

### `barColors` in HabitCard
`HabitCard.jsx` has a hardcoded `barColors` object (`#005bc4`, `#006d4a`, `#bd0c3b`) used as `style={{ backgroundColor: barColor }}`. Inline styles bypass Tailwind and CSS vars, so these dark colors would be nearly invisible on dark backgrounds. Fix: replace the hex values with CSS variable references — `var(--color-primary)`, `var(--color-secondary)`, `var(--color-tertiary)` — which work in inline styles and automatically pick up dark palette values. HabitCard.jsx is added to the modified files list.

### Skeleton shimmer
`.skeleton` in `main.css` uses hardcoded hex gradient values `#eaeff2` / `#f0f4f7`. A `.dark .skeleton` rule will override these with dark equivalents: `#1a2428` / `#222c30`.

## What This Does NOT Include

- Per-habit color overrides for dark mode (accent colors remain the same)
- Profile editing on the Settings page (name/avatar — that's a separate feature)
- Notification settings toggle (display only for now)
- Animated theme transition (no crossfade when switching — instant swap is fine)
- Dark mode screenshots in README (can regenerate with `capture-screenshots.js` after implementation)
