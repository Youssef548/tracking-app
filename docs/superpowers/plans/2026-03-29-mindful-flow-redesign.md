# Mindful Flow UX Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic daily-habit UI with a weekly-planner UX modelled on the user's Obsidian tracker — compact Day×Activity grid as home, monthly goal checklists, and a weekly review screen.

**Architecture:** Keep all existing Habit/Completion/Category/User models untouched. Add three new backend collections (WeeklyPlan, MonthlyGoalItem, WeeklyReview) with simple upsert routes. Replace the Dashboard, Calendar, Habits, and Weekly client pages with three new pages (WeekPage, MonthPage, ReviewPage) and update navigation accordingly.

**Tech Stack:** Express + Mongoose + TypeScript (server), React 19 + Vite + TailwindCSS + React Query (client), shared types via `@mindful-flow/shared/types`, Jest + Supertest + MongoMemoryServer (tests).

---

## File Map

### New server files
- `packages/server/src/models/WeeklyPlan.ts`
- `packages/server/src/models/MonthlyGoalItem.ts`
- `packages/server/src/models/WeeklyReview.ts`
- `packages/server/src/controllers/weeklyPlansController.ts`
- `packages/server/src/controllers/monthlyGoalsController.ts`
- `packages/server/src/controllers/weeklyReviewsController.ts`
- `packages/server/src/routes/weeklyPlans.ts`
- `packages/server/src/routes/monthlyGoals.ts`
- `packages/server/src/routes/weeklyReviews.ts`

### Modified server files
- `packages/server/src/index.ts` — register 3 new routes

### Modified shared files
- `packages/shared/src/types.ts` — add WeeklyPlan, MonthlyGoalItem, WeeklyReview types

### New client files
- `packages/client/src/utils/weekUtils.ts`
- `packages/client/src/hooks/useWeeklyPlan.ts`
- `packages/client/src/hooks/useMonthlyGoals.ts`
- `packages/client/src/hooks/useWeeklyReview.ts`
- `packages/client/src/pages/WeekPage.tsx`
- `packages/client/src/components/WeekSetupModal.tsx`
- `packages/client/src/pages/MonthPage.tsx`
- `packages/client/src/pages/ReviewPage.tsx`
- `packages/client/src/components/skeletons/WeekPageSkeleton.tsx`
- `packages/client/src/components/skeletons/MonthPageSkeleton.tsx`
- `packages/client/src/components/skeletons/ReviewPageSkeleton.tsx`

### Modified client files
- `packages/client/src/components/BottomNavBar.tsx`
- `packages/client/src/components/TopNavBar.tsx`
- `packages/client/src/App.tsx`

---

## Task 1: Add shared types

**Files:**
- Modify: `packages/shared/src/types.ts`

- [ ] **Step 1: Add new interfaces at the bottom of types.ts**

Open `packages/shared/src/types.ts`. Append these types after the last existing interface:

```typescript
export interface WeeklyPlanHabitOverride {
  habitId: string;
  targetDays: number;
}

export interface WeeklyPlan {
  _id: string;
  userId: string;
  weekKey: string; // "2026-03-28" — Saturday date that starts the week
  habitTargetOverrides: WeeklyPlanHabitOverride[];
  weekNote: string;
  createdAt: string;
  updatedAt: string;
}

export interface GoalItem {
  _id: string;
  text: string;
  completed: boolean;
  order: number;
}

export interface MonthlyGoalItem {
  _id: string;
  userId: string;
  habitId: string;
  monthKey: string; // "2026-03"
  items: GoalItem[];
  createdAt: string;
  updatedAt: string;
}

export interface TotalsEntry {
  habitId: string;
  habitName: string;
  done: number;
  target: number;
}

export interface WeeklyReview {
  _id: string;
  userId: string;
  weekKey: string; // "2026-03-28"
  wentWell: string;
  toImprove: string;
  changesNextWeek: string;
  totals: TotalsEntry[];
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 2: Rebuild shared package**

```bash
cd G:/personal/tracking-app
pnpm --filter @mindful-flow/shared build
```

Expected: `packages/shared/dist/` updated with no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/shared/src/types.ts packages/shared/dist
git commit -m "feat(shared): add WeeklyPlan, MonthlyGoalItem, WeeklyReview types"
```

---

## Task 2: WeeklyPlan backend

**Files:**
- Create: `packages/server/src/models/WeeklyPlan.ts`
- Create: `packages/server/src/controllers/weeklyPlansController.ts`
- Create: `packages/server/src/routes/weeklyPlans.ts`
- Modify: `packages/server/__tests__/api.test.ts`

- [ ] **Step 1: Write failing tests first**

Add this block at the bottom of `packages/server/__tests__/api.test.ts`, before the final closing brace (the file ends with no closing brace — just append at the end):

```typescript
// ─── WeeklyPlan ─────────────────────────────────────────────────────

describe('WeeklyPlan endpoints', () => {
  let wpToken: string;

  beforeAll(async () => {
    const result = await registerAndGetToken({
      name: 'WP User',
      email: 'wp@example.com',
      password: 'password123',
    });
    wpToken = result.token;
  });

  it('GET /weekly-plans/:weekKey — 404 when no plan exists', async () => {
    const res = await request(app)
      .get('/api/weekly-plans/2026-03-28')
      .set('Authorization', `Bearer ${wpToken}`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('PUT /weekly-plans/:weekKey — creates a plan', async () => {
    const res = await request(app)
      .put('/api/weekly-plans/2026-03-28')
      .set('Authorization', `Bearer ${wpToken}`)
      .send({ habitTargetOverrides: [], weekNote: 'Hip flexor week' });
    expect(res.status).toBe(200);
    expect(res.body.weekKey).toBe('2026-03-28');
    expect(res.body.weekNote).toBe('Hip flexor week');
    expect(res.body.habitTargetOverrides).toEqual([]);
  });

  it('GET /weekly-plans/:weekKey — returns existing plan', async () => {
    const res = await request(app)
      .get('/api/weekly-plans/2026-03-28')
      .set('Authorization', `Bearer ${wpToken}`);
    expect(res.status).toBe(200);
    expect(res.body.weekNote).toBe('Hip flexor week');
  });

  it('PUT /weekly-plans/:weekKey — updates plan (upsert)', async () => {
    const res = await request(app)
      .put('/api/weekly-plans/2026-03-28')
      .set('Authorization', `Bearer ${wpToken}`)
      .send({ habitTargetOverrides: [], weekNote: 'Updated note' });
    expect(res.status).toBe(200);
    expect(res.body.weekNote).toBe('Updated note');
  });

  it('GET /weekly-plans/:weekKey — 401 without token', async () => {
    const res = await request(app).get('/api/weekly-plans/2026-03-28');
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd packages/server && NODE_ENV=test npx jest --runInBand --forceExit --testNamePattern="WeeklyPlan"
```

Expected: FAIL — "Cannot find module" or 404 errors because routes don't exist yet.

- [ ] **Step 3: Create the model**

Create `packages/server/src/models/WeeklyPlan.ts`:

```typescript
import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IHabitTargetOverride {
  habitId: Types.ObjectId;
  targetDays: number;
}

export interface IWeeklyPlan {
  userId: Types.ObjectId;
  weekKey: string;
  habitTargetOverrides: IHabitTargetOverride[];
  weekNote: string;
  createdAt: Date;
  updatedAt: Date;
}

export type WeeklyPlanDocument = Document & IWeeklyPlan;

const WeeklyPlanSchema = new Schema<IWeeklyPlan>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    weekKey: { type: String, required: true },
    habitTargetOverrides: [
      {
        habitId: { type: Schema.Types.ObjectId, ref: 'Habit', required: true },
        targetDays: { type: Number, required: true, min: 1, max: 7 },
      },
    ],
    weekNote: { type: String, default: '' },
  },
  { timestamps: true },
);

WeeklyPlanSchema.index({ userId: 1, weekKey: 1 }, { unique: true });

export default mongoose.model<IWeeklyPlan>('WeeklyPlan', WeeklyPlanSchema);
```

- [ ] **Step 4: Create the controller**

