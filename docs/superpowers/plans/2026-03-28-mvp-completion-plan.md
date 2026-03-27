# MVP Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship three features that make The Mindful Flow ready for public users: notification triggers, profile editing, and analytics time range selector.

**Architecture:** Notification triggers are fire-and-forget async calls added to existing controller hooks. Profile editing extends the already-wired-up `PUT /api/auth/profile` route. Analytics time range adds a view-toggle to the existing Analytics page using data already available on the server.

**Tech Stack:** Express + Mongoose (server), React 19 + TanStack Query + Tailwind (client), shared CJS/ESM validation package.

**Run API tests:** `cd packages/server && NODE_ENV=test npx jest --runInBand --forceExit`

---

## File Map

### New files
- `packages/server/src/utils/createNotification.js` — fire-and-forget notification insert utility

### Server modifications
- `packages/server/src/controllers/habitsController.js` — add first-habit notification trigger after `createHabit`
- `packages/server/src/controllers/completionsController.js` — add first-completion, streak-milestone, perfect-week triggers after `createCompletion`
- `packages/server/src/controllers/authController.js` — replace stub `updateProfile` with full name/email/password implementation
- `packages/shared/validation.js` — add `validateProfileInput`
- `packages/shared/validation.mjs` — mirror the same addition (dual CJS/ESM package)

### Client modifications
- `packages/client/src/context/AuthContext.jsx` — add `updateUser(user)` helper to expose profile update to Settings
- `packages/client/src/pages/Settings.jsx` — replace read-only profile card with editable form + password change card; remove hardcoded "Notifications: On" row
- `packages/client/src/hooks/useAnalytics.js` — add `useLast30DaysAnalytics()` hook
- `packages/client/src/pages/Analytics.jsx` — add view toggle (Week / Month / 30 Days) and month/30-day layout

### Test file
- `packages/server/__tests__/api.test.js` — add tests for profile update and notification triggers

---

## Task 1: createNotification utility

**Files:**
- Create: `packages/server/src/utils/createNotification.js`

- [ ] **Step 1: Write the file**

```js
// packages/server/src/utils/createNotification.js
const Notification = require('../models/Notification');

async function createNotification(userId, type, title, message) {
  try {
    await Notification.create({ userId, type, title, message });
  } catch (_) {
    // Fire-and-forget — notification failures must never affect the main request
  }
}

module.exports = { createNotification };
```

- [ ] **Step 2: Commit**

```bash
git add packages/server/src/utils/createNotification.js
git commit -m "feat: add createNotification fire-and-forget utility"
```

---

## Task 2: First-habit notification trigger

**Files:**
- Modify: `packages/server/src/controllers/habitsController.js`

- [ ] **Step 1: Write a failing test**

In `packages/server/__tests__/api.test.js`, find the habits describe block and add after the existing tests:

```js
describe('Notification triggers', () => {
  let triggerToken;

  beforeAll(async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Trigger User',
      email: 'trigger@example.com',
      password: 'password123',
    });
    triggerToken = res.body.token;
  });

  it('POST /habits — creates first-habit notification on first habit', async () => {
    await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${triggerToken}`)
      .send({ name: 'Meditate', frequency: 'daily' });

    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${triggerToken}`);

    expect(res.status).toBe(200);
    const firstHabitNotif = res.body.find((n) => n.title === "You're on your way");
    expect(firstHabitNotif).toBeDefined();
    expect(firstHabitNotif.type).toBe('achievement');
  });

  it('POST /habits — does not duplicate first-habit notification on second habit', async () => {
    await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${triggerToken}`)
      .send({ name: 'Read', frequency: 'daily' });

    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${triggerToken}`);

    const notifs = res.body.filter((n) => n.title === "You're on your way");
    expect(notifs.length).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd packages/server && NODE_ENV=test npx jest --runInBand --forceExit --testNamePattern="creates first-habit notification"
```

Expected: FAIL — notification not found

- [ ] **Step 3: Add trigger to habitsController.js**

Replace the full `createHabit` function:

```js
const Habit = require('../models/Habit');
const { createNotification } = require('../utils/createNotification');

async function createHabit(req, res, next) {
  try {
    const { name, icon, color, frequency, target, description, categoryId, trackingType, weeklyTarget } = req.body;
    const habit = await Habit.create({
      userId: req.user._id,
      name,
      icon: icon || 'check_circle',
      color: color || 'primary',
      frequency: trackingType === 'duration' ? 'weekly' : frequency,
      target: frequency === 'daily' ? 1 : (target || 1),
      description: description || '',
      categoryId: categoryId || null,
      trackingType: trackingType || 'checkmark',
      weeklyTarget: trackingType === 'duration' ? weeklyTarget : null,
    });
    const populated = await habit.populate('categoryId', 'name color');

    // First-habit notification (fire-and-forget)
    const habitCount = await Habit.countDocuments({ userId: req.user._id, isActive: true });
    if (habitCount === 1) {
      await createNotification(
        req.user._id,
        'achievement',
        "You're on your way",
        'Your first habit is set. Show up tomorrow and the streak begins.'
      );
    }

    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
}
```

Keep `getHabits`, `updateHabit`, `deleteHabit` unchanged. Keep the `module.exports` line unchanged.

