# Weekly Tracking & Categories Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add user-created habit categories, hybrid tracking (checkmark + duration), and a weekly consistency page with discipline scores and week history.

**Architecture:** New Category model + CRUD API, extended Habit model with categoryId/trackingType/weeklyTarget, new weekly-consistency analytics endpoint, new Weekly page with consistency table, category filtering, and week history cards.

**Tech Stack:** MongoDB/Mongoose, Express, React 19, TanStack React Query, Framer Motion, Tailwind CSS 3

---

### Task 1: Shared Constants & Validation

**Files:**
- Modify: `packages/shared/constants.js`
- Modify: `packages/shared/validation.js`

- [ ] **Step 1: Add TRACKING_TYPES and CATEGORY_COLORS constants**

In `packages/shared/constants.js`, add after `HABIT_ICONS`:

```javascript
const TRACKING_TYPES = {
  CHECKMARK: 'checkmark',
  DURATION: 'duration',
};

const CATEGORY_COLORS = [
  '#8b5cf6', '#22c55e', '#f59e0b', '#3b82f6', '#ef4444',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
];
```

Update `module.exports` to include `TRACKING_TYPES, CATEGORY_COLORS`.

- [ ] **Step 2: Add validateCategoryInput function**

In `packages/shared/validation.js`, add:

```javascript
function validateCategoryInput(data) {
  const errors = {};
  if (!data.name || data.name.trim().length === 0) {
    errors.name = 'Category name is required';
  }
  if (data.name && data.name.length > 50) {
    errors.name = 'Category name must be under 50 characters';
  }
  if (!data.color || !/^#[0-9a-fA-F]{6}$/.test(data.color)) {
    errors.color = 'Valid hex color is required';
  }
  return { isValid: Object.keys(errors).length === 0, errors };
}
```

Update `module.exports` to include `validateCategoryInput`.

- [ ] **Step 3: Update validateHabitInput for new fields**

In the `validateHabitInput` function, add after the color validation:

```javascript
if (data.trackingType && !Object.values(TRACKING_TYPES).includes(data.trackingType)) {
  errors.trackingType = 'Tracking type must be "checkmark" or "duration"';
}
if (data.trackingType === TRACKING_TYPES.DURATION) {
  if (!data.weeklyTarget || data.weeklyTarget < 1 || data.weeklyTarget > 168) {
    errors.weeklyTarget = 'Weekly target must be between 1 and 168 hours';
  }
}
```

Add `const { TRACKING_TYPES } = require('./constants');` at the top (it already imports FREQUENCIES and COLORS).

- [ ] **Step 4: Commit**

```bash
git add packages/shared/constants.js packages/shared/validation.js
git commit -m "feat: add tracking types, category colors, and validation"
```

---

### Task 2: Category Model & API

**Files:**
- Create: `packages/server/src/models/Category.js`
- Create: `packages/server/src/controllers/categoriesController.js`
- Create: `packages/server/src/routes/categories.js`
- Modify: `packages/server/src/index.js`

- [ ] **Step 1: Create Category model**

Create `packages/server/src/models/Category.js`:

```javascript
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Category name is required'], trim: true, maxlength: 50 },
  color: { type: String, required: [true, 'Color is required'], match: /^#[0-9a-fA-F]{6}$/ },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
}, { timestamps: true });

categorySchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
```

- [ ] **Step 2: Create categories controller**

Create `packages/server/src/controllers/categoriesController.js`:

```javascript
const Category = require('../models/Category');
const Habit = require('../models/Habit');

async function getCategories(req, res, next) {
  try {
    const categories = await Category.find({ userId: req.user._id }).sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    next(err);
  }
}

async function createCategory(req, res, next) {
  try {
    const { name, color } = req.body;
    const category = await Category.create({ name, color, userId: req.user._id });
    res.status(201).json(category);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: { message: 'Category name already exists', code: 'DUPLICATE' } });
    }
    next(err);
  }
}

async function updateCategory(req, res, next) {
  try {
    const category = await Category.findOne({ _id: req.params.id, userId: req.user._id });
    if (!category) {
      return res.status(404).json({ error: { message: 'Category not found', code: 'NOT_FOUND' } });
    }
    if (req.body.name !== undefined) category.name = req.body.name;
    if (req.body.color !== undefined) category.color = req.body.color;
    await category.save();
    res.json(category);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: { message: 'Category name already exists', code: 'DUPLICATE' } });
    }
    next(err);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const category = await Category.findOne({ _id: req.params.id, userId: req.user._id });
    if (!category) {
      return res.status(404).json({ error: { message: 'Category not found', code: 'NOT_FOUND' } });
    }
    await Habit.updateMany({ categoryId: category._id }, { $set: { categoryId: null } });
    await Category.deleteOne({ _id: category._id });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
```

- [ ] **Step 3: Create categories routes**

Create `packages/server/src/routes/categories.js`:

```javascript
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { validateCategoryInput } = require('@mindful-flow/shared/validation');
const { getCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/categoriesController');

router.use(auth);
router.get('/', getCategories);
router.post('/', validate(validateCategoryInput), createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

module.exports = router;
```