Create `packages/server/src/controllers/weeklyPlansController.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import WeeklyPlan from '../models/WeeklyPlan';

export async function getWeeklyPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { weekKey } = req.params as { weekKey: string };
    const plan = await WeeklyPlan.findOne({ userId: req.user!._id, weekKey });
    if (!plan) {
      res.status(404).json({ error: { message: 'Weekly plan not found', code: 'NOT_FOUND' } });
      return;
    }
    res.json(plan);
  } catch (err) {
    next(err);
  }
}

export async function upsertWeeklyPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { weekKey } = req.params as { weekKey: string };
    const { habitTargetOverrides, weekNote } = req.body as {
      habitTargetOverrides?: { habitId: string; targetDays: number }[];
      weekNote?: string;
    };
    const plan = await WeeklyPlan.findOneAndUpdate(
      { userId: req.user!._id, weekKey },
      { $set: { habitTargetOverrides: habitTargetOverrides ?? [], weekNote: weekNote ?? '' } },
      { upsert: true, new: true },
    );
    res.json(plan);
  } catch (err) {
    next(err);
  }
}
```

- [ ] **Step 5: Create the route**

Create `packages/server/src/routes/weeklyPlans.ts`:

```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getWeeklyPlan, upsertWeeklyPlan } from '../controllers/weeklyPlansController';

const router = Router();
router.use(authenticate);
router.get('/:weekKey', getWeeklyPlan);
router.put('/:weekKey', upsertWeeklyPlan);

export default router;
```

- [ ] **Step 6: Run tests — expect pass**

```bash
cd packages/server && NODE_ENV=test npx jest --runInBand --forceExit --testNamePattern="WeeklyPlan"
```