- [ ] **Step 4: Run test to confirm it passes**

```bash
cd packages/server && NODE_ENV=test npx jest --runInBand --forceExit --testNamePattern="Notification triggers"
```

Expected: PASS for both notification trigger tests

- [ ] **Step 5: Commit**

```bash
git add packages/server/src/controllers/habitsController.js packages/server/__tests__/api.test.js
git commit -m "feat: fire first-habit notification on habit creation"
```

---

## Task 3: Completion notification triggers

**Files:**
- Modify: `packages/server/src/controllers/completionsController.js`
- Modify: `packages/server/__tests__/api.test.js`

- [ ] **Step 1: Write failing tests**

Add inside the `describe('Notification triggers')` block in `api.test.js`, after the existing two habit tests:

```js
it('POST /completions — creates first-completion notification', async () => {
  // triggerToken already has 2 habits from above; get the first habit id
  const habitsRes = await request(app)
    .get('/api/habits')
    .set('Authorization', `Bearer ${triggerToken}`);
  const firstHabitId = habitsRes.body[0]._id;

  await request(app)
    .post('/api/completions')
    .set('Authorization', `Bearer ${triggerToken}`)
    .send({ habitId: firstHabitId, date: '2026-01-01' });

  const res = await request(app)
    .get('/api/notifications')
    .set('Authorization', `Bearer ${triggerToken}`);

  const notif = res.body.find((n) => n.title === 'First check-in');
  expect(notif).toBeDefined();
  expect(notif.type).toBe('achievement');
});

it('POST /completions — creates streak notification at 3-day milestone', async () => {
  // Use a fresh user with exactly 1 daily habit so calculateStreak(completions, 1) fires correctly.
  // triggerToken's user has 2 daily habits, which would require 2 completions/day for streak.
  const streakUserRes = await request(app).post('/api/auth/register').send({
    name: 'Streak User',
    email: 'streak@example.com',
    password: 'password123',
  });
  const streakToken = streakUserRes.body.token;

  const habitRes = await request(app)
    .post('/api/habits')
    .set('Authorization', `Bearer ${streakToken}`)
    .send({ name: 'Run', frequency: 'daily' });
  const habitId = habitRes.body._id;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const dates = [-2, -1, 0].map((offset) => {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() + offset);
    return d.toISOString().split('T')[0];
  });

  for (const date of dates) {
    await request(app)
      .post('/api/completions')
      .set('Authorization', `Bearer ${streakToken}`)
      .send({ habitId, date });
  }

  const res = await request(app)
    .get('/api/notifications')
    .set('Authorization', `Bearer ${streakToken}`);

  const streakNotif = res.body.find((n) => n.title === '🔥 3-day streak');
  expect(streakNotif).toBeDefined();
  expect(streakNotif.type).toBe('streak');
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd packages/server && NODE_ENV=test npx jest --runInBand --forceExit --testNamePattern="first-completion|streak notification"
```

Expected: FAIL — notifications not found

- [ ] **Step 3: Implement completion triggers in completionsController.js**

Replace the full file:

