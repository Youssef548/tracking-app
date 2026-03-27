# Weekly Tracking & Categories Design

## Overview

Add weekly consistency tracking with discipline scores, user-created habit categories, and hybrid tracking (checkmark + duration-based habits) to The Mindful Flow habit tracker. The goal is to transform the app from simple daily tracking into a structured weekly planning and discipline system.

## Decisions

- **Tracking type:** Hybrid — habits are either checkmark (done/not done) or duration (hours logged per day)
- **Discipline metric:** Completion rate — percentage of habits completed per day. A day is "disciplined" (100%) when all scheduled habits are done.
- **Categories:** User-created with custom name and color. Habits optionally belong to a category.
- **Duration display in table:** Horizontal mini bars with hours label above each cell
- **Consistency table layout:** Habit rows table — each habit is a row, days are columns, with column grid lines for readability
- **Category display on cards:** Colored badge/chip on each habit card
- **Page location:** New dedicated "Weekly" page in navigation (5th nav item)

## Architecture

### Data Model Changes

**New model: Category**
- `name` (String, required, max 50 chars, trimmed)
- `color` (String, required — hex color like `#8b5cf6`)
- `userId` (ObjectId ref to User, required, indexed)
- `timestamps` (auto)
- Unique compound index on `{ userId, name }` to prevent duplicate category names per user

**Habit model additions:**
- `categoryId` (ObjectId ref to Category, optional — `null` means uncategorized)
- `trackingType` (String, enum `['checkmark', 'duration']`, default `'checkmark'`)
- `weeklyTarget` (Number, min 1, max 168 — total weekly hours target, used only when `trackingType === 'duration'`)

**Completion model — no schema changes:**
- The existing `value` field (Number, default 1) is already dual-purpose: for checkmark habits it stays 1, for duration habits it stores hours logged (e.g., 2.5). The existing `{ habitId, date }` unique index prevents duplicate entries per habit per day.

**Shared constants additions:**
- `TRACKING_TYPES = { CHECKMARK: 'checkmark', DURATION: 'duration' }`
- `CATEGORY_COLORS` — array of 10 preset hex colors for the color picker: `['#8b5cf6', '#22c55e', '#f59e0b', '#3b82f6', '#ef4444', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16']`

**Shared validation additions:**
- `validateCategoryInput(data)` — validates name (required, max 50) and color (required, valid hex)
- Update `validateHabitInput(data)` — accept optional `categoryId`, `trackingType`, `weeklyTarget` (required and >= 1 when trackingType is duration)

### API Changes

**New routes: `/api/categories`**
- `GET /api/categories` — list all categories for authenticated user
- `POST /api/categories` — create category (name, color)
- `PUT /api/categories/:id` — update category (name, color)
- `DELETE /api/categories/:id` — hard delete category (sets `categoryId = null` on associated habits)

**Modified routes:**
- `POST /api/habits` — accept `categoryId`, `trackingType`, `weeklyTarget`
- `PUT /api/habits/:id` — accept `categoryId`, `trackingType`, `weeklyTarget`
- `GET /api/habits` — populate `categoryId` field (return category name + color with each habit)

**New route: `/api/analytics/weekly-consistency`**
- `GET /api/analytics/weekly-consistency?week=2026-03-23` — returns structured data for the weekly consistency table
- Query param `week` is the Monday of the desired week (ISO date string)
- Response shape:
```json
{
  "weekStart": "2026-03-23",
  "weekEnd": "2026-03-29",
  "habits": [
    {
      "habitId": "...",
      "name": "Prayer",
      "icon": "self_improvement",
      "trackingType": "checkmark",
      "category": { "name": "Religion", "color": "#8b5cf6" },
      "days": {
        "Mon": { "completed": true, "value": 1 },
        "Tue": { "completed": true, "value": 1 },
        "Wed": { "completed": false, "value": 0 },
        ...
      },
      "rate": 0.83
    },
    {
      "habitId": "...",
      "name": "Study",
      "icon": "menu_book",
      "trackingType": "duration",
      "weeklyTarget": 8,
      "category": { "name": "Fundamentals", "color": "#f59e0b" },
      "days": {
        "Mon": { "completed": true, "value": 2 },
        "Tue": { "completed": true, "value": 1.5 },
        ...
      },
      "totalHours": 8,
      "rate": 1.0
    }
  ],
  "dailyScores": {
    "Mon": 1.0,
    "Tue": 0.67,
    ...
  },
  "overallScore": 0.78
}
```