Expected: all 5 WeeklyPlan tests PASS. (Routes not wired yet — you'll wire them all in Task 5.)

> **Note:** Tests will fail on "cannot GET" until Task 5. If tests pass already, the route was wired — skip Task 5 step for this route.

Actually, routes need to be in index.ts to be tested. Temporarily add to index.ts for testing:

Open `packages/server/src/index.ts` and add temporarily:

```typescript
import weeklyPlansRoutes from './routes/weeklyPlans';
// ...
app.use('/api/weekly-plans', weeklyPlansRoutes);
```

Rerun the tests — they should pass now.

- [ ] **Step 7: Commit**

```bash
git add packages/server/src/models/WeeklyPlan.ts packages/server/src/controllers/weeklyPlansController.ts packages/server/src/routes/weeklyPlans.ts packages/server/__tests__/api.test.ts packages/server/src/index.ts
git commit -m "feat(server): add WeeklyPlan model, controller, route, and tests"
```

---

## Task 3: MonthlyGoalItem backend

**Files:**
- Create: `packages/server/src/models/MonthlyGoalItem.ts`
- Create: `packages/server/src/controllers/monthlyGoalsController.ts`
- Create: `packages/server/src/routes/monthlyGoals.ts`
- Modify: `packages/server/__tests__/api.test.ts`

- [ ] **Step 1: Write failing tests**

Append to `packages/server/__tests__/api.test.ts`:

```typescript
// ─── MonthlyGoalItem ─────────────────────────────────────────────────

describe('MonthlyGoalItem endpoints', () => {
  let mgToken: string;

  beforeAll(async () => {
    const result = await registerAndGetToken({
      name: 'MG User',
      email: 'mg@example.com',
      password: 'password123',
    });
    mgToken = result.token;
  });

  const fakeHabitId = '507f1f77bcf86cd799439011';

  it('GET /monthly-goals/:monthKey — returns empty array when none exist', async () => {
    const res = await request(app)
      .get('/api/monthly-goals/2026-03')
      .set('Authorization', `Bearer ${mgToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('PUT /monthly-goals/:monthKey/:habitId — creates goal items', async () => {
    const items = [
      { text: 'Push-ups 3x20', completed: false, order: 0 },
      { text: 'Bulgarian split squat 3x10', completed: false, order: 1 },
    ];
    const res = await request(app)
      .put(`/api/monthly-goals/2026-03/${fakeHabitId}`)
      .set('Authorization', `Bearer ${mgToken}`)
      .send({ items });
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(2);
    expect(res.body.items[0].text).toBe('Push-ups 3x20');
    expect(res.body.monthKey).toBe('2026-03');
  });

  it('GET /monthly-goals/:monthKey — returns created goals', async () => {
    const res = await request(app)
      .get('/api/monthly-goals/2026-03')
      .set('Authorization', `Bearer ${mgToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].items).toHaveLength(2);
  });

  it('PUT /monthly-goals/:monthKey/:habitId — upserts (replaces items)', async () => {
    const items = [{ text: 'Push-ups 3x20', completed: true, order: 0 }];
    const res = await request(app)
      .put(`/api/monthly-goals/2026-03/${fakeHabitId}`)
      .set('Authorization', `Bearer ${mgToken}`)
      .send({ items });
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].completed).toBe(true);
  });

  it('GET /monthly-goals/:monthKey — 401 without token', async () => {
    const res = await request(app).get('/api/monthly-goals/2026-03');
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd packages/server && NODE_ENV=test npx jest --runInBand --forceExit --testNamePattern="MonthlyGoalItem"
```

Expected: FAIL.

- [ ] **Step 3: Create the model**

Create `packages/server/src/models/MonthlyGoalItem.ts`:

```typescript
import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IGoalItem {
  text: string;
  completed: boolean;
  order: number;
}

export interface IMonthlyGoalItem {
  userId: Types.ObjectId;
  habitId: Types.ObjectId;
  monthKey: string;
  items: IGoalItem[];
  createdAt: Date;
  updatedAt: Date;
}

export type MonthlyGoalItemDocument = Document & IMonthlyGoalItem;

const GoalItemSchema = new Schema<IGoalItem>(
  {
    text: { type: String, required: true, trim: true, maxlength: 200 },
    completed: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { _id: true },
);

const MonthlyGoalItemSchema = new Schema<IMonthlyGoalItem>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    habitId: { type: Schema.Types.ObjectId, ref: 'Habit', required: true },
    monthKey: { type: String, required: true },
    items: [GoalItemSchema],
  },
  { timestamps: true },
);

MonthlyGoalItemSchema.index({ userId: 1, habitId: 1, monthKey: 1 }, { unique: true });

export default mongoose.model<IMonthlyGoalItem>('MonthlyGoalItem', MonthlyGoalItemSchema);
```

- [ ] **Step 4: Create the controller**

Create `packages/server/src/controllers/monthlyGoalsController.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import MonthlyGoalItem from '../models/MonthlyGoalItem';

export async function getMonthlyGoals(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { monthKey } = req.params as { monthKey: string };
    const goals = await MonthlyGoalItem.find({ userId: req.user!._id, monthKey });
    res.json(goals);
  } catch (err) {
    next(err);
  }
}

export async function upsertMonthlyGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { monthKey, habitId } = req.params as { monthKey: string; habitId: string };
    const { items } = req.body as {
      items?: { text: string; completed: boolean; order: number }[];
    };
    const goal = await MonthlyGoalItem.findOneAndUpdate(
      { userId: req.user!._id, habitId, monthKey },
      { $set: { items: items ?? [] } },
      { upsert: true, new: true },
    );
    res.json(goal);
  } catch (err) {
    next(err);
  }
}
```

- [ ] **Step 5: Create the route**

Create `packages/server/src/routes/monthlyGoals.ts`:

```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getMonthlyGoals, upsertMonthlyGoal } from '../controllers/monthlyGoalsController';

const router = Router();
router.use(authenticate);
router.get('/:monthKey', getMonthlyGoals);
router.put('/:monthKey/:habitId', upsertMonthlyGoal);

export default router;
```

- [ ] **Step 6: Wire route temporarily in index.ts and run tests**

Add to `packages/server/src/index.ts`:

```typescript
import monthlyGoalsRoutes from './routes/monthlyGoals';
// ...
app.use('/api/monthly-goals', monthlyGoalsRoutes);
```

```bash
cd packages/server && NODE_ENV=test npx jest --runInBand --forceExit --testNamePattern="MonthlyGoalItem"
```

Expected: all 5 tests PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/server/src/models/MonthlyGoalItem.ts packages/server/src/controllers/monthlyGoalsController.ts packages/server/src/routes/monthlyGoals.ts packages/server/__tests__/api.test.ts packages/server/src/index.ts
git commit -m "feat(server): add MonthlyGoalItem model, controller, route, and tests"
```

---

## Task 4: WeeklyReview backend

**Files:**
- Create: `packages/server/src/models/WeeklyReview.ts`
- Create: `packages/server/src/controllers/weeklyReviewsController.ts`
- Create: `packages/server/src/routes/weeklyReviews.ts`
- Modify: `packages/server/__tests__/api.test.ts`

- [ ] **Step 1: Write failing tests**

Append to `packages/server/__tests__/api.test.ts`:

```typescript
// ─── WeeklyReview ────────────────────────────────────────────────────

describe('WeeklyReview endpoints', () => {
  let wrToken: string;

  beforeAll(async () => {
    const result = await registerAndGetToken({
      name: 'WR User',
      email: 'wr@example.com',
      password: 'password123',
    });
    wrToken = result.token;
  });

  it('GET /weekly-reviews/:weekKey — 404 when no review exists', async () => {
    const res = await request(app)
      .get('/api/weekly-reviews/2026-03-28')
      .set('Authorization', `Bearer ${wrToken}`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('PUT /weekly-reviews/:weekKey — creates a review', async () => {
    const res = await request(app)
      .put('/api/weekly-reviews/2026-03-28')
      .set('Authorization', `Bearer ${wrToken}`)
      .send({
        wentWell: 'Stayed consistent with fundamentals',
        toImprove: 'Need more tech time',
        changesNextWeek: 'Block 1hr for tech daily',
        totals: [{ habitId: '507f1f77bcf86cd799439011', habitName: 'Gym', done: 2, target: 3 }],
      });
    expect(res.status).toBe(200);
    expect(res.body.weekKey).toBe('2026-03-28');
    expect(res.body.wentWell).toBe('Stayed consistent with fundamentals');
    expect(res.body.totals).toHaveLength(1);
    expect(res.body.totals[0].done).toBe(2);
  });

  it('GET /weekly-reviews/:weekKey — returns existing review', async () => {
    const res = await request(app)
      .get('/api/weekly-reviews/2026-03-28')
      .set('Authorization', `Bearer ${wrToken}`);
    expect(res.status).toBe(200);
    expect(res.body.wentWell).toBe('Stayed consistent with fundamentals');
  });

  it('PUT /weekly-reviews/:weekKey — upserts (updates existing)', async () => {
    const res = await request(app)
      .put('/api/weekly-reviews/2026-03-28')
      .set('Authorization', `Bearer ${wrToken}`)
      .send({ wentWell: 'Even better', toImprove: '', changesNextWeek: '', totals: [] });
    expect(res.status).toBe(200);
    expect(res.body.wentWell).toBe('Even better');
  });

  it('GET /weekly-reviews/:weekKey — 401 without token', async () => {
    const res = await request(app).get('/api/weekly-reviews/2026-03-28');
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd packages/server && NODE_ENV=test npx jest --runInBand --forceExit --testNamePattern="WeeklyReview"
```

Expected: FAIL.

- [ ] **Step 3: Create the model**

Create `packages/server/src/models/WeeklyReview.ts`:

```typescript
import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITotalsEntry {
  habitId: Types.ObjectId;
  habitName: string;
  done: number;
  target: number;
}

export interface IWeeklyReview {
  userId: Types.ObjectId;
  weekKey: string;
  wentWell: string;
  toImprove: string;
  changesNextWeek: string;
  totals: ITotalsEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export type WeeklyReviewDocument = Document & IWeeklyReview;

const TotalsEntrySchema = new Schema<ITotalsEntry>(
  {
    habitId: { type: Schema.Types.ObjectId, ref: 'Habit', required: true },
    habitName: { type: String, required: true },
    done: { type: Number, required: true },
    target: { type: Number, required: true },
  },
  { _id: false },
);

const WeeklyReviewSchema = new Schema<IWeeklyReview>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    weekKey: { type: String, required: true },
    wentWell: { type: String, default: '' },
    toImprove: { type: String, default: '' },
    changesNextWeek: { type: String, default: '' },
    totals: [TotalsEntrySchema],
  },
  { timestamps: true },
);

WeeklyReviewSchema.index({ userId: 1, weekKey: 1 }, { unique: true });

export default mongoose.model<IWeeklyReview>('WeeklyReview', WeeklyReviewSchema);
```

- [ ] **Step 4: Create the controller**

Create `packages/server/src/controllers/weeklyReviewsController.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import WeeklyReview from '../models/WeeklyReview';

export async function getWeeklyReview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { weekKey } = req.params as { weekKey: string };
    const review = await WeeklyReview.findOne({ userId: req.user!._id, weekKey });
    if (!review) {
      res.status(404).json({ error: { message: 'Weekly review not found', code: 'NOT_FOUND' } });
      return;
    }
    res.json(review);
  } catch (err) {
    next(err);
  }
}

export async function upsertWeeklyReview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { weekKey } = req.params as { weekKey: string };
    const { wentWell, toImprove, changesNextWeek, totals } = req.body as {
      wentWell?: string;
      toImprove?: string;
      changesNextWeek?: string;
      totals?: { habitId: string; habitName: string; done: number; target: number }[];
    };
    const review = await WeeklyReview.findOneAndUpdate(
      { userId: req.user!._id, weekKey },
      {
        $set: {
          wentWell: wentWell ?? '',
          toImprove: toImprove ?? '',
          changesNextWeek: changesNextWeek ?? '',
          totals: totals ?? [],
        },
      },
      { upsert: true, new: true },
    );
    res.json(review);
  } catch (err) {
    next(err);
  }
}
```

- [ ] **Step 5: Create the route**

Create `packages/server/src/routes/weeklyReviews.ts`:

```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getWeeklyReview, upsertWeeklyReview } from '../controllers/weeklyReviewsController';

const router = Router();
router.use(authenticate);
router.get('/:weekKey', getWeeklyReview);
router.put('/:weekKey', upsertWeeklyReview);

export default router;
```

- [ ] **Step 6: Wire route and run tests**

Add to `packages/server/src/index.ts`:

```typescript
import weeklyReviewsRoutes from './routes/weeklyReviews';
// ...
app.use('/api/weekly-reviews', weeklyReviewsRoutes);
```

```bash
cd packages/server && NODE_ENV=test npx jest --runInBand --forceExit --testNamePattern="WeeklyReview"
```

Expected: all 5 tests PASS.

- [ ] **Step 7: Run all server tests to confirm nothing broken**

```bash
cd packages/server && NODE_ENV=test npx jest --runInBand --forceExit
```

Expected: all tests PASS (including original auth, habits, completions, etc.).

- [ ] **Step 8: Commit**

```bash
git add packages/server/src/models/WeeklyReview.ts packages/server/src/controllers/weeklyReviewsController.ts packages/server/src/routes/weeklyReviews.ts packages/server/__tests__/api.test.ts packages/server/src/index.ts
git commit -m "feat(server): add WeeklyReview model, controller, route, and tests"
```

---

## Task 5: Clean up index.ts route registration

The three routes were added incrementally in Tasks 2-4. This task ensures index.ts is clean and complete.

**Files:**
- Modify: `packages/server/src/index.ts`

- [ ] **Step 1: Verify index.ts has all three new routes**

Open `packages/server/src/index.ts`. Confirm all three imports and `app.use` calls are present and in order. The relevant section should look exactly like this:

```typescript
import weeklyPlansRoutes from './routes/weeklyPlans';
import monthlyGoalsRoutes from './routes/monthlyGoals';
import weeklyReviewsRoutes from './routes/weeklyReviews';

// ... (after the existing routes)
app.use('/api/weekly-plans', weeklyPlansRoutes);
app.use('/api/monthly-goals', monthlyGoalsRoutes);
app.use('/api/weekly-reviews', weeklyReviewsRoutes);
```

- [ ] **Step 2: Run full test suite one more time**

```bash
cd packages/server && NODE_ENV=test npx jest --runInBand --forceExit
```

Expected: all tests PASS.

- [ ] **Step 3: Commit if any changes made**

```bash
git add packages/server/src/index.ts
git commit -m "chore(server): finalize new route registrations in index.ts"
```

---

## Task 6: Client week utility functions

**Files:**
- Create: `packages/client/src/utils/weekUtils.ts`

- [ ] **Step 1: Create weekUtils.ts**

Create `packages/client/src/utils/weekUtils.ts`:

```typescript
/**
 * Week utilities for the Sat-start weekly planner.
 * Week key format: "YYYY-MM-DD" (the Saturday that starts the week).
 */

/** Returns the Saturday date string (YYYY-MM-DD) for the week containing `date`. */
export function getWeekKey(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const daysSinceSat = day === 6 ? 0 : day + 1;
  d.setDate(d.getDate() - daysSinceSat);
  return toDateString(d);
}

/** Returns the week key for today. */
export function getCurrentWeekKey(): string {
  return getWeekKey(new Date());
}

/** Returns an array of 7 dates: [Sat, Sun, Mon, Tue, Wed, Thu, Fri]. */
export function getWeekDays(weekKey: string): [Date, Date, Date, Date, Date, Date, Date] {
  const sat = new Date(weekKey + 'T00:00:00');
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sat);
    d.setDate(sat.getDate() + i);
    return d;
  }) as [Date, Date, Date, Date, Date, Date, Date];
}

/** "Mar 24" label for the Saturday that starts the week. */
export function formatWeekLabel(weekKey: string): string {
  const sat = new Date(weekKey + 'T00:00:00');
  return sat.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** "YYYY-MM" for month key. */
export function getMonthKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;

}

/** "March 2026" label from monthKey "2026-03". */
export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-') as [string, string];
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/** Week key for the previous week. */
export function prevWeekKey(weekKey: string): string {
  const d = new Date(weekKey + 'T00:00:00');
  d.setDate(d.getDate() - 7);
  return toDateString(d);
}

/** Week key for the next week. */
export function nextWeekKey(weekKey: string): string {
  const d = new Date(weekKey + 'T00:00:00');
  d.setDate(d.getDate() + 7);
  return toDateString(d);
}

/** Previous month key: "2026-03" → "2026-02". */
export function prevMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split('-') as [string, string];
  const d = new Date(Number(year), Number(month) - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Next month key: "2026-03" → "2026-04". */
export function nextMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split('-') as [string, string];
  const d = new Date(Number(year), Number(month), 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Format a Date as "YYYY-MM-DD". */
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Short day label for column headers. */
export const DAY_LABELS = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const;
```

- [ ] **Step 2: Commit**

```bash
git add packages/client/src/utils/weekUtils.ts
git commit -m "feat(client): add week utility functions (Sat-start week keys)"
```

---

## Task 7: New React Query hooks

**Files:**
- Create: `packages/client/src/hooks/useWeeklyPlan.ts`
- Create: `packages/client/src/hooks/useMonthlyGoals.ts`
- Create: `packages/client/src/hooks/useWeeklyReview.ts`

- [ ] **Step 1: Create useWeeklyPlan.ts**

Create `packages/client/src/hooks/useWeeklyPlan.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import type { WeeklyPlan, WeeklyPlanHabitOverride } from '@mindful-flow/shared/types';
import api from '../services/api';

export function useWeeklyPlan(weekKey: string): UseQueryResult<WeeklyPlan | null> {
  return useQuery({
    queryKey: ['weekly-plan', weekKey],
    queryFn: async () => {
      try {
        const r = await api.get<WeeklyPlan>(`/weekly-plans/${weekKey}`);
        return r.data;
      } catch (err: unknown) {
        const e = err as { response?: { status?: number } };
        if (e.response?.status === 404) return null;
        throw err;
      }
    },
    enabled: !!weekKey,
  });
}

interface UpsertWeeklyPlanInput {
  weekKey: string;
  habitTargetOverrides: WeeklyPlanHabitOverride[];
  weekNote: string;
}

export function useUpsertWeeklyPlan(): UseMutationResult<WeeklyPlan, Error, UpsertWeeklyPlanInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ weekKey, ...data }: UpsertWeeklyPlanInput) =>
      api.put<WeeklyPlan>(`/weekly-plans/${weekKey}`, data).then((r) => r.data),
    onSuccess: (_, { weekKey }) => qc.invalidateQueries({ queryKey: ['weekly-plan', weekKey] }),
  });
}
```

- [ ] **Step 2: Create useMonthlyGoals.ts**

Create `packages/client/src/hooks/useMonthlyGoals.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import type { MonthlyGoalItem, GoalItem } from '@mindful-flow/shared/types';
import api from '../services/api';