```js
const Completion = require('../models/Completion');
const Habit = require('../models/Habit');
const Notification = require('../models/Notification');
const { normalizeDate } = require('../utils/dateHelpers');
const { calculateStreak } = require('../utils/streakCalculator');
const { createNotification } = require('../utils/createNotification');

const STREAK_MILESTONES = new Set([3, 7, 14, 30, 60, 100]);

async function getCompletions(req, res, next) {
  try {
    const filter = { userId: req.user._id };
    if (req.query.date) {
      const d = normalizeDate(req.query.date);
      const nextDay = new Date(d);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);
      filter.date = { $gte: d, $lt: nextDay };
    } else if (req.query.from && req.query.to) {
      filter.date = { $gte: normalizeDate(req.query.from), $lte: normalizeDate(req.query.to) };
    }
    const completions = await Completion.find(filter).populate('habitId', 'name icon color frequency').sort({ completedAt: -1 });
    res.json(completions);
  } catch (err) {
    next(err);
  }
}

async function createCompletion(req, res, next) {
  try {
    const { habitId, date, value, note } = req.body;
    const habit = await Habit.findOne({ _id: habitId, userId: req.user._id, isActive: true });
    if (!habit) {
      return res.status(404).json({ error: { message: 'Habit not found', code: 'NOT_FOUND' } });
    }
    const completion = await Completion.create({
      habitId,
      userId: req.user._id,
      date: normalizeDate(date),
      value: value || 1,
      note: note || '',
    });
    res.status(201).json(completion);

    // Notification triggers — fire-and-forget, never affect the response
    fireCompletionNotifications(req.user._id, completion).catch(() => {});
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: { message: 'Already completed for this date', code: 'DUPLICATE' } });
    }
    next(err);
  }
}

async function fireCompletionNotifications(userId, completion) {
  const totalCompletions = await Completion.countDocuments({ userId });

  // 1. First completion ever
  if (totalCompletions === 1) {
    await createNotification(userId, 'achievement', 'First check-in', "Day one logged. That's the hardest one.");
    return;
  }

  // 2. Streak milestone
  const dailyHabits = await Habit.find({ userId, isActive: true, frequency: 'daily' });
  if (dailyHabits.length > 0) {
    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - 365);
    cutoff.setUTCHours(0, 0, 0, 0);
    const allCompletions = await Completion.find({ userId, date: { $gte: cutoff } }).sort({ date: -1 });
    const streak = calculateStreak(allCompletions, dailyHabits.length);

    if (STREAK_MILESTONES.has(streak)) {
      const title = `🔥 ${streak}-day streak`;
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
      const existing = await Notification.findOne({ userId, title, createdAt: { $gte: sevenDaysAgo } });
      if (!existing) {
        await createNotification(userId, 'streak', title, `You've completed all your habits for ${streak} days in a row.`);
      }
    }
  }

  // 3. Perfect week — fires on first completion of a new week if last week was 100%
  const getMondayOf = (d) => {
    const day = d.getUTCDay();
    const diff = day === 0 ? 6 : day - 1;
    const monday = new Date(d);
    monday.setUTCDate(d.getUTCDate() - diff);
    monday.setUTCHours(0, 0, 0, 0);
    return monday;
  };

  const todayNorm = normalizeDate(new Date());
  const thisWeekMonday = getMondayOf(todayNorm);

  const prevCompletion = await Completion.findOne({
    userId,
    _id: { $ne: completion._id },
  }).sort({ date: -1 });

  if (prevCompletion) {
    const prevDate = normalizeDate(prevCompletion.date);
    const prevWeekMonday = getMondayOf(prevDate);

    if (thisWeekMonday > prevWeekMonday) {
      // First completion of a new week — evaluate last week
      const lastWeekStart = new Date(thisWeekMonday);
      lastWeekStart.setUTCDate(thisWeekMonday.getUTCDate() - 7);
      const lastWeekEnd = new Date(thisWeekMonday);

      const lastWeekCompletions = await Completion.countDocuments({
        userId,
        date: { $gte: lastWeekStart, $lt: lastWeekEnd },
      });

      const habits = await Habit.find({ userId, isActive: true });
      let totalTarget = 0;
      for (const h of habits) {
        totalTarget += h.frequency === 'daily' ? 7 : h.target;
      }

      if (totalTarget > 0 && lastWeekCompletions >= totalTarget) {
        const title = 'Perfect week';
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
        const existing = await Notification.findOne({ userId, title, createdAt: { $gte: sevenDaysAgo } });
        if (!existing) {
          await createNotification(userId, 'achievement', 'Perfect week', "You hit every target last week. That's rare — keep it going.");
        }
      }
    }
  }
}

async function deleteCompletion(req, res, next) {
  try {
    const completion = await Completion.findOne({ _id: req.params.id, userId: req.user._id });
    if (!completion) {
      return res.status(404).json({ error: { message: 'Completion not found', code: 'NOT_FOUND' } });
    }
    await Completion.deleteOne({ _id: req.params.id });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { getCompletions, createCompletion, deleteCompletion };
```

- [ ] **Step 4: Run all notification trigger tests**

```bash
cd packages/server && NODE_ENV=test npx jest --runInBand --forceExit --testNamePattern="Notification triggers"
```

Expected: all 4 tests PASS

- [ ] **Step 5: Run full test suite to check no regressions**

```bash
cd packages/server && NODE_ENV=test npx jest --runInBand --forceExit
```

Expected: all tests PASS

- [ ] **Step 6: Commit**

```bash
git add packages/server/src/controllers/completionsController.js packages/server/__tests__/api.test.js
git commit -m "feat: add first-completion, streak milestone, and perfect week notification triggers"
```

---

## Task 4: Profile validation in shared package

**Files:**
- Modify: `packages/shared/validation.js`
- Modify: `packages/shared/validation.mjs`

- [ ] **Step 1: Add `validateProfileInput` to `validation.js`**

Add before the `module.exports` line:

```js
function validateProfileInput(data) {
  const errors = {};
  if (data.name !== undefined) {
    if (data.name.trim().length === 0) errors.name = 'Name cannot be empty';
    else if (data.name.length > 100) errors.name = 'Name must be under 100 characters';
  }
  if (data.email !== undefined) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Valid email is required';
  }
  if (data.password !== undefined) {
    if (!data.currentPassword) errors.currentPassword = 'Current password is required to set a new password';
    if (data.password.length < 6) errors.password = 'Password must be at least 6 characters';
  }
  return { isValid: Object.keys(errors).length === 0, errors };
}
```

Update `module.exports`:

```js
module.exports = { validateHabitInput, validateAuthInput, validateCompletionInput, validateCategoryInput, validateProfileInput };
```

- [ ] **Step 2: Mirror to `validation.mjs`**

Add before the last export line (or at the end of the file):

```js
export function validateProfileInput(data) {
  const errors = {};
  if (data.name !== undefined) {
    if (data.name.trim().length === 0) errors.name = 'Name cannot be empty';
    else if (data.name.length > 100) errors.name = 'Name must be under 100 characters';
  }
  if (data.email !== undefined) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Valid email is required';
  }
  if (data.password !== undefined) {
    if (!data.currentPassword) errors.currentPassword = 'Current password is required to set a new password';
    if (data.password.length < 6) errors.password = 'Password must be at least 6 characters';
  }
  return { isValid: Object.keys(errors).length === 0, errors };
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/shared/validation.js packages/shared/validation.mjs
git commit -m "feat: add validateProfileInput to shared validation"
```

---

## Task 5: Profile update API

**Files:**
- Modify: `packages/server/src/controllers/authController.js`
- Modify: `packages/server/src/routes/auth.js`
- Modify: `packages/server/__tests__/api.test.js`

- [ ] **Step 1: Write failing tests**

Add a new `describe` block in `api.test.js` after the Auth describe block:

```js
describe('Profile update', () => {
  let profileToken;

  beforeAll(async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Profile User',
      email: 'profile@example.com',
      password: 'password123',
    });
    profileToken = res.body.token;
  });

  it('PUT /auth/profile — updates name', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${profileToken}`)
      .send({ name: 'Updated Name' });

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Updated Name');
  });

  it('PUT /auth/profile — updates email', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${profileToken}`)
      .send({ email: 'updated@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('updated@example.com');
  });

  it('PUT /auth/profile — rejects duplicate email', async () => {
    // testUser already registered with test@example.com
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${profileToken}`)
      .send({ email: 'test@example.com' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('PUT /auth/profile — changes password with correct current password', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${profileToken}`)
      .send({ currentPassword: 'password123', password: 'newpass456' });

    expect(res.status).toBe(200);

    // Verify new password works for login
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'updated@example.com',
      password: 'newpass456',
    });
    expect(loginRes.status).toBe(200);
  });

  it('PUT /auth/profile — rejects wrong current password', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${profileToken}`)
      .send({ currentPassword: 'wrongpassword', password: 'newpass789' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('WRONG_PASSWORD');
  });

  it('PUT /auth/profile — rejects new password without currentPassword', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${profileToken}`)
      .send({ password: 'newpass789' });

    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd packages/server && NODE_ENV=test npx jest --runInBand --forceExit --testNamePattern="Profile update"