- [ ] **Step 4: Mount categories routes in index.js**

In `packages/server/src/index.js`, add after line 17 (`app.use('/api/notifications', ...)`):

```javascript
app.use('/api/categories', require('./routes/categories'));
```

- [ ] **Step 5: Commit**

```bash
git add packages/server/src/models/Category.js packages/server/src/controllers/categoriesController.js packages/server/src/routes/categories.js packages/server/src/index.js
git commit -m "feat: add Category model and CRUD API"
```

---

### Task 3: Extend Habit Model & API

**Files:**
- Modify: `packages/server/src/models/Habit.js`
- Modify: `packages/server/src/controllers/habitsController.js`

- [ ] **Step 1: Add new fields to Habit schema**

In `packages/server/src/models/Habit.js`, add the import:

```javascript
const { FREQUENCIES, COLORS, TRACKING_TYPES } = require('@mindful-flow/shared/constants');
```

Add these fields to the schema (after `description`):

```javascript
categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
trackingType: { type: String, enum: Object.values(TRACKING_TYPES), default: 'checkmark' },
weeklyTarget: { type: Number, default: null, min: 1, max: 168 },
```

- [ ] **Step 2: Update habitsController to handle new fields**

In `packages/server/src/controllers/habitsController.js`:

**getHabits** — add `.populate('categoryId', 'name color')` after `.sort({ createdAt: -1 })`:

```javascript
const habits = await Habit.find(filter).sort({ createdAt: -1 }).populate('categoryId', 'name color');
```

**createHabit** — add the new fields to the destructuring and create call:

```javascript
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
res.status(201).json(populated);
```

**updateHabit** — expand the allowed fields array:

```javascript
const allowed = ['name', 'icon', 'color', 'frequency', 'target', 'description', 'categoryId', 'trackingType', 'weeklyTarget'];
```

Add after the `if (habit.frequency === 'daily') habit.target = 1;` line:

```javascript
if (habit.trackingType === 'duration') {
  habit.frequency = 'weekly';
}
if (habit.trackingType === 'checkmark') {
  habit.weeklyTarget = null;
}
```

Add populate before response:

```javascript
await habit.save();
const populated = await habit.populate('categoryId', 'name color');
res.json(populated);
```

- [ ] **Step 3: Commit**

```bash
git add packages/server/src/models/Habit.js packages/server/src/controllers/habitsController.js
git commit -m "feat: extend Habit model with categoryId, trackingType, weeklyTarget"
```

---

### Task 4: Weekly Consistency Analytics Endpoint

**Files:**
- Modify: `packages/server/src/controllers/analyticsController.js`
- Modify: `packages/server/src/routes/analytics.js`

- [ ] **Step 1: Add weeklyConsistency function to analyticsController**

Add this function to `packages/server/src/controllers/analyticsController.js`:

```javascript
async function weeklyConsistency(req, res, next) {
  try {
    const userId = req.user._id;
    const weekParam = req.query.week;

    let weekStart;
    if (weekParam) {
      weekStart = normalizeDate(weekParam);
    } else {
      const now = new Date();
      const day = now.getUTCDay();
      const diff = day === 0 ? 6 : day - 1;
      weekStart = new Date(now);
      weekStart.setUTCDate(now.getUTCDate() - diff);
      weekStart.setUTCHours(0, 0, 0, 0);
    }

    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 7);

    const habits = await Habit.find({ userId, isActive: true }).populate('categoryId', 'name color');
    const completions = await Completion.find({
      userId,
      date: { $gte: weekStart, $lt: weekEnd },
    });

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = normalizeDate(new Date());

    const habitRows = habits.map((habit) => {
      const days = {};
      let completedDays = 0;
      let totalHours = 0;

      for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setUTCDate(weekStart.getUTCDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const dayName = dayNames[i];

        const completion = completions.find(
          (c) => (c.habitId.toString() === habit._id.toString()) &&
                 normalizeDate(c.date).toISOString().split('T')[0] === dateStr
        );

        const isFuture = d > today;
        if (completion) {
          days[dayName] = { completed: true, value: completion.value };
          if (habit.trackingType === 'duration') {
            totalHours += completion.value;
          }
          completedDays++;
        } else {
          days[dayName] = { completed: false, value: 0, isFuture };
        }
      }

      const row = {
        habitId: habit._id,
        name: habit.name,
        icon: habit.icon,
        trackingType: habit.trackingType || 'checkmark',
        category: habit.categoryId ? { name: habit.categoryId.name, color: habit.categoryId.color } : null,
        days,
      };

      if (habit.trackingType === 'duration') {
        row.weeklyTarget = habit.weeklyTarget;
        row.totalHours = totalHours;
        row.rate = habit.weeklyTarget > 0 ? Math.min(totalHours / habit.weeklyTarget, 1) : 0;
      } else {
        const activeDays = Object.values(days).filter((d) => !d.isFuture).length;
        row.rate = activeDays > 0 ? completedDays / activeDays : 0;
      }

      return row;
    });

    const dailyScores = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setUTCDate(weekStart.getUTCDate() + i);
      const dayName = dayNames[i];
      const isFuture = d > today;

      if (isFuture) {
        dailyScores[dayName] = null;
        continue;
      }

      let completed = 0;
      for (const habit of habitRows) {
        if (habit.days[dayName].completed) completed++;
      }
      dailyScores[dayName] = habitRows.length > 0 ? completed / habitRows.length : 0;
    }

    const activeDailyScores = Object.values(dailyScores).filter((s) => s !== null);
    const overallScore = activeDailyScores.length > 0
      ? activeDailyScores.reduce((a, b) => a + b, 0) / activeDailyScores.length
      : 0;

    res.json({
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: new Date(weekEnd.getTime() - 86400000).toISOString().split('T')[0],
      habits: habitRows,
      dailyScores,
      overallScore: Math.round(overallScore * 100) / 100,
    });
  } catch (err) {
    next(err);
  }
}
```

