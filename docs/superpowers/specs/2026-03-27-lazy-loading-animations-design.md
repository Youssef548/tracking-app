# Lazy Loading & UI Animations Design

## Overview

Add lazy loading with skeleton fallbacks, page crossfade transitions, animated modals, staggered content entrance, and progress bar/ring animations to The Mindful Flow habit tracker. The goal is to eliminate hard cuts and instant renders in favor of a smooth, polished UX that matches the app's zen/mindful aesthetic.

## Decisions

- **Animation style:** Smooth & subtle (gentle fades, soft slides, minimal movement)
- **Loading states:** Skeleton screens with shimmer effect
- **Modal animation:** Fade + scale (95%→100% on enter, reverse on exit)
- **Page transitions:** Crossfade with subtle slide-up between routes
- **Animation library:** Framer Motion (~32KB gzipped)

## Architecture

All animation logic lives in the client package (`packages/client`). No server changes. Framer Motion is the single animation dependency. Reusable animation components (`PageTransition`, `AnimatedList`, skeleton components) prevent duplication across pages.

## Section 1: Lazy Loading + Suspense with Skeleton Fallbacks

### Changes to `App.jsx`

Convert all 6 page imports from direct imports to `React.lazy()`:

```jsx
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Habits = lazy(() => import('./pages/Habits'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
```

Each lazy page is wrapped in `<Suspense fallback={<PageSkeleton />}>`.

### Skeleton Components

New directory: `components/skeletons/`

| Component | Layout |
|-----------|--------|
| `DashboardSkeleton` | Greeting bar + 4 habit card placeholders (stacked) + weekly ring circle placeholder on right |
| `CalendarSkeleton` | Month header + 7-column × 5-row grid of square day cell placeholders |
| `AnalyticsSkeleton` | Score card placeholder + wide chart block + 3 bar rows |
| `HabitsSkeleton` | Header + 3-column grid of card placeholders |
| `AuthSkeleton` | Centered form card placeholder (shared for Login and Register) |

### Shimmer Animation

Pure CSS — no Framer Motion needed for skeletons. A single `@keyframes shimmer` animation in `main.css` that all skeleton elements share via a `.skeleton` utility class:

```css
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton {
  background: linear-gradient(90deg, #eaeff2 25%, #f0f4f7 50%, #eaeff2 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8px;
}
```

## Section 2: Page Crossfade Transitions

### `PageTransition` Component

New file: `components/PageTransition.jsx`

Wraps each route's content with a `<motion.div>` that fades and slides on enter/exit:

- **Initial state:** `opacity: 0, y: 8`
- **Animate to:** `opacity: 1, y: 0` over 200ms
- **Exit:** `opacity: 0` over 150ms
- **Easing:** ease-out

### Integration with Routes

`AnimatePresence mode="wait"` wraps `<Routes>` in `App.jsx`. The `location` key ensures transitions fire on route change. Each route element is wrapped: `<PageTransition><Dashboard /></PageTransition>`.

## Section 3: Modal Animations (Fade + Scale)

### Changes to `HabitModal.jsx`

Replace the current `if (!open) return null` pattern with `AnimatePresence` controlling mount/unmount.

**Backdrop animation:**
- Enter: `opacity: 0 → 1` over 200ms
- Exit: `opacity: 1 → 0` over 150ms

**Modal panel animation:**
- Enter: `opacity: 0, scale: 0.95` → `opacity: 1, scale: 1` over 250ms, ease-out
- Exit: `opacity: 1, scale: 1` → `opacity: 0, scale: 0.95` over 150ms

The modal component always renders but `AnimatePresence` controls visibility. The `open` prop determines whether the inner `motion.div` elements are in the React tree.

## Section 4: Content Animations Within Pages

### `AnimatedList` Component

New file: `components/AnimatedList.jsx`

A reusable wrapper that staggers its children's entrance animations. Each child gets:
- **Initial:** `opacity: 0, y: 12`
- **Animate:** `opacity: 1, y: 0`
- **Stagger delay:** 50ms between each child
- **Duration:** 300ms per item, ease-out

### Per-Page Usage

| Page | What animates | What does NOT animate |
|------|--------------|----------------------|
| Dashboard | Habit cards stagger in; weekly summary section fades in | Nav bars |
| Habits | Habit grid cards stagger in | Nav bars |
| Calendar | `DayDetailPanel` slides in from right on day selection (fade + translateX) | Calendar grid cells (too many, would be noisy) |
| Analytics | Stat cards and chart blocks stagger in | Nav bars |
| Login/Register | Form card fades in as a single unit | Individual form inputs |

### DayDetailPanel Animation

The `DayDetailPanel` sidebar on the Calendar page animates on day selection (not page load):
- Enter: `opacity: 0, x: 20` → `opacity: 1, x: 0` over 250ms
- The animation re-triggers when a different day is selected (keyed by selected date)

## Section 5: Progress Bar & Ring Animations

### Progress Bars

Habit cards and analytics bars animate their width from `0%` to the actual percentage on initial mount. Implementation: set initial width to 0 via Framer Motion `initial`, animate to target `width` over 500ms with ease-out. Only triggers on first mount — React Query refetches do not re-trigger.

### ProgressRing (SVG Circle)

The `ProgressRing` component's SVG `stroke-dashoffset` animates from full circumference (empty circle) to the target offset over 800ms with ease-out. Uses Framer Motion's `motion.circle` element to animate the `strokeDashoffset` attribute.

### Trigger Behavior

Animations trigger on mount only. Subsequent data updates (React Query refetches, prop changes) do NOT re-trigger the animation — the component smoothly reflects the new value without replaying the entrance animation.

## Files Summary

### New Files
- `components/PageTransition.jsx` — page crossfade wrapper
- `components/AnimatedList.jsx` — staggered list animation wrapper
- `components/skeletons/DashboardSkeleton.jsx`
- `components/skeletons/CalendarSkeleton.jsx`
- `components/skeletons/AnalyticsSkeleton.jsx`
- `components/skeletons/HabitsSkeleton.jsx`
- `components/skeletons/AuthSkeleton.jsx`

### Modified Files
- `App.jsx` — lazy imports, Suspense boundaries, AnimatePresence + PageTransition
- `main.css` — shimmer keyframes and `.skeleton` utility class
- `HabitModal.jsx` — AnimatePresence wrapper for fade+scale enter/exit
- `HabitCard.jsx` — progress bar width animation (initial: 0, animate to target)
- `ProgressRing.jsx` — stroke-dashoffset animation on mount
- `DayDetailPanel.jsx` — fade+slide animation on day selection
- `Dashboard.jsx` — wrap habit cards list with AnimatedList
- `Habits.jsx` — wrap habit grid with AnimatedList
- `Analytics.jsx` — wrap stat cards and chart blocks with AnimatedList
- `Login.jsx` — fade-in wrapper on form card
- `Register.jsx` — fade-in wrapper on form card
- `package.json` — add `framer-motion` dependency

## What This Does NOT Include

- Dark mode toggle animation (not requested)
- Notification dropdown animation (not requested — could be added later)
- FAB (floating action button) animation (already has Tailwind `hover:scale-105`)
- Route-based code splitting for non-page modules (YAGNI — pages are the chunking boundary)
- Reduced motion / `prefers-reduced-motion` media query support (can be added later if needed)