```

Expected: most tests FAIL (the stub only handles name/avatar)

- [ ] **Step 3: Replace `updateProfile` in `authController.js`**

Replace the existing `updateProfile` function (lines 47–57):

```js
async function updateProfile(req, res, next) {
  try {
    const { name, email, currentPassword, password } = req.body;
    const user = req.user;

    if (name !== undefined) {
      user.name = name.trim();
    }

    if (email !== undefined && email.toLowerCase() !== user.email) {
      const taken = await User.findOne({ email: email.toLowerCase(), _id: { $ne: user._id } });
      if (taken) {
        return res.status(409).json({ error: { message: 'Email already in use', code: 'EMAIL_TAKEN' } });
      }
      user.email = email.toLowerCase();
    }

    if (password !== undefined) {
      if (!currentPassword) {
        return res.status(400).json({ error: { message: 'Current password is required', code: 'MISSING_CURRENT_PASSWORD' } });
      }
      const correct = await user.comparePassword(currentPassword);
      if (!correct) {
        return res.status(400).json({ error: { message: 'Current password is incorrect', code: 'WRONG_PASSWORD' } });
      }
      user.password = password;
    }

    await user.save();
    res.json({ user });
  } catch (err) {
    next(err);
  }
}
```

- [ ] **Step 4: Add validation middleware to the route in `auth.js`**

Replace:
```js
router.put('/profile', auth, updateProfile);
```
With:
```js
const { validateProfileInput } = require('@mindful-flow/shared/validation');
router.put('/profile', auth, validate(validateProfileInput), updateProfile);
```

Also add `validateProfileInput` to the existing destructured import at line 4:
```js
const { validateAuthInput, validateProfileInput } = require('@mindful-flow/shared/validation');
```

- [ ] **Step 5: Run profile update tests**

```bash
cd packages/server && NODE_ENV=test npx jest --runInBand --forceExit --testNamePattern="Profile update"
```

Expected: all 6 tests PASS

- [ ] **Step 6: Run full suite**

```bash
cd packages/server && NODE_ENV=test npx jest --runInBand --forceExit
```

Expected: all tests PASS

- [ ] **Step 7: Commit**

```bash
git add packages/server/src/controllers/authController.js packages/server/src/routes/auth.js packages/server/__tests__/api.test.js
git commit -m "feat: implement full profile update (name, email, password)"
```

---

## Task 6: AuthContext — expose updateUser

**Files:**
- Modify: `packages/client/src/context/AuthContext.jsx`

- [ ] **Step 1: Add `updateUser` to AuthContext**

Replace the full file content:

```jsx
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then((res) => setUser(res.data.user))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data;
  }

  async function register(name, email, password) {
    const res = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data;
  }

  function logout() {
    localStorage.removeItem('token');
    setUser(null);
  }

  function updateUser(updatedUser) {
    setUser(updatedUser);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/client/src/context/AuthContext.jsx
git commit -m "feat: expose updateUser in AuthContext for profile edit"
```

---

## Task 7: Settings page — profile editing UI

**Files:**
- Modify: `packages/client/src/pages/Settings.jsx`

- [ ] **Step 1: Replace the full Settings.jsx**

```jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

const THEME_OPTIONS = [
  { value: 'light', icon: '☀️', label: 'Light' },
  { value: 'dark',  icon: '🌙', label: 'Dark'  },
  { value: 'auto',  icon: '💻', label: 'Auto'  },
];

function ProfileCard({ user, updateUser }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setError('');
    setSaved(false);
    setLoading(true);
    try {
      const body = {};
      if (name !== user.name) body.name = name;
      if (email !== user.email) body.email = email;
      if (Object.keys(body).length === 0) { setEditing(false); setLoading(false); return; }

      const res = await api.put('/auth/profile', body);
      updateUser(res.data.user);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to save. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setError('');
    setEditing(false);
  }

  return (
    <div className="bg-surface-container-lowest rounded-3xl p-5 mb-4 border border-outline-variant/20">
      <p className="text-xs font-bold text-on-surface-variant tracking-widest uppercase mb-3">Profile</p>

      {!editing ? (
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold font-headline text-xl flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-headline font-semibold text-on-surface truncate">{user?.name}</div>
            <div className="text-sm text-on-surface-variant truncate">{user?.email}</div>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10 rounded-xl transition-colors"
          >
            Edit
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-outline-variant/30 bg-surface text-on-surface text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-outline-variant/30 bg-surface text-on-surface text-sm focus:outline-none focus:border-primary"
            />
          </div>
          {error && <p className="text-xs text-error">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleCancel}
              className="flex-1 py-2.5 border border-outline-variant/30 text-on-surface font-semibold rounded-2xl text-sm hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 py-2.5 bg-primary text-on-primary font-semibold rounded-2xl text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {saved && (
        <p className="text-xs text-success font-semibold mt-2">Profile updated.</p>
      )}
    </div>
  );
}

function PasswordCard() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setError('');
    setSaved(false);
    if (!currentPassword || !newPassword) {
      setError('Both fields are required.');
      return;
    }
    setLoading(true);
    try {
      await api.put('/auth/profile', { currentPassword, password: newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to update password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-surface-container-lowest rounded-3xl p-5 mb-4 border border-outline-variant/20">
      <p className="text-xs font-bold text-on-surface-variant tracking-widest uppercase mb-3">Security</p>
      <p className="font-headline font-semibold text-on-surface mb-3">Change Password</p>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-1">Current password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl border border-outline-variant/30 bg-surface text-on-surface text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-1">New password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl border border-outline-variant/30 bg-surface text-on-surface text-sm focus:outline-none focus:border-primary"
          />
        </div>
        {error && <p className="text-xs text-error">{error}</p>}
        {saved && <p className="text-xs text-success font-semibold">Password updated.</p>}
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full py-2.5 bg-primary text-on-primary font-semibold rounded-2xl text-sm hover:opacity-90 transition-opacity disabled:opacity-50 mt-1"
        >
          {loading ? 'Updating…' : 'Update Password'}
        </button>
      </div>
    </div>
  );
}

export default function Settings() {
  const { user, logout, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="font-headline text-3xl font-extrabold text-on-surface mb-1">Settings</h1>
        <p className="text-on-surface-variant text-sm">Manage your preferences</p>
      </div>

      <ProfileCard user={user} updateUser={updateUser} />
      <PasswordCard />

      {/* Appearance */}
      <div className="bg-surface-container-lowest rounded-3xl p-5 mb-4 border border-outline-variant/20">
        <p className="text-xs font-bold text-on-surface-variant tracking-widest uppercase mb-3">
          Appearance
        </p>
        <p className="font-headline font-semibold text-on-surface mb-3">Theme</p>
        <div className="grid grid-cols-3 gap-3">
          {THEME_OPTIONS.map(({ value, icon, label }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              aria-pressed={theme === value}
              className={`py-3 rounded-2xl border-2 flex flex-col items-center gap-1 transition-colors text-sm font-semibold ${
                theme === value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-outline-variant/30 text-on-surface-variant hover:border-primary/40'
              }`}
            >
              <span className="text-xl">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-on-surface-variant text-center mt-3">
          Auto follows your device's system setting
        </p>
      </div>

      {/* Account */}
      <div className="bg-surface-container-lowest rounded-3xl overflow-hidden border border-outline-variant/20">
        <p className="text-xs font-bold text-on-surface-variant tracking-widest uppercase px-5 pt-5 pb-3">
          Account
        </p>
        <div className="px-5 py-4 border-t border-outline-variant/15">
          <button
            onClick={logout}
            className="w-full py-3 rounded-2xl bg-tertiary/10 text-tertiary font-semibold text-sm hover:bg-tertiary/15 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Manually verify in browser**

Start the dev server and verify:
1. Navigate to `/settings`
2. Click "Edit" on the profile card — name and email fields appear
3. Change name → Save → greeting in nav updates immediately
4. Change email to an already-registered email → inline error appears
5. Enter wrong current password → inline error appears
6. Enter correct current password + new password → "Password updated" appears

- [ ] **Step 3: Commit**

```bash
git add packages/client/src/pages/Settings.jsx
git commit -m "feat: add editable profile and password change to Settings"
```

---

## Task 8: Analytics — server from/to params

**Files:**
- Modify: `packages/server/src/controllers/analyticsController.js`
- Modify: `packages/server/__tests__/api.test.js`

- [ ] **Step 1: Write a failing test**

Add inside the analytics describe block in `api.test.js` (or add a new describe block):

```js
describe('Analytics — monthly with from/to', () => {
  it('GET /analytics/monthly — supports from/to date range params', async () => {
    const res = await request(app)
      .get('/api/analytics/monthly')
      .set('Authorization', `Bearer ${token}`)
      .query({ from: '2026-01-01', to: '2026-01-30' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('days');
    expect(Array.isArray(res.body.days)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd packages/server && NODE_ENV=test npx jest --runInBand --forceExit --testNamePattern="monthly with from/to"
```

Expected: FAIL — `from/to` not supported yet (returns wrong data or 500)

- [ ] **Step 3: Update `getMonthlyAnalytics` in `analyticsController.js`**

Replace only the `getMonthlyAnalytics` function (lines 51–72):

```js
async function getMonthlyAnalytics(req, res, next) {
  try {
    const userId = req.user._id;
    let start, end;

    if (req.query.from && req.query.to) {
      start = normalizeDate(req.query.from);
      end = normalizeDate(req.query.to);
      end.setUTCDate(end.getUTCDate() + 1); // inclusive end
    } else {
      const month = parseInt(req.query.month) || new Date().getMonth() + 1;
      const year = parseInt(req.query.year) || new Date().getFullYear();
      ({ start, end } = getMonthRange(month, year));
    }

    const completions = await Completion.find({ userId, date: { $gte: start, $lt: end } }).populate('habitId', 'name icon color');

    const daysMap = {};
    for (const c of completions) {
      const key = normalizeDate(c.date).toISOString().split('T')[0];
      if (!daysMap[key]) daysMap[key] = [];
      daysMap[key].push(c);
    }

    const days = Object.entries(daysMap).map(([date, comps]) => ({ date, completions: comps }));
    res.json({ days });
  } catch (err) {
    next(err);
  }
}
```

- [ ] **Step 4: Run test**

```bash
cd packages/server && NODE_ENV=test npx jest --runInBand --forceExit --testNamePattern="monthly with from/to"
```

Expected: PASS

- [ ] **Step 5: Run full suite**

```bash
cd packages/server && NODE_ENV=test npx jest --runInBand --forceExit
```

Expected: all tests PASS

- [ ] **Step 6: Commit**

```bash
git add packages/server/src/controllers/analyticsController.js packages/server/__tests__/api.test.js
git commit -m "feat: add from/to date range support to monthly analytics endpoint"
```

---

## Task 9: Analytics hooks — useLast30DaysAnalytics

**Files:**
- Modify: `packages/client/src/hooks/useAnalytics.js`

- [ ] **Step 1: Add the new hook**

Add after the `useHabitAnalytics` export:

```js
export function useLast30DaysAnalytics() {
  const to = new Date();
  to.setUTCHours(0, 0, 0, 0);
  const from = new Date(to);
  from.setUTCDate(to.getUTCDate() - 29);

  const fromStr = from.toISOString().split('T')[0];
  const toStr = to.toISOString().split('T')[0];

  return useQuery({
    queryKey: ['analytics', 'last30', fromStr, toStr],
    queryFn: () =>
      api.get('/analytics/monthly', { params: { from: fromStr, to: toStr } }).then((r) => r.data),
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/client/src/hooks/useAnalytics.js
git commit -m "feat: add useLast30DaysAnalytics hook"
```

---

## Task 10: Analytics page — view toggle and month/30-day layout

**Files:**
- Modify: `packages/client/src/pages/Analytics.jsx`

- [ ] **Step 1: Replace the full Analytics.jsx**

```jsx
import { lazy, Suspense, useState } from 'react';
import { useWeeklyAnalytics, useMonthlyAnalytics, useLast30DaysAnalytics } from '../hooks/useAnalytics';
import { useHabits } from '../hooks/useHabits';
import { useWeeklyConsistency } from '../hooks/useWeeklyConsistency';
import AnimatedList, { AnimatedItem } from '../components/AnimatedList';

const LazyTrendChart = lazy(() =>
  import('../components/ChartBlock').then((m) => ({ default: m.TrendChart }))
);
const LazyComparisonBar = lazy(() =>
  import('../components/ChartBlock').then((m) => ({ default: m.ComparisonBar }))
);

function TrendChart(props) {
  return <Suspense fallback={<div className="skeleton h-[200px] rounded-2xl" />}><LazyTrendChart {...props} /></Suspense>;
}
function ComparisonBar(props) {
  return <Suspense fallback={<div className="skeleton h-8 rounded-xl" />}><LazyComparisonBar {...props} /></Suspense>;
}

const VIEWS = [
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: '30days', label: '30 Days' },
];

// Derive period score, completed count, and target count from days array + habits
function derivePeriodStats(days, habits) {
  if (!days || !habits) return { score: 0, completedCount: 0, targetCount: 0 };
  const totalDays = days.length || 1;
  const completedCount = days.reduce((sum, d) => sum + d.completions.length, 0);
  let targetCount = 0;
  for (const h of habits) {
    if (h.frequency === 'daily') targetCount += totalDays;
    else targetCount += Math.round((totalDays / 7) * h.target);
  }
  const score = targetCount > 0 ? Math.round((completedCount / targetCount) * 100) : 0;
  return { score, completedCount, targetCount };
}

// Simple heatmap: day cells colored by whether any completions exist
function PeriodHeatmap({ days }) {
  if (!days || days.length === 0) {
    return <p className="text-on-surface-variant text-sm">No data for this period.</p>;
  }

  const dayMap = {};
  for (const d of days) dayMap[d.date] = d.completions.length;

  // Build a sorted list of all dates in the period
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const maxCount = Math.max(...sorted.map((d) => d.completions.length), 1);

  return (
    <div className="flex flex-wrap gap-1.5">
      {sorted.map((d) => {
        const count = d.completions.length;
        const intensity = count === 0 ? 0 : Math.min(count / maxCount, 1);
        const label = new Date(d.date + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
        return (
          <div
            key={d.date}
            title={`${label}: ${count} completion${count !== 1 ? 's' : ''}`}
            className="w-5 h-5 rounded-sm"
            style={{
              backgroundColor: count === 0
                ? 'var(--color-surface-container, #eaeff2)'
                : `rgba(0, 91, 196, ${0.2 + intensity * 0.8})`,
            }}
          />
        );
      })}
    </div>
  );
}

function HabitBreakdown({ habits, consistency }) {
  const habitRates = new Map((consistency?.habits || []).map((h) => [h.habitId, Math.round(h.rate * 100)]));
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {habits.map((habit) => {
        const colorClass = habit.color === 'secondary' ? 'bg-secondary' : habit.color === 'tertiary' ? 'bg-tertiary' : 'bg-primary';
        const iconBg = habit.color === 'secondary' ? 'bg-secondary/10 text-secondary' : habit.color === 'tertiary' ? 'bg-tertiary/10 text-tertiary' : 'bg-primary/10 text-primary';
        const rate = habitRates.get(habit._id) || 0;
        return (
          <div key={habit._id} className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/5 hover:shadow-xl transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>
                <span className="material-symbols-outlined text-xl">{habit.icon}</span>
              </div>
              <span className={`text-lg font-extrabold ${rate >= 80 ? 'text-success' : rate >= 50 ? 'text-warning' : 'text-error'}`}>
                {rate}%
              </span>
            </div>
            <h4 className="font-semibold text-on-surface mb-1">{habit.name}</h4>
            <p className="text-xs text-on-surface-variant mb-4">{habit.description || habit.frequency}</p>
            <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
              <div className={`${colorClass} h-full rounded-full`} style={{ width: `${rate}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Analytics() {
  const [view, setView] = useState('week');

  const { data: weekly } = useWeeklyAnalytics();
  const { data: habits = [] } = useHabits();
  const { data: consistency } = useWeeklyConsistency();

  const now = new Date();
  const { data: monthly } = useMonthlyAnalytics(now.getMonth() + 1, now.getFullYear());
  const { data: last30 } = useLast30DaysAnalytics();

  const periodData = view === 'month' ? monthly : view === '30days' ? last30 : null;
  const periodStats = derivePeriodStats(periodData?.days, habits);

  const weekBarData = [
    { label: 'THIS WEEK', completed: weekly?.completedCount || 0, target: weekly?.targetCount || 0 },
  ];
  const periodBarData = [
    { label: view === 'month' ? 'THIS MONTH' : 'LAST 30 DAYS', completed: periodStats.completedCount, target: periodStats.targetCount },
  ];

  return (
    <>
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-headline font-extrabold text-3xl md:text-4xl tracking-tight text-on-surface mb-2">Performance</h1>
          <p className="text-on-surface-variant text-lg">
            {view === 'week' ? 'Score, trends, and per-habit rates for this week.' : view === 'month' ? 'Your performance this calendar month.' : 'Your performance over the last 30 days.'}
          </p>
        </div>
        {/* View toggle */}
        <div className="flex gap-1 bg-surface-container rounded-xl p-1 self-start md:self-auto">
          {VIEWS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              aria-pressed={view === key}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                view === key
                  ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === 'week' && (
        <AnimatedList className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
          <AnimatedItem className="md:col-span-4">
            <div className="bg-surface-container-lowest p-8 rounded-3xl flex flex-col justify-between h-full">
              <div>
                <span className="text-xs font-bold tracking-widest text-primary uppercase bg-primary-container/10 px-3 py-1 rounded-full">Current Status</span>
                <div className="mt-8">
                  <h2 className="font-headline text-5xl font-extrabold text-on-surface leading-none">{weekly?.score || 0}%</h2>
                  <p className="text-on-surface-variant font-medium mt-2">Weekly Score</p>
                  <p className="text-xs text-on-surface-variant/60 mt-1">% of weekly targets completed</p>
                </div>
              </div>
              <div className="mt-12">
                <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: `${weekly?.score || 0}%` }} />
                </div>
              </div>
            </div>
          </AnimatedItem>

          <AnimatedItem className="md:col-span-8">
            <div className="bg-surface-container-lowest p-8 rounded-3xl h-full">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-headline font-bold text-xl">Consistency Trend</h3>
              </div>
              <TrendChart data={weekly?.dayData || []} />
            </div>
          </AnimatedItem>

          <AnimatedItem className="md:col-span-7">
            <div className="bg-surface-container-lowest p-8 rounded-3xl h-full">
              <h3 className="font-headline font-bold text-xl mb-8">Completed vs Target</h3>
              <ComparisonBar data={weekBarData} />
            </div>
          </AnimatedItem>

          <AnimatedItem className="md:col-span-5">
            <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/5 h-full">
              <span className="text-xs font-bold tracking-widest text-on-surface-variant uppercase mb-4 block">Streak</span>
              <div className="mt-4">
                <h3 className="font-headline text-5xl font-extrabold text-on-surface leading-none">{weekly?.streak || 0}</h3>
                <p className="text-on-surface-variant font-medium mt-2">consecutive days</p>
              </div>
              {weekly?.bestDay && (
                <p className="text-sm text-on-surface-variant mt-6">
                  Strongest day this week: <span className="font-bold text-on-surface">{weekly.bestDay}</span>
                </p>
              )}
            </div>
          </AnimatedItem>

          <AnimatedItem className="md:col-span-12 mt-4">
            <div>
              <h3 className="font-headline font-bold text-xl mb-6">Habit Breakdown</h3>
              <HabitBreakdown habits={habits} consistency={consistency} />
            </div>
          </AnimatedItem>
        </AnimatedList>
      )}

      {(view === 'month' || view === '30days') && (
        <AnimatedList className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
          <AnimatedItem className="md:col-span-4">
            <div className="bg-surface-container-lowest p-8 rounded-3xl flex flex-col justify-between h-full">
              <div>
                <span className="text-xs font-bold tracking-widest text-primary uppercase bg-primary-container/10 px-3 py-1 rounded-full">Period Score</span>
                <div className="mt-8">
                  <h2 className="font-headline text-5xl font-extrabold text-on-surface leading-none">{periodStats.score}%</h2>
                  <p className="text-on-surface-variant font-medium mt-2">{view === 'month' ? 'This Month' : 'Last 30 Days'}</p>
                  <p className="text-xs text-on-surface-variant/60 mt-1">
                    {periodStats.completedCount} of {periodStats.targetCount} targets hit
                  </p>
                </div>
              </div>
              <div className="mt-12">
                <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: `${periodStats.score}%` }} />
                </div>
              </div>
            </div>
          </AnimatedItem>

          <AnimatedItem className="md:col-span-8">
            <div className="bg-surface-container-lowest p-8 rounded-3xl h-full">
              <h3 className="font-headline font-bold text-xl mb-6">Activity Heatmap</h3>
              <PeriodHeatmap days={periodData?.days || []} />
            </div>
          </AnimatedItem>

          <AnimatedItem className="md:col-span-7">
            <div className="bg-surface-container-lowest p-8 rounded-3xl h-full">
              <h3 className="font-headline font-bold text-xl mb-8">Completed vs Target</h3>
              <ComparisonBar data={periodBarData} />
            </div>
          </AnimatedItem>

          <AnimatedItem className="md:col-span-5">
            <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/5 h-full">
              <span className="text-xs font-bold tracking-widest text-on-surface-variant uppercase mb-4 block">Streak</span>
              <div className="mt-4">
                <h3 className="font-headline text-5xl font-extrabold text-on-surface leading-none">{weekly?.streak || 0}</h3>
                <p className="text-on-surface-variant font-medium mt-2">consecutive days</p>
              </div>
            </div>
          </AnimatedItem>

          <AnimatedItem className="md:col-span-12 mt-4">
            <div>
              <h3 className="font-headline font-bold text-xl mb-6">Habit Breakdown</h3>
              <HabitBreakdown habits={habits} consistency={consistency} />
            </div>
          </AnimatedItem>
        </AnimatedList>
      )}
    </>
  );
}
```

- [ ] **Step 2: Manually verify in browser**

1. Navigate to `/analytics`
2. Default shows Week view — unchanged layout
3. Click "Month" — period score card appears, heatmap shows colored squares for days with completions
4. Click "30 Days" — same layout, different date range
5. Toggle back to Week — original layout restored

- [ ] **Step 3: Commit**

```bash
git add packages/client/src/pages/Analytics.jsx
git commit -m "feat: add Week/Month/30-day view toggle to Analytics page"
```

---

## Task 11: Final verification

- [ ] **Step 1: Run full API test suite**

```bash
cd packages/server && NODE_ENV=test npx jest --runInBand --forceExit
```

Expected: all tests PASS

- [ ] **Step 2: Smoke-test the deployed flow manually**

Start dev server: `pnpm dev` from repo root.

Test each feature end-to-end:
1. Register a new account → notification bell shows "You're on your way" after first habit
2. Create a habit → check it off → bell shows "First check-in"
3. Settings → Edit profile → change name → nav greeting updates immediately
4. Settings → Change password → log out → log back in with new password
5. Analytics → toggle Week/Month/30 Days → data updates for each view

- [ ] **Step 3: Final commit tag**

```bash
git add -A
git commit -m "chore: MVP completion — notifications, profile editing, analytics time range"
```