export function useMonthlyGoals(monthKey: string): UseQueryResult<MonthlyGoalItem[]> {
  return useQuery({
    queryKey: ['monthly-goals', monthKey],
    queryFn: () =>
      api.get<MonthlyGoalItem[]>(`/monthly-goals/${monthKey}`).then((r) => r.data),
    enabled: !!monthKey,
  });
}

interface UpsertMonthlyGoalInput {
  monthKey: string;
  habitId: string;
  items: Omit<GoalItem, '_id'>[];
}

export function useUpsertMonthlyGoal(): UseMutationResult<MonthlyGoalItem, Error, UpsertMonthlyGoalInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ monthKey, habitId, items }: UpsertMonthlyGoalInput) =>
      api
        .put<MonthlyGoalItem>(`/monthly-goals/${monthKey}/${habitId}`, { items })
        .then((r) => r.data),
    onSuccess: (_, { monthKey }) =>
      qc.invalidateQueries({ queryKey: ['monthly-goals', monthKey] }),
  });
}
```

- [ ] **Step 3: Create useWeeklyReview.ts**

Create `packages/client/src/hooks/useWeeklyReview.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import type { WeeklyReview, TotalsEntry } from '@mindful-flow/shared/types';
import api from '../services/api';

export function useWeeklyReview(weekKey: string): UseQueryResult<WeeklyReview | null> {
  return useQuery({
    queryKey: ['weekly-review', weekKey],
    queryFn: async () => {
      try {
        const r = await api.get<WeeklyReview>(`/weekly-reviews/${weekKey}`);
        return r.data;
      } catch (err: unknown) {
        const e = err as { response?: { status?: number } };
        if (e.response?.status === 404) return null;
        throw err;
      }
    },
    enabled: !!weekKey,
  });
}

interface UpsertWeeklyReviewInput {
  weekKey: string;
  wentWell: string;
  toImprove: string;
  changesNextWeek: string;
  totals: TotalsEntry[];
}