Update the `module.exports` to include `weeklyConsistency`.

- [ ] **Step 2: Add route for weekly-consistency**

In `packages/server/src/routes/analytics.js`, add the import of `weeklyConsistency` and the route:

```javascript
const { getWeeklyAnalytics, getMonthlyAnalytics, getHabitAnalytics, weeklyConsistency } = require('../controllers/analyticsController');
```

Add before `module.exports`:

```javascript
router.get('/weekly-consistency', weeklyConsistency);
```

- [ ] **Step 3: Commit**

```bash
git add packages/server/src/controllers/analyticsController.js packages/server/src/routes/analytics.js
git commit -m "feat: add weekly consistency analytics endpoint"
```

---

### Task 5: Client Categories Hook & Modal

**Files:**
- Create: `packages/client/src/hooks/useCategories.js`
- Create: `packages/client/src/components/CategoryModal.jsx`

- [ ] **Step 1: Create useCategories hook**

Create `packages/client/src/hooks/useCategories.js`:

```javascript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((r) => r.data),
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/categories', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/categories/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ queryKey: ['habits'] });
    },
  });
}
```

- [ ] **Step 2: Create CategoryModal component**

Create `packages/client/src/components/CategoryModal.jsx`:

```javascript
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CATEGORY_COLORS } from '@mindful-flow/shared/constants';

export default function CategoryModal({ open, onClose, onSave, category = null }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(CATEGORY_COLORS[0]);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setColor(category.color);
    } else {
      setName('');
      setColor(CATEGORY_COLORS[0]);
    }
  }, [category, open]);

  function handleSubmit(e) {
    e.preventDefault();
    onSave({ name: name.trim(), color });
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            className="relative w-full max-w-sm bg-surface-container-lowest rounded-3xl shadow-xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <h2 className="text-xl font-bold font-headline">{category ? 'Edit Category' : 'New Category'}</h2>
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={50}
                  className="w-full px-4 py-3 rounded-xl bg-surface-container border-none focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-on-surface-variant/40 font-medium"
                  placeholder="e.g., Religion"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-1">Color</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-9 h-9 rounded-full transition-all ${color === c ? 'ring-4 ring-offset-2 ring-primary/30 scale-110' : 'hover:scale-105'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose}
                  className="flex-1 py-3 border border-outline-variant/30 text-on-surface font-bold rounded-xl hover:bg-surface-container transition-colors">Cancel</button>
                <button type="submit"
                  className="flex-1 py-3 bg-primary text-on-primary font-bold rounded-xl shadow hover:opacity-90 active:scale-[0.98] transition-all">
                  {category ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/client/src/hooks/useCategories.js packages/client/src/components/CategoryModal.jsx
git commit -m "feat: add categories hook and CategoryModal component"
```

---

### Task 6: Update HabitModal with Category & Tracking Type

**Files:**
- Modify: `packages/client/src/components/HabitModal.jsx`

- [ ] **Step 1: Add category dropdown and tracking type fields**

In `packages/client/src/components/HabitModal.jsx`:

Add imports:
```javascript
import { HABIT_ICONS, TRACKING_TYPES } from '@mindful-flow/shared/constants';
import { useCategories } from '../hooks/useCategories';
```

Add state variables inside the component:
```javascript
const { data: categories = [] } = useCategories();
const [categoryId, setCategoryId] = useState('');
const [trackingType, setTrackingType] = useState('checkmark');
const [weeklyTarget, setWeeklyTarget] = useState(8);
```

In the `useEffect`, add to the `if (habit)` branch:
```javascript
setCategoryId(habit.categoryId?._id || habit.categoryId || '');
setTrackingType(habit.trackingType || 'checkmark');
setWeeklyTarget(habit.weeklyTarget || 8);
```

In the `else` branch:
```javascript
setCategoryId('');
setTrackingType('checkmark');
setWeeklyTarget(8);
```

Update `handleSubmit`:
```javascript
function handleSubmit(e) {
  e.preventDefault();
  const data = {
    name, icon, color, description,
    categoryId: categoryId || null,
    trackingType,
  };
  if (trackingType === 'checkmark') {
    data.frequency = frequency;
    data.target = frequency === 'daily' ? 1 : target;
  } else {
    data.frequency = 'weekly';
    data.weeklyTarget = weeklyTarget;
    data.target = 1;
  }
  onSave(data);
}
```

