# Mindful Flow — UX Redesign Spec
**Date:** 2026-03-29
**Status:** Approved

## Background

Youssef has been manually tracking weekly goals in Obsidian: a table of activities (Gym, Religion, Tech, Fundamentals, Project, Soft Skills) with targets per week, daily check-ins in a Day × Activity grid, and a weekly review. The original goal was to automate this flow. The current app built a generic habit tracker that doesn't replicate this weekly planning workflow. This redesign rebuilds the frontend UX to match the Obsidian flow while keeping the existing backend models (Habit, Completion, Category, User) intact.

---

## Screen Structure

5 screens via bottom nav:

| Screen | Icon | Purpose |
|---|---|---|
| **Week** | 📅 | Primary screen — compact Day × Activity grid |
| **Month** | 📋 | Monthly goal checklists per habit + habit management |
| **Review** | 🧠 | Weekly reflection with totals vs targets |
| **Analytics** | 📊 | Existing analytics (unchanged) |
| **Settings** | ⚙ | Existing settings (unchanged) |

Replaces: Dashboard, Calendar, Habits screens.

---

## Screen 1: Week (Primary / Home)

The compact table grid, modelled on the Obsidian tracker.

### Header
- Week label: "Week of Mar 24" with ← → navigation
- "Set up this week" button (opens weekly setup modal)

### Grid
- **Rows** = habits (emoji + name)
- **Columns** = Sat, Sun, Mon, Tue, Wed, Thu, Fri + "Done" (actual/target)
- Friday column = always 🍹 (rest day, non-interactive)
- Cell states:
  - `✓` — completed
  - `✗` — explicitly skipped/missed
  - `–` — not scheduled (day not in this habit's weekly plan)
  - empty — future day (not yet actionable)
- **Tap cell** → toggle completion (logs/removes a Completion record)
- **Long-press cell** → add note to that completion
- **"Done" column** → shows `actual / target` for the week, colored green/amber/red based on progress

### Footer
- Overall weekly score % (completions / total scheduled sessions)
- "Write Review" button → navigates to Review screen

### Weekly Setup Modal
Triggered by "Set up this week" button. Opens once per week (auto-prompts on first visit to Week screen each new week).

- One row per habit: habit name + target days input (pre-filled from habit default)
- Week note field: free text (e.g. "Hip flexor rehab — no gym this week")
- Save → creates/updates a `WeeklyPlan` record for this week
- If user skips setup, defaults to habit targets with no week note

---

## Screen 2: Month

Two tabs.

### Tab 1: This Month's Goals
- Month label + ← → navigation
- One expandable card per habit (collapsed by default, expanded on tap)
- Each card shows:
  - Habit emoji + name + color
  - `X/Y done` count
  - Checklist of items (tap to tick off)
  - `+` button to add a new item inline
  - Swipe-to-delete on items
- Items persist as `MonthlyGoalItem` records for that `habitId` + `monthKey`
- On new month: items are NOT auto-carried over. User starts fresh (or can copy from previous month via a "Copy from last month" button on the card)

### Tab 2: Habits
- Existing habit management UI (create, edit, delete habits)
- Set default weekly target, icon, color, category
- No changes to underlying logic

---

## Screen 3: Review

Weekly reflection screen.

### Totals Table (read-only, auto-calculated)
| Activity | Done | Target | % |
|---|---|---|---|
| Per habit row | from Completions | from WeeklyPlan (or habit default) | done/target |
| **Overall** | sum | sum | overall % |

### Reflection Section
Three free-text fields:
1. What did I do well?
2. What do I want to improve?
3. Any changes for next week?

### Week Context
Displays the `weekNote` from the WeeklyPlan (if set), as read-only context above the reflection fields.

### History
- Week navigation (← →) to browse past reviews
- Past reviews are read-only once a new week starts

---

## Backend: New Collections

### `WeeklyPlan`
```ts
{
  userId: ObjectId
  weekKey: string          // "2026-03-28" (date of the Saturday that starts the week)
  habitTargetOverrides: Array<{
    habitId: ObjectId
    targetDays: number     // 1–7
  }>
  weekNote: string         // optional, free text
  createdAt: Date
  updatedAt: Date
}
```
Unique index on `(userId, weekKey)`.

### `MonthlyGoalItem`
```ts
{
  userId: ObjectId
  habitId: ObjectId
  monthKey: string         // "2026-03"
  items: Array<{
    _id: ObjectId
    text: string
    completed: boolean
    order: number
  }>
  createdAt: Date
  updatedAt: Date
}
```
Unique index on `(userId, habitId, monthKey)`.

### `WeeklyReview`
```ts
{
  userId: ObjectId
  weekKey: string          // "2026-03-28" (date of the Saturday that starts the week)
  wentWell: string
  toImprove: string
  changesNextWeek: string
  totals: Array<{
    habitId: ObjectId
    habitName: string      // snapshot
    done: number
    target: number
  }>
  createdAt: Date
  updatedAt: Date
}
```
Unique index on `(userId, weekKey)`.

---

## Backend: New API Routes

All routes authenticated (`/api/...`):

| Method | Path | Purpose |
|---|---|---|
| GET | `/weekly-plans/:weekKey` | Get plan for a week |
| PUT | `/weekly-plans/:weekKey` | Create or update plan |
| GET | `/monthly-goals/:monthKey` | Get all habit checklists for a month |
| PUT | `/monthly-goals/:monthKey/:habitId` | Save checklist for a habit+month |
| GET | `/weekly-reviews/:weekKey` | Get review for a week |
| PUT | `/weekly-reviews/:weekKey` | Save/update review |

---

## Unchanged
- All existing Habit, Completion, Category, Notification, Analytics routes and models
- Auth system
- Analytics screen
- Settings screen
- TypeScript configuration, Turbo pipeline, Docker setup

---

## Key Constraints
- Week starts Saturday (matches Youssef's Obsidian tracker)
- Friday is always a rest day (non-trackable in the grid)
- Week key format: `YYYY-MM-DD` date of the Saturday that starts the week (e.g. "2026-03-28")
- No breaking changes to existing data — all existing completions and habits remain valid