### Server File Structure

**New files:**
- `packages/server/src/models/Category.js`
- `packages/server/src/controllers/categoriesController.js`
- `packages/server/src/routes/categories.js`

**Modified files:**
- `packages/server/src/models/Habit.js` — add `categoryId`, `trackingType`, `weeklyTarget`
- `packages/server/src/controllers/habitsController.js` — handle new fields, populate categoryId
- `packages/server/src/controllers/analyticsController.js` — add `weeklyConsistency` endpoint
- `packages/server/src/routes/analytics.js` — add GET `/weekly-consistency`
- `packages/server/src/index.js` (or app.js) — mount `/api/categories` routes
- `packages/shared/constants.js` — add `TRACKING_TYPES`, `CATEGORY_COLORS`
- `packages/shared/validation.js` — add `validateCategoryInput`, update `validateHabitInput`

## Section 1: Categories System

### Category Management UI

On the **Habits page**, a new "Categories" section appears above the habit grid:
- Row of category chips showing: colored dot + name + habit count
- "+ New Category" button opens a small modal/dialog
- Clicking a category chip opens edit mode (rename, change color, delete)
- Category creation modal: name input + color picker (10 preset hex colors in a grid)

### Category on Habit Cards

Each habit card displays a colored badge/chip below the habit name:
- Pill-shaped: category color as background (10% opacity), category color as text
- e.g., light purple background with purple "Religion" text
- Uncategorized habits show no badge

### Category in Habit Modal

The HabitModal gets a new "Category" dropdown field:
- Dropdown listing all user categories (colored dot + name)
- "None" option for uncategorized
- Positioned after the Name field, before Frequency

## Section 2: Hybrid Tracking (Checkmark + Duration)

### Habit Modal Changes

New "Tracking Type" toggle after the Category dropdown:
- Two-option segmented control: "Checkmark" | "Duration"
- Default: Checkmark
- When Duration is selected, show "Weekly Target (hours)" number input (min 1, max 168)
- The existing Frequency field is hidden when Duration is selected (duration habits are always weekly by nature)

### Completion Logging for Duration Habits

On the **Dashboard**, when a duration habit's toggle button is clicked:
- Instead of instant toggle, show a small popover/input asking "How many hours?"
- Number input with 0.5 step (e.g., 0.5, 1, 1.5, 2...)
- Submit logs a completion with `value` = hours entered
- If a completion already exists for that day, clicking again deletes it (same as checkmark)

### Habit Card Changes for Duration Habits

- Progress bar shows `totalHoursThisWeek / weeklyTarget` ratio
- The checkmark icon is replaced with a hours counter (e.g., "6/8h")
- Category badge shown below name

## Section 3: Weekly Consistency Page

### Navigation

- New nav item "Weekly" added between "Analytics" and "Habits" in both TopNavBar and BottomNavBar
- Icon: `calendar_view_week`
- New lazy-loaded page: `pages/Weekly.jsx`
- New skeleton: `components/skeletons/WeeklySkeleton.jsx`

### Page Layout

**Top bar:**
- Week selector: left/right arrows + "Mar 23 – Mar 29, 2026" label
- Weekly discipline score badge on the right (e.g., "78%")

**Category filter chips:**
- "All" (active by default) + one chip per user category
- Clicking a category filters the table to show only habits in that category
- Active chip: filled with primary color. Inactive: outlined with category color.