Add the Category dropdown field in the form (after the Name input, before Icon):
```jsx
<div>
  <label className="block text-sm font-bold text-on-surface-variant mb-1">Category</label>
  <select
    value={categoryId}
    onChange={(e) => setCategoryId(e.target.value)}
    className="w-full px-5 py-4 rounded-2xl bg-surface-container border-none focus:ring-2 focus:ring-primary/20 text-on-surface font-medium"
  >
    <option value="">None</option>
    {categories.map((cat) => (
      <option key={cat._id} value={cat._id}>{cat.name}</option>
    ))}
  </select>
</div>
```

Add the Tracking Type toggle (after Category, before Icon):
```jsx
<div>
  <label className="block text-sm font-bold text-on-surface-variant mb-1">Tracking Type</label>
  <div className="grid grid-cols-2 p-1.5 bg-surface-container rounded-2xl">
    <button type="button" onClick={() => setTrackingType('checkmark')}
      className={`py-3 rounded-xl font-bold transition-all ${trackingType === 'checkmark' ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-on-surface-variant'}`}>
      ✓ Checkmark
    </button>
    <button type="button" onClick={() => setTrackingType('duration')}
      className={`py-3 rounded-xl font-bold transition-all ${trackingType === 'duration' ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-on-surface-variant'}`}>
      ⏱ Duration
    </button>
  </div>
</div>
```

If `trackingType === 'duration'`, show the weekly target input (and hide the Frequency/Weekly Target range slider):
```jsx
{trackingType === 'duration' && (
  <div>
    <label className="block text-sm font-bold text-on-surface-variant mb-1">Weekly Target (hours)</label>
    <input
      type="number"
      min="1"
      max="168"
      value={weeklyTarget}
      onChange={(e) => setWeeklyTarget(Number(e.target.value))}
      className="w-full px-5 py-4 rounded-2xl bg-surface-container border-none focus:ring-2 focus:ring-primary/20 text-on-surface font-medium"
    />
  </div>
)}
```

The existing Frequency and Weekly Target (range slider) sections should only render when `trackingType === 'checkmark'`:
```jsx
{trackingType === 'checkmark' && (
  <>
    {/* existing Frequency toggle */}
    {/* existing Weekly Target range slider (when frequency === 'weekly') */}
  </>
)}
```

- [ ] **Step 2: Commit**

```bash
git add packages/client/src/components/HabitModal.jsx
git commit -m "feat: add category and tracking type fields to HabitModal"
```

---

### Task 7: Update HabitCard with Category Badge

**Files:**
- Modify: `packages/client/src/components/HabitCard.jsx`

- [ ] **Step 1: Add category badge and duration display**

In `packages/client/src/components/HabitCard.jsx`, update the component to accept new props:

```javascript
export default function HabitCard({ habit, completed, progress = 0, onToggle, weeklyHours = null }) {
```

Add the category badge below the habit name (inside the `<div className="flex items-center gap-3 mb-3">` section, after the `<h3>` tag):

```jsx
<div className="flex items-center gap-3 mb-3">
  <span className={`p-2 rounded-lg ${colors.bg} ${colors.text}`}>
    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{habit.icon}</span>
  </span>
  <div>
    <h3 className="font-headline font-semibold text-lg">{habit.name}</h3>
    {habit.categoryId && (
      <span
        className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-1"
        style={{
          backgroundColor: `${habit.categoryId.color}15`,
          color: habit.categoryId.color,
        }}
      >
        {habit.categoryId.name}
      </span>
    )}
  </div>
</div>
```

For the toggle button area, show hours counter for duration habits:

```jsx
<div className="ml-8">
  {habit.trackingType === 'duration' ? (
    <button onClick={onToggle}
      className={`px-3 py-2 rounded-xl font-bold text-sm transition-all ${
        completed
          ? `${colors.btnBg} text-white`
          : 'border-2 border-outline-variant/30 text-outline-variant hover:border-primary/50'
      }`}>
      {weeklyHours != null ? `${weeklyHours}/${habit.weeklyTarget}h` : `0/${habit.weeklyTarget}h`}
    </button>
  ) : (
    <button onClick={onToggle}
      className={`w-12 h-12 rounded-xl flex items-center justify-center active:scale-95 transition-all ${
        completed
          ? `${colors.btnBg} text-white`
          : 'border-2 border-outline-variant/30 text-outline-variant hover:border-primary/50 hover:text-primary'
      }`}>
      <span className="material-symbols-outlined">{completed ? 'check_circle' : 'radio_button_unchecked'}</span>
    </button>
  )}
</div>
```

- [ ] **Step 2: Commit**

```bash
git add packages/client/src/components/HabitCard.jsx
git commit -m "feat: add category badge and duration display to HabitCard"
```

---

### Task 8: Duration Input Component & Dashboard Integration

**Files:**
- Create: `packages/client/src/components/DurationInput.jsx`
- Modify: `packages/client/src/pages/Dashboard.jsx`

- [ ] **Step 1: Create DurationInput popover component**

Create `packages/client/src/components/DurationInput.jsx`:

```javascript
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DurationInput({ open, onClose, onSubmit, habitName }) {
  const [hours, setHours] = useState(1);

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(hours);
    setHours(1);
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-on-surface/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />
          <motion.div
            className="relative bg-surface-container-lowest rounded-2xl shadow-xl p-6 w-full max-w-xs"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <h3 className="font-headline font-bold text-lg mb-1">Log Time</h3>
            <p className="text-sm text-on-surface-variant mb-4">{habitName}</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-1">Hours</label>
                <input
                  type="number"
                  min="0.5"
                  max="24"
                  step="0.5"
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-surface-container border-none focus:ring-2 focus:ring-primary/20 text-on-surface font-medium text-center text-2xl"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={onClose}
                  className="flex-1 py-3 border border-outline-variant/30 text-on-surface font-bold rounded-xl hover:bg-surface-container transition-colors">Cancel</button>
                <button type="submit"
                  className="flex-1 py-3 bg-primary text-on-primary font-bold rounded-xl shadow hover:opacity-90 active:scale-[0.98] transition-all">Log</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Update Dashboard to handle duration habits**

In `packages/client/src/pages/Dashboard.jsx`:

Add import:
```javascript
import DurationInput from '../components/DurationInput';
```

Add state:
```javascript
const [durationHabit, setDurationHabit] = useState(null);
```

Update `handleToggle` to handle duration habits:
```javascript
function handleToggle(habit) {
  if (habit.trackingType === 'duration') {
    const existing = completions.find((c) => (c.habitId?._id || c.habitId) === habit._id);
    if (existing) {
      deleteCompletion.mutate(existing._id);
    } else {
      setDurationHabit(habit);
    }
    return;
  }
  const existing = completions.find((c) => (c.habitId?._id || c.habitId) === habit._id);
  if (existing) {
    deleteCompletion.mutate(existing._id);
  } else {
    createCompletion.mutate({ habitId: habit._id, date: today });
  }
}

function handleDurationSubmit(hours) {
  createCompletion.mutate({ habitId: durationHabit._id, date: today, value: hours });
  setDurationHabit(null);
}
```

Show all habits (not just daily) and pass `weeklyHours` prop for duration habits. Change `dailyHabits` filter to include all habits but track correctly:

```javascript
const allHabits = habits;
```

In the HabitCard rendering, pass the `weeklyHours` prop:
```jsx
{allHabits.map((habit) => (
  <AnimatedItem key={habit._id}>
    <HabitCard
      habit={habit}
      completed={completedIds.has(habit._id)}
      onToggle={() => handleToggle(habit)}
      weeklyHours={habit.trackingType === 'duration' ? completions.filter(c => (c.habitId?._id || c.habitId) === habit._id).reduce((sum, c) => sum + c.value, 0) : null}
    />
  </AnimatedItem>
))}
```

Add the DurationInput component at the bottom:
```jsx
<DurationInput
  open={!!durationHabit}
  onClose={() => setDurationHabit(null)}
  onSubmit={handleDurationSubmit}
  habitName={durationHabit?.name || ''}
/>
```

Note: The Dashboard currently only shows daily habits. With this change, it shows all active habits. Duration habits always show (they're weekly by nature). The counter text and completed count logic should account for this — update `completedCount` to count all completed habits for today, not just daily.

- [ ] **Step 3: Commit**

```bash
git add packages/client/src/components/DurationInput.jsx packages/client/src/pages/Dashboard.jsx
git commit -m "feat: add DurationInput component and update Dashboard for duration habits"
```

---

### Task 9: Update Habits Page with Category Management

**Files:**
- Modify: `packages/client/src/pages/Habits.jsx`

- [ ] **Step 1: Add category management section**

In `packages/client/src/pages/Habits.jsx`:

Add imports:
```javascript
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../hooks/useCategories';
import CategoryModal from '../components/CategoryModal';
```

Add state and hooks:
```javascript
const { data: categories = [] } = useCategories();
const createCategory = useCreateCategory();
const updateCategory = useUpdateCategory();
const deleteCategory = useDeleteCategory();
const [catModalOpen, setCatModalOpen] = useState(false);
const [editingCat, setEditingCat] = useState(null);
```

Add category handlers:
```javascript
function handleSaveCategory(data) {
  if (editingCat) {
    updateCategory.mutate({ id: editingCat._id, ...data });
  } else {
    createCategory.mutate(data);
  }
  setCatModalOpen(false);
  setEditingCat(null);
}

function handleDeleteCategory(id) {
  if (window.confirm('Delete this category? Habits in this category will become uncategorized.')) {
    deleteCategory.mutate(id);
  }
}
```

Add category section in JSX (between the header section and the AnimatedList):
```jsx
<div className="mb-10">
  <div className="flex items-center justify-between mb-4">
    <h2 className="font-headline text-xl font-bold">Categories</h2>
    <button
      onClick={() => { setEditingCat(null); setCatModalOpen(true); }}
      className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold active:scale-95 transition-transform"
    >
      <span className="material-symbols-outlined text-lg">add</span>
      New Category
    </button>
  </div>
  <div className="flex flex-wrap gap-3">
    {categories.map((cat) => (
      <div key={cat._id} className="flex items-center gap-2 bg-surface-container-lowest px-4 py-2.5 rounded-xl border border-outline-variant/10 group">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
        <span className="font-semibold text-sm">{cat.name}</span>
        <span className="text-xs text-on-surface-variant">
          {habits.filter((h) => (h.categoryId?._id || h.categoryId) === cat._id).length} habits
        </span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
          <button onClick={() => { setEditingCat(cat); setCatModalOpen(true); }}
            className="p-1 text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-base">edit</span>
          </button>
          <button onClick={() => handleDeleteCategory(cat._id)}
            className="p-1 text-on-surface-variant hover:text-error transition-colors">
            <span className="material-symbols-outlined text-base">delete</span>
          </button>
        </div>
      </div>
    ))}
    {categories.length === 0 && (
      <p className="text-sm text-on-surface-variant">No categories yet. Create one to organize your habits.</p>
    )}
  </div>
</div>
```

Add category badge to the habit grid cards (inside the card, after the icon section, before the `<h3>` name):
```jsx
{habit.categoryId && (
  <span
    className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mb-2"
    style={{
      backgroundColor: `${habit.categoryId.color}15`,
      color: habit.categoryId.color,
    }}
  >
    {habit.categoryId.name}
  </span>
)}
```

Add the CategoryModal at the bottom (next to HabitModal):
```jsx
<CategoryModal
  open={catModalOpen}
  onClose={() => { setCatModalOpen(false); setEditingCat(null); }}
  onSave={handleSaveCategory}
  category={editingCat}
/>
```

- [ ] **Step 2: Commit**

```bash
git add packages/client/src/pages/Habits.jsx
git commit -m "feat: add category management section to Habits page"
```

---

### Task 10: Weekly Consistency Hook & Skeleton

**Files:**
- Create: `packages/client/src/hooks/useWeeklyConsistency.js`
- Create: `packages/client/src/components/skeletons/WeeklySkeleton.jsx`

- [ ] **Step 1: Create useWeeklyConsistency hook**

Create `packages/client/src/hooks/useWeeklyConsistency.js`:

```javascript
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export function useWeeklyConsistency(weekStart) {
  return useQuery({
    queryKey: ['weekly-consistency', weekStart],
    queryFn: () => api.get('/analytics/weekly-consistency', { params: { week: weekStart } }).then((r) => r.data),
    enabled: !!weekStart,
  });
}
```

- [ ] **Step 2: Create WeeklySkeleton component**

Create `packages/client/src/components/skeletons/WeeklySkeleton.jsx`:

```javascript
export default function WeeklySkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="skeleton w-8 h-8 rounded-lg" />
          <div className="skeleton w-48 h-6 rounded-lg" />
          <div className="skeleton w-8 h-8 rounded-lg" />
        </div>
        <div className="skeleton w-36 h-10 rounded-xl" />
      </div>
      <div className="flex gap-2 mb-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton w-24 h-8 rounded-full" />
        ))}
      </div>
      <div className="skeleton w-full h-72 rounded-xl mb-6" />
      <div className="skeleton w-32 h-5 rounded-lg mb-3" />
      <div className="grid grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton w-full h-28 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/client/src/hooks/useWeeklyConsistency.js packages/client/src/components/skeletons/WeeklySkeleton.jsx
git commit -m "feat: add weekly consistency hook and skeleton"
```

---

### Task 11: Weekly Page

**Files:**
- Create: `packages/client/src/pages/Weekly.jsx`

- [ ] **Step 1: Create the Weekly page component**

Create `packages/client/src/pages/Weekly.jsx`. This is the largest component — it contains:

1. **Week navigation** — state for `weekStart` (Monday date string), left/right buttons to shift by 7 days
2. **Category filter** — state for `selectedCategory` (null = all), category chips from `useCategories()`
3. **Consistency table** — renders habit rows from `useWeeklyConsistency(weekStart)` data
4. **Week history** — 4 cards showing the last 4 weeks, each using `useWeeklyConsistency` for its score

```javascript
import { useState, useMemo } from 'react';
import { useWeeklyConsistency } from '../hooks/useWeeklyConsistency';
import { useCategories } from '../hooks/useCategories';

function getMonday(date = new Date()) {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - diff);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

function shiftWeek(dateStr, delta) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + delta * 7);
  return d.toISOString().split('T')[0];
}

function formatWeekRange(startStr) {
  const start = new Date(startStr + 'T00:00:00Z');
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  const opts = { month: 'short', day: 'numeric' };
  const s = start.toLocaleDateString('en-US', { ...opts, timeZone: 'UTC' });
  const e = end.toLocaleDateString('en-US', { ...opts, year: 'numeric', timeZone: 'UTC' });
  return `${s} – ${e}`;
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function DayDisciplineLabel({ score }) {
  if (score === null) return <span className="text-on-surface-variant/40 text-xs">—</span>;
  const pct = Math.round(score * 100);
  let color = 'text-error';
  let label = 'Missed';
  if (pct === 100) { color = 'text-green-500'; label = 'Perfect'; }
  else if (pct >= 50) { color = 'text-amber-500'; label = 'Partial'; }
  return (
    <div className="flex flex-col items-center">
      <span className={`text-xs font-bold ${color}`}>{pct}%</span>
      <span className={`text-[9px] ${color}`}>{label}</span>
    </div>
  );
}

function WeekHistoryCard({ weekStart, label, isActive, onClick }) {
  const { data } = useWeeklyConsistency(weekStart);
  const score = data ? Math.round(data.overallScore * 100) : null;
  let scoreColor = 'text-primary';
  if (score !== null) {
    if (score >= 80) scoreColor = 'text-green-500';
    else if (score >= 50) scoreColor = 'text-amber-500';
    else scoreColor = 'text-error';
  }

  return (
    <button
      onClick={onClick}
      className={`bg-surface-container-lowest p-4 rounded-xl text-left transition-all hover:shadow-sm ${
        isActive ? 'border-2 border-primary' : 'border border-outline-variant/10'
      }`}
    >
      <div className="text-xs text-on-surface-variant">{label}</div>
      <div className="text-xs text-on-surface-variant">{formatWeekRange(weekStart)}</div>
      <div className={`text-2xl font-extrabold ${scoreColor} my-1`}>
        {score !== null ? `${score}%` : '—'}
      </div>
      {data && (
        <div className="flex gap-0.5">
          {DAY_NAMES.map((day) => {
            const s = data.dailyScores[day];
            let bg = 'bg-surface-container';
            if (s === null) bg = 'bg-surface-container';
            else if (s === 1) bg = 'bg-green-500';
            else if (s >= 0.5) bg = 'bg-amber-500';
            else if (s > 0) bg = 'bg-amber-500';
            else bg = 'bg-error';
            return <div key={day} className={`flex-1 h-1 rounded-full ${bg}`} />;
          })}
        </div>
      )}
    </button>
  );
}

export default function Weekly() {
  const [weekStart, setWeekStart] = useState(() => getMonday());
  const [selectedCategory, setSelectedCategory] = useState(null);
  const { data, isLoading } = useWeeklyConsistency(weekStart);
  const { data: categories = [] } = useCategories();

  const currentMonday = getMonday();

  const filteredHabits = useMemo(() => {
    if (!data) return [];
    if (!selectedCategory) return data.habits;
    return data.habits.filter((h) => h.category && h.category.name === selectedCategory);
  }, [data, selectedCategory]);

  const overallPct = data ? Math.round(data.overallScore * 100) : 0;

  const weekHistoryStarts = useMemo(() => {
    return [0, -1, -2, -3].map((offset) => shiftWeek(currentMonday, offset));
  }, [currentMonday]);

  const weekLabels = ['This Week', 'Last Week', '2 Weeks Ago', '3 Weeks Ago'];

  return (
    <>
      <section className="mb-6">
        <h1 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-3">Weekly Tracking</h1>
        <p className="text-on-surface-variant text-lg">Track your discipline and consistency week by week.</p>
      </section>

      {/* Week navigation + score */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setWeekStart((w) => shiftWeek(w, -1))}
            className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined text-lg">chevron_left</span>
          </button>
          <span className="font-bold text-lg font-headline">{formatWeekRange(weekStart)}</span>
          <button onClick={() => setWeekStart((w) => shiftWeek(w, 1))}
            className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined text-lg">chevron_right</span>
          </button>
        </div>
        <div className="bg-surface-container-lowest px-5 py-2 rounded-xl border border-outline-variant/10 flex items-center gap-3">
          <span className="text-sm text-on-surface-variant">Weekly Discipline</span>
          <span className="text-2xl font-extrabold text-primary">{overallPct}%</span>
        </div>
      </div>

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
            !selectedCategory ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat._id}
            onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors border`}
            style={{
              borderColor: cat.color,
              backgroundColor: selectedCategory === cat.name ? cat.color : 'transparent',
              color: selectedCategory === cat.name ? 'white' : cat.color,
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Consistency Table */}
      {!isLoading && data && (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 overflow-x-auto mb-8">
          <table className="w-full min-w-[700px] border-collapse">
            <thead>
              <tr className="bg-surface-container">
                <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider w-40 border-r border-outline-variant/10">Habit</th>
                {DAY_NAMES.map((day) => (
                  <th key={day} className="text-center px-2 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider border-r border-outline-variant/10">{day}</th>
                ))}
                <th className="text-center px-3 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Rate</th>
              </tr>
            </thead>
            <tbody>
              {filteredHabits.map((habit) => (
                <tr key={habit.habitId} className="border-t border-outline-variant/5 hover:bg-surface-container/30 transition-colors">
                  <td className="px-4 py-3 border-r border-outline-variant/10">
                    <div className="font-semibold text-sm">{habit.name}</div>
                    {habit.category && (
                      <span
                        className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1"
                        style={{ backgroundColor: `${habit.category.color}15`, color: habit.category.color }}
                      >
                        {habit.category.name}
                      </span>
                    )}
                  </td>
                  {DAY_NAMES.map((day) => {
                    const cell = habit.days[day];
                    return (
                      <td key={day} className="text-center px-2 py-3 border-r border-outline-variant/10">
                        {cell.isFuture ? (
                          <span className="text-on-surface-variant/30">—</span>
                        ) : habit.trackingType === 'duration' ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className={`text-sm font-bold ${
                              cell.value === 0 ? 'text-error' : cell.value >= (habit.weeklyTarget / 7) ? 'text-green-500' : 'text-amber-500'
                            }`}>
                              {cell.value > 0 ? `${cell.value}h` : '0'}
                            </span>
                            <div className="w-4/5 h-1 bg-surface-container rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.min((cell.value / (habit.weeklyTarget / 5)) * 100, 100)}%`,
                                  backgroundColor: habit.category?.color || '#005bc4',
                                }}
                              />
                            </div>
                          </div>
                        ) : cell.completed ? (
                          <span className="text-green-500 text-base font-bold">✓</span>
                        ) : (
                          <span className="text-error text-base font-bold">✗</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="text-center px-3 py-3">
                    {habit.trackingType === 'duration' ? (
                      <span className={`text-sm font-bold ${habit.rate >= 1 ? 'text-green-500' : habit.rate >= 0.5 ? 'text-amber-500' : 'text-error'}`}>
                        {habit.totalHours}/{habit.weeklyTarget}h
                      </span>
                    ) : (
                      <span className={`text-sm font-bold ${habit.rate >= 0.8 ? 'text-green-500' : habit.rate >= 0.5 ? 'text-amber-500' : 'text-error'}`}>
                        {Math.round(habit.rate * 100)}%
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-outline-variant/20 bg-surface-container/50">
                <td className="px-4 py-3 text-xs font-bold text-on-surface-variant uppercase border-r border-outline-variant/10">Day Discipline</td>
                {DAY_NAMES.map((day) => (
                  <td key={day} className="text-center px-2 py-3 border-r border-outline-variant/10">
                    <DayDisciplineLabel score={data.dailyScores[day]} />
                  </td>
                ))}
                <td className="text-center px-3 py-3">
                  <span className="text-base font-extrabold text-primary">{overallPct}%</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {isLoading && (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 p-8 mb-8 animate-pulse">
          <div className="skeleton w-full h-64 rounded-lg" />
        </div>
      )}

      {/* Week History */}
      <div className="mb-8">
        <h2 className="font-headline text-xl font-bold mb-4">Week History</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {weekHistoryStarts.map((ws, i) => (
            <WeekHistoryCard
              key={ws}
              weekStart={ws}
              label={weekLabels[i]}
              isActive={weekStart === ws}
              onClick={() => setWeekStart(ws)}
            />
          ))}
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/client/src/pages/Weekly.jsx
git commit -m "feat: add Weekly consistency tracking page"
```

---

### Task 12: Wire Up Weekly Page (Routes + Nav)

**Files:**
- Modify: `packages/client/src/App.jsx`
- Modify: `packages/client/src/components/TopNavBar.jsx`
- Modify: `packages/client/src/components/BottomNavBar.jsx`

- [ ] **Step 1: Add Weekly route to App.jsx**

In `packages/client/src/App.jsx`:

Add imports:
```javascript
import WeeklySkeleton from './components/skeletons/WeeklySkeleton';
const Weekly = lazy(() => import('./pages/Weekly'));
```

Add the route after the Calendar route (before Analytics):
```jsx
<Route path="/weekly" element={
  <ProtectedRoute><AppLayout>
    <LazyPage skeleton={<WeeklySkeleton />}><Weekly /></LazyPage>
  </AppLayout></ProtectedRoute>
} />
```

- [ ] **Step 2: Update TopNavBar**

In `packages/client/src/components/TopNavBar.jsx`, add to the `links` array (after Calendar, before Analytics):

```javascript
{ to: '/weekly', label: 'Weekly' },
```

- [ ] **Step 3: Update BottomNavBar**

In `packages/client/src/components/BottomNavBar.jsx`, add to the `tabs` array (after Calendar, before the special Add button):

```javascript
{ to: '/weekly', icon: 'calendar_view_week', label: 'Weekly' },
```

- [ ] **Step 4: Commit**

```bash
git add packages/client/src/App.jsx packages/client/src/components/TopNavBar.jsx packages/client/src/components/BottomNavBar.jsx
git commit -m "feat: add Weekly page route and navigation links"
```

---

### Task 13: Test & Fix

- [ ] **Step 1: Run Vite build to check for compilation errors**

```bash
cd packages/client && npx vite build
```

Fix any import errors, missing references, or syntax issues.

- [ ] **Step 2: Run API tests**

```bash
cd packages/server && npm test
```

Fix any failing tests due to schema changes (the Habit model now has new optional fields which shouldn't break existing tests).

- [ ] **Step 3: Manual smoke test**

Start the app and verify:
1. Categories CRUD works on Habits page
2. Creating a habit with category and duration tracking type works
3. Dashboard shows category badges and handles duration habit logging
4. Weekly page loads and displays the consistency table
5. Week navigation works
6. Category filtering works on Weekly page

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve build and test issues for weekly tracking"
```
