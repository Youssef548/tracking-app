# MVP Completion — Design Specification

**Date:** 2026-03-28
**Scope:** Three features required to make The Mindful Flow ready for public users.

---

## Overview

The app is deployed and functional. Three gaps block a public-facing MVP:

1. **Notification triggers** — the bell UI exists but no server-side events ever create notifications
2. **Profile editing** — users can't change their name, email, or password
3. **Analytics time range** — only "this week" is shown; monthly data exists on the server but isn't surfaced

---

## Feature 1: Notification Triggers

### Trigger Events

| Event | Condition | Type | Title | Message |
|---|---|---|---|---|
| First habit created | `habits.count === 1` after POST | `achievement` | "You're on your way" | "Your first habit is set. Show up tomorrow and the streak begins." |
| First completion ever | `completions.count === 1` for user | `achievement` | "First check-in" | "Day one logged. That's the hardest one." |
| Streak milestone | streak hits 3, 7, 14, 30, 60, or 100 | `streak` | "🔥 X-day streak" | "You've completed all your habits for X days in a row." |
| Perfect week | all targets hit last week, detected on first completion of new week | `achievement` | "Perfect week" | "You hit every target last week. That's rare — keep it going." |

### Implementation

**Utility function:** `src/utils/createNotification.js` — accepts `(userId, type, title, message)`, inserts a Notification document, returns silently on error (fire-and-forget).

**Hook points:**
- `habitsController.createHabit` — after save, check `Habit.countDocuments({ userId, isActive: true })`. If count === 1, fire "first habit" notification.
- `completionsController.createCompletion` — after save:
  1. Check total completion count for user. If === 1, fire "first check-in".
  2. Call existing `streakCalculator` to get current streak. If streak is in `[3, 7, 14, 30, 60, 100]`, check deduplication and fire streak notification.
  3. Check if the completion's date is in a new week vs the previous completion. If so, calculate last week's score. If score === 100%, fire "perfect week" notification.

**Deduplication:** Before creating a streak or perfect-week notification, query for an existing notification with the same `userId`, `type`, and `title` created within the last 7 days. Skip if found. This prevents duplicate milestone fires.

**Error isolation:** All notification logic is wrapped in a try/catch. Notification failures must never cause the primary request (habit create, completion create) to fail.

---

## Feature 2: Profile Editing

### API

`PUT /api/auth/profile` — already defined in the original spec, not yet implemented.

**Request body** (all fields optional):
```json
{
  "name": "string (1–100 chars)",
  "email": "string (valid format, unique)",
  "currentPassword": "string (required when changing password)",
  "password": "string (≥6 chars, new password)"
}
```

**Validation rules** (added to shared `validation.js` and `.mjs`):
- `name`: trim, 1–100 chars
- `email`: valid email format; checked for uniqueness against other users (exclude current user's own email)
- Password change: `currentPassword` must be present and correct (bcrypt compare); new `password` ≥ 6 chars

**Response:** `{ user: { _id, name, email, createdAt } }` — same shape as login/register/me responses.

**Errors:**
- 400 — validation failure (field-level message)
- 400 — `currentPassword` wrong → `{ error: { message: 'Current password is incorrect', code: 'WRONG_PASSWORD' } }`
- 409 — email already taken → `{ error: { message: 'Email already in use', code: 'EMAIL_TAKEN' } }`

### UI — Settings Page

Remove the hardcoded `"Notifications: On"` row from the Account section.

Replace the read-only profile card with two editable cards:

**Profile card** (name + email):
- Displays current values
- "Edit" button toggles the card into edit mode (fields become inputs)
- "Save" calls `PUT /api/auth/profile` with changed fields only
- On success: updates AuthContext user, exits edit mode, shows inline "Saved" confirmation
- On error: shows inline field-level error message

**Security card** (password change):
- Always shows: `currentPassword` input + `newPassword` input + "Update Password" button
- On success: clears both fields, shows inline "Password updated"
- On error: shows inline error on the relevant field

Both cards use the existing Tailwind design tokens (rounded-3xl, surface-container-lowest, etc.) consistent with the current Settings style.

**AuthContext update:** After a successful profile save, update the `user` object in context with the returned user data so the nav avatar and greeting reflect the new name immediately.

---

## Feature 3: Analytics Time Range

### API Change

`GET /api/analytics/monthly` gains optional `?from=YYYY-MM-DD&to=YYYY-MM-DD` query params for the "Last 30 Days" rolling window. Without these params, it defaults to current calendar month (existing behavior preserved). The controller builds the date range from these params if present, otherwise falls back to `month`/`year` params.

### UI — Analytics Page

**Toggle:** Three pill buttons in the page header ("Week" / "Month" / "30 Days"). State: `const [view, setView] = useState('week')`.

**Week view** — unchanged from current layout:
- Weekly score card (large %)
- Consistency trend line chart
- Completed vs Target bar
- Habit breakdown cards (weekly rate per habit)
- Streak card

**Month / 30-day view:**
- Period score card (% of all targets hit in the period) — replaces weekly score card
- Calendar heatmap — daily completion % rendered as a color-intensity grid (reuse `CalendarGrid` coloring logic). Replaces the trend line chart.
- Completed vs Target bar — same component, recalculated for the period
- Habit breakdown cards — same component, rates recalculated for the period
- Streak card — unchanged (streak is user-level, not period-scoped)

**Data fetching:**
- `view === 'week'` → `useWeeklyAnalytics()` (existing hook, no change)
- `view === 'month'` → `useMonthlyAnalytics(currentMonth, currentYear)` (existing hook, no change)
- `view === '30days'` → new `useLast30DaysAnalytics()` hook calling `/api/analytics/monthly?from=...&to=...`

**Period score calculation:** For month/30-day views, the server returns `{ days: [{ date, completions[] }] }`. Period score is derived client-side: sum completions / sum of (active habits × days in period) × 100. This avoids a new server endpoint.

---

## What Is Not In Scope

- Account deletion
- Browser push notifications or email reminders
- Notification preferences toggle
- Per-habit analytics detail page (`/analytics/habits/:id`)
- Frontend unit tests (Vitest + RTL)
- Completion notes UI

---

## Files Affected

### Server
- `src/utils/createNotification.js` — new utility
- `src/controllers/habitsController.js` — add trigger after createHabit
- `src/controllers/completionsController.js` — add triggers after createCompletion
- `src/controllers/authController.js` — implement updateProfile
- `src/routes/auth.js` — add PUT /profile route
- `packages/shared/validation.js` + `validation.mjs` — add profile validation rules

### Client
- `src/pages/Settings.jsx` — profile edit form + password change form
- `src/pages/Analytics.jsx` — view toggle + month/30-day layout
- `src/hooks/useAnalytics.js` — add useLast30DaysAnalytics hook
- `src/context/AuthContext.jsx` — expose updateUser or refresh after profile save