**Consistency Table:**
- Grid with column lines (borders between columns for readability)
- Header row: Habit | Mon | Tue | Wed | Thu | Fri | Sat | Sun | Rate
- One row per habit:
  - Left column: habit icon + name + category badge
  - Checkmark habits: ✓ (green) or ✗ (red) per day, "—" for future/no-data
  - Duration habits: hours label (e.g., "2h") + horizontal mini bar below. Bar fills proportionally to max daily amount. Bar color matches category color.
  - Rate column: percentage for checkmark habits, "X/Yh" for duration habits
- Bottom summary row: "Day Discipline" — percentage per day + label (Perfect/Partial/Missed)
  - 100% = "Perfect" (green), 50-99% = "Partial" (amber), <50% = "Missed" (red)
  - Far-right cell: overall weekly score (bold, primary color)

**How discipline score is calculated for duration habits in the daily score:**
- A duration habit counts as "completed" for a given day if any hours were logged (value > 0). The daily discipline percentage = (habits completed that day) / (total active habits). This keeps the daily score simple and binary per habit.

**Week History section (below table):**
- Grid of 4 cards: This Week, Last Week, 2 Weeks Ago, 3 Weeks Ago
- Each card: date range, overall score (large number), 7 mini colored bars (one per day — green/amber/red)
- Clicking a past week card navigates the table to show that week's data
- Current week card has a blue border highlight

### Data Fetching

- New hook: `useWeeklyConsistency(weekStart)` — calls `GET /api/analytics/weekly-consistency?week={weekStart}`
- `weekStart` is always a Monday date string
- Week navigation updates the `weekStart` state, triggering a refetch

## Section 4: Integration with Existing Pages

### Dashboard

- Duration habit cards show "X/Yh" progress instead of checkmark
- Category badges appear on all habit cards
- Toggling a duration habit opens an hours input popover instead of instant toggle

### Habits Page

- Category management section at the top
- Category badges on all habit grid cards
- Habit modal includes category dropdown and tracking type fields

### Other Pages

- Calendar, Analytics: No changes needed. They continue to work with completions as before. The `value` field on completions already supports numeric values.

## Files Summary

### New Files
- `packages/server/src/models/Category.js`
- `packages/server/src/controllers/categoriesController.js`
- `packages/server/src/routes/categories.js`
- `packages/client/src/pages/Weekly.jsx`
- `packages/client/src/components/skeletons/WeeklySkeleton.jsx`
- `packages/client/src/components/CategoryModal.jsx`
- `packages/client/src/components/DurationInput.jsx` — popover for logging hours
- `packages/client/src/hooks/useCategories.js`
- `packages/client/src/hooks/useWeeklyConsistency.js`

### Modified Files
- `packages/shared/constants.js` — add TRACKING_TYPES, CATEGORY_COLORS
- `packages/shared/validation.js` — add validateCategoryInput, update validateHabitInput
- `packages/server/src/models/Habit.js` — add categoryId, trackingType, weeklyTarget
- `packages/server/src/controllers/habitsController.js` — handle new fields, populate category
- `packages/server/src/controllers/analyticsController.js` — add weeklyConsistency
- `packages/server/src/routes/analytics.js` — add weekly-consistency route
- `packages/server/src/index.js` — mount categories routes
- `packages/client/src/App.jsx` — add Weekly route + lazy import
- `packages/client/src/components/TopNavBar.jsx` — add Weekly nav link
- `packages/client/src/components/BottomNavBar.jsx` — add Weekly nav tab
- `packages/client/src/components/HabitModal.jsx` — add category dropdown, tracking type toggle, weekly target
- `packages/client/src/components/HabitCard.jsx` — category badge, duration display
- `packages/client/src/pages/Habits.jsx` — category management section
- `packages/client/src/pages/Dashboard.jsx` — duration habit toggle behavior
- `packages/client/src/hooks/useHabits.js` — update to handle new fields
- `packages/client/package.json` — no new dependencies needed (Framer Motion already installed)

## What This Does NOT Include

- Category-based analytics breakdown (could be added later to Analytics page)
- Drag-and-drop reordering of habits within categories
- Category icons (categories have color only, not custom icons)
- Multi-week trend charts or graphs
- Export/download of weekly data
- Habit archiving by category (bulk operations)