export function useUpsertWeeklyReview(): UseMutationResult<WeeklyReview, Error, UpsertWeeklyReviewInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ weekKey, ...data }: UpsertWeeklyReviewInput) =>
      api.put<WeeklyReview>(`/weekly-reviews/${weekKey}`, data).then((r) => r.data),
    onSuccess: (_, { weekKey }) =>
      qc.invalidateQueries({ queryKey: ['weekly-review', weekKey] }),
  });
}
```

- [ ] **Step 4: Type-check**

```bash
cd packages/client && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/hooks/useWeeklyPlan.ts packages/client/src/hooks/useMonthlyGoals.ts packages/client/src/hooks/useWeeklyReview.ts
git commit -m "feat(client): add useWeeklyPlan, useMonthlyGoals, useWeeklyReview hooks"
```

---

## Task 8: Update navigation

**Files:**
- Modify: `packages/client/src/components/BottomNavBar.tsx`
- Modify: `packages/client/src/components/TopNavBar.tsx`

- [ ] **Step 1: Update BottomNavBar.tsx**

Replace the `tabs` array in `packages/client/src/components/BottomNavBar.tsx`:

```typescript
const tabs: TabItem[] = [
  { to: '/',          icon: 'calendar_view_week', label: 'Week'      },
  { to: '/month',     icon: 'checklist',          label: 'Month'     },
  { to: '/review',    icon: 'rate_review',        label: 'Review'    },
  { to: '/analytics', icon: 'analytics',          label: 'Analytics' },
  { to: '/settings',  icon: 'settings',           label: 'Settings'  },
];
```

- [ ] **Step 2: Update TopNavBar.tsx**

Replace the `links` array in `packages/client/src/components/TopNavBar.tsx`:

```typescript
const links: NavLinkItem[] = [
  { to: '/',          label: 'Week'      },
  { to: '/month',     label: 'Month'     },
  { to: '/review',    label: 'Review'    },
  { to: '/analytics', label: 'Analytics' },
];
```

- [ ] **Step 3: Commit**

```bash
git add packages/client/src/components/BottomNavBar.tsx packages/client/src/components/TopNavBar.tsx
git commit -m "feat(client): update navigation for new Week/Month/Review screens"
```

---

## Task 9: WeekPage + WeekSetupModal

**Files:**
- Create: `packages/client/src/pages/WeekPage.tsx`
- Create: `packages/client/src/components/WeekSetupModal.tsx`
- Create: `packages/client/src/components/skeletons/WeekPageSkeleton.tsx`

- [ ] **Step 1: Create WeekPageSkeleton.tsx**

Create `packages/client/src/components/skeletons/WeekPageSkeleton.tsx`:

```tsx
export default function WeekPageSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <div className="h-6 w-40 bg-surface-container-high rounded" />
        <div className="h-8 w-24 bg-surface-container-high rounded" />
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[500px]">
          <div className="flex gap-2 mb-3">
            <div className="w-28 h-4 bg-surface-container-high rounded" />
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex-1 h-4 bg-surface-container-high rounded" />
            ))}
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-2 mb-2 items-center border-t border-outline-variant/20 pt-2">
              <div className="w-28 h-5 bg-surface-container-high rounded" />
              {Array.from({ length: 8 }).map((_, j) => (
                <div key={j} className="flex-1 h-6 bg-surface-container-high rounded-full" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create WeekSetupModal.tsx**

Create `packages/client/src/components/WeekSetupModal.tsx`:

```tsx
import { useState } from 'react';
import type { Habit, WeeklyPlan, WeeklyPlanHabitOverride } from '@mindful-flow/shared/types';
import { useUpsertWeeklyPlan } from '../hooks/useWeeklyPlan';
import { formatWeekLabel } from '../utils/weekUtils';

interface Props {
  weekKey: string;
  habits: Habit[];
  plan: WeeklyPlan | null;
  onClose: () => void;
}

export default function WeekSetupModal({ weekKey, habits, plan, onClose }: Props) {
  const upsert = useUpsertWeeklyPlan();

  const [weekNote, setWeekNote] = useState(plan?.weekNote ?? '');
  const [overrides, setOverrides] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const o of plan?.habitTargetOverrides ?? []) {
      map[o.habitId] = o.targetDays;
    }
    return map;
  });

  function getTarget(habit: Habit): number {
    return overrides[habit._id] ?? habit.target;
  }

  function setTarget(habitId: string, value: number) {
    setOverrides((prev) => ({ ...prev, [habitId]: value }));
  }

  function handleSave() {
    const habitTargetOverrides: WeeklyPlanHabitOverride[] = habits
      .filter((h) => overrides[h._id] !== undefined && overrides[h._id] !== h.target)
      .map((h) => ({ habitId: h._id, targetDays: overrides[h._id]! }));

    upsert.mutate({ weekKey, habitTargetOverrides, weekNote }, { onSuccess: onClose });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-surface-container-lowest rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 shadow-xl">
        <h2 className="text-lg font-bold text-on-surface mb-1">Set up Week</h2>
        <p className="text-sm text-on-surface-variant mb-4">Week of {formatWeekLabel(weekKey)}</p>

        <div className="space-y-3 mb-4">
          {habits.map((habit) => (
            <div key={habit._id} className="flex items-center justify-between">
              <span className="text-sm text-on-surface">
                {habit.icon} {habit.name}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTarget(habit._id, Math.max(1, getTarget(habit) - 1))}
                  className="w-7 h-7 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center text-lg leading-none"
                >
                  −
                </button>
                <span className="w-4 text-center text-sm font-semibold text-on-surface">
                  {getTarget(habit)}
                </span>
                <button
                  onClick={() => setTarget(habit._id, Math.min(6, getTarget(habit) + 1))}
                  className="w-7 h-7 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center text-lg leading-none"
                >
                  +
                </button>
                <span className="text-xs text-on-surface-variant w-12">days/wk</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-5">
          <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wide">
            Week note (optional)
          </label>
          <input
            type="text"
            value={weekNote}
            onChange={(e) => setWeekNote(e.target.value)}
            placeholder="e.g. Hip flexor rehab — no gym"
            className="w-full bg-surface-container-high rounded-lg px-3 py-2 text-sm text-on-surface placeholder-on-surface-variant/50 outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-outline-variant text-on-surface-variant text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={upsert.isPending}
            className="flex-1 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold disabled:opacity-50"
          >
            {upsert.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create WeekPage.tsx**

Create `packages/client/src/pages/WeekPage.tsx`:

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHabits } from '../hooks/useHabits';
import { useCompletionsByRange, useCreateCompletion, useDeleteCompletion } from '../hooks/useCompletions';
import { useWeeklyPlan } from '../hooks/useWeeklyPlan';
import WeekSetupModal from '../components/WeekSetupModal';
import {
  getCurrentWeekKey,
  getWeekDays,
  prevWeekKey,
  nextWeekKey,
  toDateString,
  formatWeekLabel,
  DAY_LABELS,
} from '../utils/weekUtils';
import type { Completion, Habit } from '@mindful-flow/shared/types';

export default function WeekPage() {
  const navigate = useNavigate();
  const [weekKey, setWeekKey] = useState(getCurrentWeekKey);
  const [showSetup, setShowSetup] = useState(false);

  const weekDays = getWeekDays(weekKey);
  const from = toDateString(weekDays[0]);
  const to = toDateString(weekDays[6]);

  const { data: habits = [] } = useHabits();
  const { data: completions = [] } = useCompletionsByRange(from, to);
  const { data: plan } = useWeeklyPlan(weekKey);
  const createCompletion = useCreateCompletion();
  const deleteCompletion = useDeleteCompletion();

  const activeHabits = habits.filter((h) => h.isActive);
  const currentWeekKey = getCurrentWeekKey();
  const isFutureWeek = weekKey > currentWeekKey;

  function getTarget(habit: Habit): number {
    const override = plan?.habitTargetOverrides.find((o) => o.habitId === habit._id);
    return override?.targetDays ?? habit.target;
  }

  function findCompletion(habitId: string, date: Date): Completion | undefined {
    const ds = toDateString(date);
    return completions.find(
      (c) => c.habitId._id === habitId && c.date.slice(0, 10) === ds,
    );
  }

  function toggleCell(habitId: string, date: Date, dayIndex: number) {
    const isFriday = dayIndex === 6;
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const isFuture = date > today;
    if (isFriday || isFuture) return;

    const existing = findCompletion(habitId, date);
    if (existing) {
      deleteCompletion.mutate(existing._id);
    } else {
      createCompletion.mutate({ habitId, date: toDateString(date) });
    }
  }

  function getDoneCount(habitId: string): number {
    return completions.filter((c) => c.habitId._id === habitId).length;
  }

  const totalScheduled = activeHabits.reduce((sum, h) => sum + getTarget(h), 0);
  const totalDone = activeHabits.reduce((sum, h) => sum + getDoneCount(h._id), 0);
  const score = totalScheduled > 0 ? Math.round((totalDone / totalScheduled) * 100) : 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setWeekKey(prevWeekKey(weekKey))}
            className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors"
            aria-label="Previous week"
          >
            <span className="material-symbols-outlined text-xl">chevron_left</span>
          </button>
          <h1 className="font-bold text-on-surface font-headline">
            Week of {formatWeekLabel(weekKey)}
            {weekKey === currentWeekKey && (
              <span className="ml-2 text-xs font-normal text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                This week
              </span>
            )}
          </h1>
          <button
            onClick={() => !isFutureWeek && setWeekKey(nextWeekKey(weekKey))}
            disabled={isFutureWeek}
            className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-30"
            aria-label="Next week"
          >
            <span className="material-symbols-outlined text-xl">chevron_right</span>
          </button>
        </div>
        <button
          onClick={() => setShowSetup(true)}
          className="text-xs font-semibold text-primary border border-primary/30 px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-colors"
        >
          Set up week
        </button>
      </div>

      {/* Week note */}
      {plan?.weekNote && (
        <p className="text-sm text-on-surface-variant italic mb-4 bg-surface-container-high px-3 py-2 rounded-lg">
          📌 {plan.weekNote}
        </p>
      )}

      {/* Grid */}
      {activeHabits.length === 0 ? (
        <div className="text-center py-16 text-on-surface-variant">
          <span className="material-symbols-outlined text-5xl mb-3 block">checklist</span>
          <p className="font-semibold">No habits yet</p>
          <p className="text-sm mt-1">Go to Month → Habits to add your first habit.</p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full min-w-[480px] text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-left py-2 pr-3 font-semibold text-on-surface-variant text-xs uppercase tracking-wide w-28">
                  Activity
                </th>
                {DAY_LABELS.map((label, i) => {
                  const isToday = toDateString(weekDays[i]!) === toDateString(new Date());
                  return (
                    <th
                      key={i}
                      className={`text-center py-2 px-1 font-semibold text-xs uppercase tracking-wide w-9 ${
                        i === 6
                          ? 'text-on-surface-variant/40'
                          : isToday
                          ? 'text-primary'
                          : 'text-on-surface-variant'
                      }`}
                    >
                      {label}
                    </th>
                  );
                })}
                <th className="text-center py-2 pl-2 font-semibold text-xs uppercase tracking-wide text-on-surface-variant w-12">
                  Done
                </th>
              </tr>
            </thead>
            <tbody>
              {activeHabits.map((habit) => {
                const done = getDoneCount(habit._id);
                const target = getTarget(habit);
                const isOnTrack = done >= target;
                return (
                  <tr key={habit._id} className="border-t border-outline-variant/20">
                    <td className="py-2.5 pr-3">
                      <span className="font-medium text-on-surface text-sm">
                        {habit.icon} {habit.name}
                      </span>
                    </td>
                    {weekDays.map((day, i) => {
                      const isFriday = i === 6;
                      const today = new Date();
                      today.setHours(23, 59, 59, 999);
                      const isFuture = day! > today;
                      const completion = findCompletion(habit._id, day!);
                      const isToday = toDateString(day!) === toDateString(new Date());

                      return (
                        <td key={i} className="text-center py-2.5 px-1">
                          {isFriday ? (
                            <span className="text-on-surface-variant/30 text-base">🍹</span>
                          ) : isFuture ? (
                            <span className="text-on-surface-variant/20 text-lg">·</span>
                          ) : (
                            <button
                              onClick={() => toggleCell(habit._id, day!, i)}
                              className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto transition-all active:scale-90 ${
                                completion
                                  ? 'bg-primary text-on-primary shadow-sm'
                                  : isToday
                                  ? 'border-2 border-primary/50 text-transparent hover:border-primary'
                                  : 'border border-outline-variant/50 text-transparent hover:border-primary/50'
                              }`}
                              aria-label={`Toggle ${habit.name} on ${DAY_LABELS[i]}`}
                            >
                              {completion && (
                                <span className="material-symbols-outlined text-sm">check</span>
                              )}
                            </button>
                          )}
                        </td>
                      );
                    })}
                    <td className="text-center py-2.5 pl-2">
                      <span
                        className={`text-xs font-semibold tabular-nums ${
                          isOnTrack ? 'text-primary' : 'text-on-surface-variant'
                        }`}
                      >
                        {done}/{target}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-outline-variant/20">
        <div className="text-sm text-on-surface-variant">
          Score:{' '}
          <span
            className={`font-bold text-base ${
              score >= 80 ? 'text-primary' : score >= 50 ? 'text-tertiary' : 'text-error'
            }`}
          >
            {score}%
          </span>
        </div>
        <button
          onClick={() => navigate('/review')}
          className="text-sm font-semibold text-primary flex items-center gap-1 hover:underline"
        >
          Write review
          <span className="material-symbols-outlined text-base">arrow_forward</span>
        </button>
      </div>

      {showSetup && (
        <WeekSetupModal
          weekKey={weekKey}
          habits={activeHabits}
          plan={plan ?? null}
          onClose={() => setShowSetup(false)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Type-check**

```bash
cd packages/client && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/pages/WeekPage.tsx packages/client/src/components/WeekSetupModal.tsx packages/client/src/components/skeletons/WeekPageSkeleton.tsx
git commit -m "feat(client): add WeekPage grid and WeekSetupModal"
```

---

## Task 10: MonthPage

**Files:**
- Create: `packages/client/src/pages/MonthPage.tsx`
- Create: `packages/client/src/components/skeletons/MonthPageSkeleton.tsx`

- [ ] **Step 1: Create MonthPageSkeleton.tsx**

Create `packages/client/src/components/skeletons/MonthPageSkeleton.tsx`:

```tsx
export default function MonthPageSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="h-6 w-32 bg-surface-container-high rounded" />
        <div className="h-8 w-20 bg-surface-container-high rounded" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-surface-container-lowest rounded-xl p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="h-5 w-28 bg-surface-container-high rounded" />
            <div className="h-4 w-16 bg-surface-container-high rounded" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, j) => (
              <div key={j} className="flex items-center gap-3">
                <div className="w-4 h-4 rounded bg-surface-container-high" />
                <div className="flex-1 h-4 bg-surface-container-high rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create MonthPage.tsx**

Create `packages/client/src/pages/MonthPage.tsx`:

```tsx
import { useState } from 'react';
import { useHabits } from '../hooks/useHabits';
import { useMonthlyGoals, useUpsertMonthlyGoal } from '../hooks/useMonthlyGoals';
import {
  getMonthKey,
  formatMonthLabel,
  prevMonthKey,
  nextMonthKey,
} from '../utils/weekUtils';
import type { Habit, MonthlyGoalItem, GoalItem } from '@mindful-flow/shared/types';

// ─── Habits tab (reuse existing Habits page logic inline) ──────────
import { lazy, Suspense } from 'react';
import HabitsSkeleton from '../components/skeletons/HabitsSkeleton';
const HabitsContent = lazy(() => import('./Habits'));

// ─── Goals tab ─────────────────────────────────────────────────────

interface HabitCardProps {
  habit: Habit;
  goalData: MonthlyGoalItem | undefined;
  monthKey: string;
}

function HabitGoalCard({ habit, goalData, monthKey }: HabitCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const upsert = useUpsertMonthlyGoal();

  const items = goalData?.items ?? [];
  const doneCount = items.filter((it) => it.completed).length;

  function saveItems(updatedItems: Omit<GoalItem, '_id'>[]) {
    upsert.mutate({ monthKey, habitId: habit._id, items: updatedItems });
  }

  function toggleItem(item: GoalItem) {
    const updated = items.map((it) =>
      it._id === item._id ? { text: it.text, completed: !it.completed, order: it.order } : it,
    );
    saveItems(updated);
  }

  function addItem() {
    const text = newItemText.trim();
    if (!text) return;
    const updated = [
      ...items.map((it) => ({ text: it.text, completed: it.completed, order: it.order })),
      { text, completed: false, order: items.length },
    ];
    saveItems(updated);
    setNewItemText('');
  }

  function deleteItem(itemId: string) {
    const updated = items
      .filter((it) => it._id !== itemId)
      .map((it, idx) => ({ text: it.text, completed: it.completed, order: idx }));
    saveItems(updated);
  }

  return (
    <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
      {/* Card header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">{habit.icon}</span>
          <span className="font-semibold text-on-surface">{habit.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-on-surface-variant">
            {doneCount}/{items.length} done
          </span>
          <span className="material-symbols-outlined text-on-surface-variant text-sm">
            {expanded ? 'expand_less' : 'expand_more'}
          </span>
        </div>
      </button>

      {/* Checklist */}
      {expanded && (
        <div className="px-4 pb-4 space-y-2 border-t border-outline-variant/20">
          {items.length === 0 && (
            <p className="text-sm text-on-surface-variant/60 py-2">No items yet.</p>
          )}
          {items.map((item) => (
            <div key={item._id} className="flex items-center gap-3 group">
              <button
                onClick={() => toggleItem(item)}
                className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center transition-colors ${
                  item.completed
                    ? 'bg-primary text-on-primary'
                    : 'border-2 border-outline-variant'
                }`}
                aria-label={item.completed ? 'Mark incomplete' : 'Mark complete'}
              >
                {item.completed && (
                  <span className="material-symbols-outlined text-xs">check</span>
                )}
              </button>
              <span
                className={`flex-1 text-sm ${
                  item.completed ? 'line-through text-on-surface-variant' : 'text-on-surface'
                }`}
              >
                {item.text}
              </span>
              <button
                onClick={() => deleteItem(item._id)}
                className="opacity-0 group-hover:opacity-100 text-on-surface-variant/50 hover:text-error transition-all"
                aria-label="Delete item"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          ))}

          {/* Add item */}
          <div className="flex gap-2 mt-3">
            <input
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addItem()}
              placeholder="Add item..."
              className="flex-1 bg-surface-container-high rounded-lg px-3 py-1.5 text-sm text-on-surface placeholder-on-surface-variant/50 outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              onClick={addItem}
              disabled={!newItemText.trim()}
              className="px-3 py-1.5 bg-primary text-on-primary text-sm font-semibold rounded-lg disabled:opacity-40 transition-opacity"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────

export default function MonthPage() {
  const [tab, setTab] = useState<'goals' | 'habits'>('goals');
  const [monthKey, setMonthKey] = useState(getMonthKey);

  const { data: habits = [] } = useHabits();
  const { data: monthlyGoals = [] } = useMonthlyGoals(monthKey);

  const activeHabits = habits.filter((h) => h.isActive);
  const currentMonthKey = getMonthKey();
  const isFutureMonth = monthKey > currentMonthKey;

  function getGoalData(habitId: string): MonthlyGoalItem | undefined {
    return monthlyGoals.find((g) => g.habitId === habitId);
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex border-b border-outline-variant/20 mb-5">
        <button
          onClick={() => setTab('goals')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors ${
            tab === 'goals'
              ? 'text-primary border-b-2 border-primary'
              : 'text-on-surface-variant'
          }`}
        >
          This Month's Goals
        </button>
        <button
          onClick={() => setTab('habits')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors ${
            tab === 'habits'
              ? 'text-primary border-b-2 border-primary'
              : 'text-on-surface-variant'
          }`}
        >
          Habits
        </button>
      </div>

      {tab === 'goals' && (
        <div>
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setMonthKey(prevMonthKey(monthKey))}
              className="p-1 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors"
              aria-label="Previous month"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <h2 className="font-bold text-on-surface font-headline">
              {formatMonthLabel(monthKey)}
            </h2>
            <button
              onClick={() => !isFutureMonth && setMonthKey(nextMonthKey(monthKey))}
              disabled={isFutureMonth}
              className="p-1 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors disabled:opacity-30"
              aria-label="Next month"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>

          {activeHabits.length === 0 ? (
            <p className="text-center text-on-surface-variant py-12 text-sm">
              Add habits in the Habits tab first.
            </p>
          ) : (
            <div className="space-y-3">
              {activeHabits.map((habit) => (
                <HabitGoalCard
                  key={habit._id}
                  habit={habit}
                  goalData={getGoalData(habit._id)}
                  monthKey={monthKey}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'habits' && (
        <Suspense fallback={<HabitsSkeleton />}>
          <HabitsContent />
        </Suspense>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Type-check**

```bash
cd packages/client && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add packages/client/src/pages/MonthPage.tsx packages/client/src/components/skeletons/MonthPageSkeleton.tsx
git commit -m "feat(client): add MonthPage with goal checklists and habit management tabs"
```

---

## Task 11: ReviewPage

**Files:**
- Create: `packages/client/src/pages/ReviewPage.tsx`
- Create: `packages/client/src/components/skeletons/ReviewPageSkeleton.tsx`

- [ ] **Step 1: Create ReviewPageSkeleton.tsx**

Create `packages/client/src/components/skeletons/ReviewPageSkeleton.tsx`:

```tsx
export default function ReviewPageSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="flex justify-between items-center">
        <div className="h-6 w-36 bg-surface-container-high rounded" />
        <div className="h-4 w-20 bg-surface-container-high rounded" />
      </div>
      <div className="bg-surface-container-lowest rounded-xl p-4 space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <div className="h-4 w-28 bg-surface-container-high rounded" />
            <div className="h-4 w-16 bg-surface-container-high rounded" />
          </div>
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-1">
          <div className="h-4 w-40 bg-surface-container-high rounded" />
          <div className="h-20 w-full bg-surface-container-high rounded-xl" />
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create ReviewPage.tsx**

Create `packages/client/src/pages/ReviewPage.tsx`:

```tsx
import { useState, useEffect } from 'react';
import { useHabits } from '../hooks/useHabits';
import { useCompletionsByRange } from '../hooks/useCompletions';
import { useWeeklyPlan } from '../hooks/useWeeklyPlan';
import { useWeeklyReview, useUpsertWeeklyReview } from '../hooks/useWeeklyReview';
import {
  getCurrentWeekKey,
  getWeekDays,
  toDateString,
  formatWeekLabel,
  prevWeekKey,
  nextWeekKey,
} from '../utils/weekUtils';
import type { Habit, TotalsEntry } from '@mindful-flow/shared/types';

export default function ReviewPage() {
  const [weekKey, setWeekKey] = useState(getCurrentWeekKey);
  const currentWeekKey = getCurrentWeekKey();
  const isFutureWeek = weekKey > currentWeekKey;

  const weekDays = getWeekDays(weekKey);
  const from = toDateString(weekDays[0]);
  const to = toDateString(weekDays[6]);

  const { data: habits = [] } = useHabits();
  const { data: completions = [] } = useCompletionsByRange(from, to);
  const { data: plan } = useWeeklyPlan(weekKey);
  const { data: review } = useWeeklyReview(weekKey);
  const upsertReview = useUpsertWeeklyReview();

  const [wentWell, setWentWell] = useState('');
  const [toImprove, setToImprove] = useState('');
  const [changesNextWeek, setChangesNextWeek] = useState('');
  const [saved, setSaved] = useState(false);

  // Populate form when review loads
  useEffect(() => {
    if (review) {
      setWentWell(review.wentWell);
      setToImprove(review.toImprove);
      setChangesNextWeek(review.changesNextWeek);
    } else {
      setWentWell('');
      setToImprove('');
      setChangesNextWeek('');
    }
    setSaved(false);
  }, [review, weekKey]);

  const activeHabits = habits.filter((h) => h.isActive);

  function getTarget(habit: Habit): number {
    const override = plan?.habitTargetOverrides.find((o) => o.habitId === habit._id);
    return override?.targetDays ?? habit.target;
  }

  function getDoneCount(habitId: string): number {
    return completions.filter((c) => c.habitId._id === habitId).length;
  }

  const totals: TotalsEntry[] = activeHabits.map((h) => ({
    habitId: h._id,
    habitName: h.name,
    done: getDoneCount(h._id),
    target: getTarget(h),
  }));

  const overallDone = totals.reduce((s, t) => s + t.done, 0);
  const overallTarget = totals.reduce((s, t) => s + t.target, 0);
  const overallScore =
    overallTarget > 0 ? Math.round((overallDone / overallTarget) * 100) : 0;

  function handleSave() {
    upsertReview.mutate(
      { weekKey, wentWell, toImprove, changesNextWeek, totals },
      { onSuccess: () => setSaved(true) },
    );
  }

  const isPastWeek = weekKey < currentWeekKey;
  const isReadOnly = isPastWeek && !!review;

  return (
    <div className="max-w-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setWeekKey(prevWeekKey(weekKey))}
            className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors"
            aria-label="Previous week"
          >
            <span className="material-symbols-outlined text-xl">chevron_left</span>
          </button>
          <h1 className="font-bold text-on-surface font-headline">
            Week of {formatWeekLabel(weekKey)}
          </h1>
          <button
            onClick={() => !isFutureWeek && setWeekKey(nextWeekKey(weekKey))}
            disabled={isFutureWeek}
            className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-30"
            aria-label="Next week"
          >
            <span className="material-symbols-outlined text-xl">chevron_right</span>
          </button>
        </div>
        {review && (
          <span className="text-xs text-on-surface-variant bg-surface-container-high px-2 py-1 rounded-full">
            Saved
          </span>
        )}
      </div>

      {/* Week note context */}
      {plan?.weekNote && (
        <p className="text-sm text-on-surface-variant italic mb-4 bg-surface-container-high px-3 py-2 rounded-lg">
          📌 {plan.weekNote}
        </p>
      )}

      {/* Totals table */}
      <div className="bg-surface-container-lowest rounded-xl mb-6 overflow-hidden">
        <div className="px-4 py-3 border-b border-outline-variant/20">
          <h2 className="font-semibold text-on-surface text-sm">Totals</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-outline-variant/10">
              <th className="text-left px-4 py-2 text-xs text-on-surface-variant font-semibold uppercase tracking-wide">
                Activity
              </th>
              <th className="text-center px-2 py-2 text-xs text-on-surface-variant font-semibold uppercase tracking-wide">
                Done
              </th>
              <th className="text-center px-2 py-2 text-xs text-on-surface-variant font-semibold uppercase tracking-wide">
                Target
              </th>
              <th className="text-center px-4 py-2 text-xs text-on-surface-variant font-semibold uppercase tracking-wide">
                %
              </th>
            </tr>
          </thead>
          <tbody>
            {totals.map((t) => {
              const pct = t.target > 0 ? Math.round((t.done / t.target) * 100) : 0;
              return (
                <tr key={t.habitId} className="border-t border-outline-variant/10">
                  <td className="px-4 py-2 text-on-surface">
                    {activeHabits.find((h) => h._id === t.habitId)?.icon} {t.habitName}
                  </td>
                  <td className="text-center px-2 py-2 tabular-nums text-on-surface">{t.done}</td>
                  <td className="text-center px-2 py-2 tabular-nums text-on-surface-variant">{t.target}</td>
                  <td className="text-center px-4 py-2">
                    <span
                      className={`text-xs font-semibold ${
                        pct >= 80
                          ? 'text-primary'
                          : pct >= 50
                          ? 'text-tertiary'
                          : 'text-error'
                      }`}
                    >
                      {pct}%
                    </span>
                  </td>
                </tr>
              );
            })}
            <tr className="border-t-2 border-outline-variant/30 font-bold">
              <td className="px-4 py-2 text-on-surface">Overall</td>
              <td className="text-center px-2 py-2 tabular-nums text-on-surface">{overallDone}</td>
              <td className="text-center px-2 py-2 tabular-nums text-on-surface-variant">{overallTarget}</td>
              <td className="text-center px-4 py-2">
                <span
                  className={`text-sm font-bold ${
                    overallScore >= 80
                      ? 'text-primary'
                      : overallScore >= 50
                      ? 'text-tertiary'
                      : 'text-error'
                  }`}
                >
                  {overallScore}%
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Reflection */}
      <div className="space-y-4">
        {[
          { label: 'What did I do well?', value: wentWell, set: setWentWell },
          { label: 'What do I want to improve?', value: toImprove, set: setToImprove },
          { label: 'Any changes for next week?', value: changesNextWeek, set: setChangesNextWeek },
        ].map(({ label, value, set }) => (
          <div key={label}>
            <label className="block text-sm font-semibold text-on-surface mb-1">{label}</label>
            <textarea
              value={value}
              onChange={(e) => set(e.target.value)}
              readOnly={isReadOnly}
              rows={3}
              placeholder={isReadOnly ? '—' : 'Write your reflection...'}
              className="w-full bg-surface-container-high rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder-on-surface-variant/40 outline-none focus:ring-2 focus:ring-primary/40 resize-none disabled:opacity-70"
            />
          </div>
        ))}
      </div>

      {/* Save button */}
      {!isReadOnly && (
        <button
          onClick={handleSave}
          disabled={upsertReview.isPending}
          className="mt-5 w-full py-3 bg-primary text-on-primary font-semibold rounded-xl disabled:opacity-50 transition-opacity"
        >
          {upsertReview.isPending ? 'Saving...' : saved ? 'Saved ✓' : 'Save Review'}
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Type-check**

```bash
cd packages/client && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add packages/client/src/pages/ReviewPage.tsx packages/client/src/components/skeletons/ReviewPageSkeleton.tsx
git commit -m "feat(client): add ReviewPage with totals table and reflection section"
```

---

## Task 12: Wire pages in App.tsx

**Files:**
- Modify: `packages/client/src/App.tsx`

- [ ] **Step 1: Update App.tsx**

Replace the contents of `packages/client/src/App.tsx` with:

```tsx
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import ProtectedRoute from './components/ProtectedRoute';
import TopNavBar from './components/TopNavBar';
import BottomNavBar from './components/BottomNavBar';
import PageTransition from './components/PageTransition';
import WeekPageSkeleton from './components/skeletons/WeekPageSkeleton';
import MonthPageSkeleton from './components/skeletons/MonthPageSkeleton';
import ReviewPageSkeleton from './components/skeletons/ReviewPageSkeleton';
import AnalyticsSkeleton from './components/skeletons/AnalyticsSkeleton';
import SettingsSkeleton from './components/skeletons/SettingsSkeleton';
import AuthSkeleton from './components/skeletons/AuthSkeleton';

const WeekPage = lazy(() => import('./pages/WeekPage'));
const MonthPage = lazy(() => import('./pages/MonthPage'));
const ReviewPage = lazy(() => import('./pages/ReviewPage'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Settings = lazy(() => import('./pages/Settings'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface">
      <TopNavBar />
      <main className="max-w-7xl mx-auto px-6 pt-8 pb-32 md:pb-12">{children}</main>
      <BottomNavBar />
    </div>
  );
}

function LazyPage({
  skeleton,
  children,
}: {
  skeleton: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={skeleton}>
      <PageTransition>{children}</PageTransition>
    </Suspense>
  );
}

export default function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/login"
          element={
            <LazyPage skeleton={<AuthSkeleton />}>
              <Login />
            </LazyPage>
          }
        />
        <Route
          path="/register"
          element={
            <LazyPage skeleton={<AuthSkeleton />}>
              <Register />
            </LazyPage>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout>
                <LazyPage skeleton={<WeekPageSkeleton />}>
                  <WeekPage />
                </LazyPage>
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/month"
          element={
            <ProtectedRoute>
              <AppLayout>
                <LazyPage skeleton={<MonthPageSkeleton />}>
                  <MonthPage />
                </LazyPage>
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/review"
          element={
            <ProtectedRoute>
              <AppLayout>
                <LazyPage skeleton={<ReviewPageSkeleton />}>
                  <ReviewPage />
                </LazyPage>
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <AppLayout>
                <LazyPage skeleton={<AnalyticsSkeleton />}>
                  <Analytics />
                </LazyPage>
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AppLayout>
                <LazyPage skeleton={<SettingsSkeleton />}>
                  <Settings />
                </LazyPage>
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Type-check the full client**

```bash
cd packages/client && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Run the app and verify manually**

```bash
cd G:/personal/tracking-app && pnpm dev
```

Open http://localhost:5173. Verify:
- Home screen shows the weekly grid
- Bottom nav has: Week, Month, Review, Analytics, Settings
- Navigating to /month shows the two-tab page
- Navigating to /review shows the review screen with totals table
- Tapping a cell in the grid toggles a completion (✓ appears)
- "Set up week" opens the modal with habit target sliders

- [ ] **Step 4: Commit**

```bash
git add packages/client/src/App.tsx
git commit -m "feat(client): wire WeekPage, MonthPage, ReviewPage into router"
```

---

## Task 13: Final typecheck across all packages

- [ ] **Step 1: Run full typecheck**

```bash
cd G:/personal/tracking-app && pnpm turbo typecheck
```

Expected: all packages type-check clean.

- [ ] **Step 2: Run all server tests**

```bash
cd packages/server && NODE_ENV=test npx jest --runInBand --forceExit
```

Expected: all tests pass.

- [ ] **Step 3: Commit if any fixes needed**

```bash
git add -A
git commit -m "fix: resolve typecheck issues after full integration"
```
