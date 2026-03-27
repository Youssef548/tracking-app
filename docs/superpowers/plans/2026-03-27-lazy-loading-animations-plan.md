# Lazy Loading & UI Animations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add lazy loading with skeleton fallbacks, page crossfade transitions, animated modals, staggered content animations, and progress bar/ring animations to The Mindful Flow habit tracker.

**Architecture:** All changes are in the client package (`packages/client`). Framer Motion is the single animation dependency. Reusable animation components (`PageTransition`, `AnimatedList`) prevent duplication. Skeleton components use pure CSS shimmer (no Framer Motion). Pages are code-split via `React.lazy()` with `Suspense` boundaries.

**Tech Stack:** React 19, Framer Motion, Vite, Tailwind CSS 3, React Router v7

---

## File Map

### New Files
| File | Responsibility |
|------|---------------|
| `src/components/PageTransition.jsx` | Page crossfade wrapper using Framer Motion |
| `src/components/AnimatedList.jsx` | Staggered children entrance animation |
| `src/components/skeletons/DashboardSkeleton.jsx` | Dashboard page loading skeleton |
| `src/components/skeletons/CalendarSkeleton.jsx` | Calendar page loading skeleton |
| `src/components/skeletons/AnalyticsSkeleton.jsx` | Analytics page loading skeleton |
| `src/components/skeletons/HabitsSkeleton.jsx` | Habits page loading skeleton |
| `src/components/skeletons/AuthSkeleton.jsx` | Login/Register page loading skeleton |

### Modified Files
| File | Change |
|------|--------|
| `package.json` | Add `framer-motion` dependency |
| `src/main.css` | Add shimmer keyframes + `.skeleton` utility class |
| `src/App.jsx` | Lazy imports, Suspense boundaries, AnimatePresence + PageTransition |
| `src/components/HabitModal.jsx` | AnimatePresence for fade+scale enter/exit |
| `src/components/ProgressRing.jsx` | Animated stroke-dashoffset on mount |
| `src/components/HabitCard.jsx` | Animated progress bar width on mount |
| `src/components/DayDetailPanel.jsx` | Fade+slide animation on day selection |
| `src/pages/Dashboard.jsx` | Wrap habit cards with AnimatedList |
| `src/pages/Habits.jsx` | Wrap habit grid with AnimatedList |
| `src/pages/Analytics.jsx` | Wrap stat cards and habit breakdown with AnimatedList |
| `src/pages/Login.jsx` | Fade-in wrapper on form card |
| `src/pages/Register.jsx` | Fade-in wrapper on form card |

All paths below are relative to `packages/client/`.

---

### Task 1: Install Framer Motion

**Files:**
- Modify: `packages/client/package.json`

- [ ] **Step 1: Install framer-motion**

```bash
cd packages/client && pnpm add framer-motion
```

- [ ] **Step 2: Verify installation**

```bash
cd packages/client && node -e "require('framer-motion'); console.log('OK')"
```

Expected: `OK`

- [ ] **Step 3: Verify dev server still starts**

```bash
cd packages/client && npx vite --port 3099 &
sleep 5
curl -s http://localhost:3099 | head -5
kill %1 2>/dev/null
```

Expected: HTML output from Vite dev server.

- [ ] **Step 4: Commit**

```bash
git add packages/client/package.json packages/client/pnpm-lock.yaml pnpm-lock.yaml
git commit -m "chore: add framer-motion dependency"
```

---

### Task 2: Add shimmer CSS + skeleton utility class

**Files:**
- Modify: `src/main.css`

- [ ] **Step 1: Add shimmer keyframes and .skeleton class to main.css**

Append the following after the existing `.material-symbols-outlined` block in `src/main.css`:

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

- [ ] **Step 2: Verify the CSS compiles**

```bash
cd packages/client && npx vite build 2>&1 | tail -3
```

Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/client/src/main.css
git commit -m "style: add shimmer animation and skeleton utility class"
```

---

### Task 3: Create skeleton components

**Files:**
- Create: `src/components/skeletons/DashboardSkeleton.jsx`
- Create: `src/components/skeletons/CalendarSkeleton.jsx`
- Create: `src/components/skeletons/AnalyticsSkeleton.jsx`
- Create: `src/components/skeletons/HabitsSkeleton.jsx`
- Create: `src/components/skeletons/AuthSkeleton.jsx`

- [ ] **Step 1: Create DashboardSkeleton**

Create file `src/components/skeletons/DashboardSkeleton.jsx`:

```jsx
export default function DashboardSkeleton() {
  return (
    <>
      {/* Greeting skeleton */}
      <section className="mb-10">
        <div className="skeleton h-10 w-72 mb-2" />
        <div className="skeleton h-5 w-40" />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Habit cards column */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <div className="skeleton h-6 w-32" />
            <div className="skeleton h-7 w-36 rounded-full" />
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-surface-container-lowest p-6 rounded-xl flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="skeleton w-10 h-10 rounded-lg" />
                  <div className="skeleton h-5 w-40" />
                </div>
                <div className="skeleton h-1.5 w-full rounded-full" />
              </div>
              <div className="ml-8">
                <div className="skeleton w-12 h-12 rounded-xl" />
              </div>
            </div>
          ))}
        </div>

        {/* Weekly flow column */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-surface-container-lowest p-8 rounded-xl">
            <div className="skeleton h-6 w-28 mb-8" />
            <div className="flex flex-col items-center">
              <div className="skeleton w-48 h-48 rounded-full" />
              <div className="skeleton h-4 w-48 mt-6" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-container-low p-5 rounded-xl">
              <div className="skeleton w-6 h-6 mb-2" />
              <div className="skeleton h-8 w-12 mb-1" />
              <div className="skeleton h-3 w-16" />
            </div>
            <div className="bg-surface-container-low p-5 rounded-xl">
              <div className="skeleton w-6 h-6 mb-2" />
              <div className="skeleton h-8 w-12 mb-1" />
              <div className="skeleton h-3 w-16" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Create CalendarSkeleton**

Create file `src/components/skeletons/CalendarSkeleton.jsx`:

```jsx
export default function CalendarSkeleton() {
  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div className="skeleton h-10 w-56" />
        <div className="flex items-center gap-3">
          <div className="skeleton w-10 h-10 rounded-xl" />
          <div className="skeleton w-10 h-10 rounded-xl" />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-grow">
          <div className="bg-surface-container-lowest rounded-3xl p-4 md:p-8">
            {/* Day labels */}
            <div className="grid grid-cols-7 mb-4">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} className="text-center py-2">
                  <div className="skeleton h-3 w-6 mx-auto" />
                </div>
              ))}
            </div>
            {/* 5 rows × 7 cols */}
            <div className="grid grid-cols-7 gap-px">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="aspect-square p-3">
                  <div className="skeleton h-4 w-4 mb-2" />
                  <div className="flex gap-1">
                    <div className="skeleton w-1.5 h-1.5 rounded-full" />
                    <div className="skeleton w-1.5 h-1.5 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <aside className="w-full lg:w-96 shrink-0">
          <div className="bg-surface-container-low rounded-4xl p-8">
            <div className="skeleton h-4 w-20 mb-2" />
            <div className="skeleton h-8 w-40 mb-8" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-16 w-full rounded-2xl" />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
```

- [ ] **Step 3: Create AnalyticsSkeleton**

Create file `src/components/skeletons/AnalyticsSkeleton.jsx`:

```jsx
export default function AnalyticsSkeleton() {
  return (
    <>
      <div className="mb-10">
        <div className="skeleton h-12 w-64 mb-2" />
        <div className="skeleton h-5 w-48" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Hero score */}
        <div className="md:col-span-4 bg-surface-container-lowest p-8 rounded-3xl">
          <div className="skeleton h-5 w-24 rounded-full mb-8" />
          <div className="skeleton h-20 w-32 mb-2" />
          <div className="skeleton h-4 w-28 mb-12" />
          <div className="skeleton h-2 w-full rounded-full" />
        </div>

        {/* Chart */}
        <div className="md:col-span-8 bg-surface-container-lowest p-8 rounded-3xl">
          <div className="skeleton h-6 w-40 mb-8" />
          <div className="skeleton h-48 w-full rounded-xl" />
        </div>

        {/* Bars */}
        <div className="md:col-span-7 bg-surface-container-lowest p-8 rounded-3xl">
          <div className="skeleton h-6 w-44 mb-8" />
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="skeleton h-3 w-24 mb-2" />
                <div className="skeleton h-8 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </div>

        {/* Tip */}
        <div className="md:col-span-5 bg-secondary-container/30 p-8 rounded-3xl">
          <div className="skeleton h-8 w-8 mb-4 rounded" />
          <div className="skeleton h-7 w-36 mb-3" />
          <div className="skeleton h-16 w-full" />
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 4: Create HabitsSkeleton**

Create file `src/components/skeletons/HabitsSkeleton.jsx`:

```jsx
export default function HabitsSkeleton() {
  return (
    <>
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="skeleton h-10 w-52 mb-3" />
          <div className="skeleton h-5 w-72" />
        </div>
        <div className="skeleton h-14 w-40 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface-container-lowest p-7 rounded-4xl border border-outline-variant/10">
            <div className="flex justify-between items-start mb-6">
              <div className="skeleton w-12 h-12 rounded-2xl" />
            </div>
            <div className="skeleton h-6 w-36 mb-2" />
            <div className="flex items-center gap-3 mb-6">
              <div className="skeleton h-6 w-16 rounded-lg" />
              <div className="skeleton h-4 w-28" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
```

- [ ] **Step 5: Create AuthSkeleton**

Create file `src/components/skeletons/AuthSkeleton.jsx`:

```jsx
export default function AuthSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md bg-surface-container-lowest p-8 rounded-4xl shadow-lg">
        <div className="skeleton h-8 w-48 mb-2" />
        <div className="skeleton h-5 w-56 mb-8" />
        <div className="space-y-5">
          <div>
            <div className="skeleton h-4 w-16 mb-1" />
            <div className="skeleton h-14 w-full rounded-2xl" />
          </div>
          <div>
            <div className="skeleton h-4 w-16 mb-1" />
            <div className="skeleton h-14 w-full rounded-2xl" />
          </div>
          <div className="skeleton h-14 w-full rounded-2xl" />
        </div>
        <div className="skeleton h-4 w-52 mx-auto mt-6" />
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Verify build still succeeds**

```bash
cd packages/client && npx vite build 2>&1 | tail -3
```

Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add packages/client/src/components/skeletons/
git commit -m "feat: add skeleton loading components for all pages"
```

---

### Task 4: Create PageTransition component

**Files:**
- Create: `src/components/PageTransition.jsx`

- [ ] **Step 1: Create PageTransition.jsx**

Create file `src/components/PageTransition.jsx`:

```jsx
import { motion } from 'framer-motion';

export default function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/client/src/components/PageTransition.jsx
git commit -m "feat: add PageTransition component for route crossfade"
```

---

### Task 5: Create AnimatedList component

**Files:**
- Create: `src/components/AnimatedList.jsx`

- [ ] **Step 1: Create AnimatedList.jsx**

Create file `src/components/AnimatedList.jsx`:

```jsx
import { motion } from 'framer-motion';

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

export default function AnimatedList({ children, className = '' }) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedItem({ children, className = '' }) {
  return (
    <motion.div variants={item} className={className}>
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/client/src/components/AnimatedList.jsx
git commit -m "feat: add AnimatedList component for staggered entrance"
```

---

### Task 6: Wire up lazy loading + Suspense + AnimatePresence in App.jsx

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Replace App.jsx with lazy loading, Suspense, and page transitions**

Replace the entire contents of `src/App.jsx` with:

```jsx
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import ProtectedRoute from './components/ProtectedRoute';
import TopNavBar from './components/TopNavBar';
import BottomNavBar from './components/BottomNavBar';
import PageTransition from './components/PageTransition';
import DashboardSkeleton from './components/skeletons/DashboardSkeleton';
import CalendarSkeleton from './components/skeletons/CalendarSkeleton';
import AnalyticsSkeleton from './components/skeletons/AnalyticsSkeleton';
import HabitsSkeleton from './components/skeletons/HabitsSkeleton';
import AuthSkeleton from './components/skeletons/AuthSkeleton';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Habits = lazy(() => import('./pages/Habits'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));

function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-surface">
      <TopNavBar />
      <main className="max-w-7xl mx-auto px-6 pt-8 pb-32 md:pb-12">
        {children}
      </main>
      <BottomNavBar />
    </div>
  );
}

function LazyPage({ skeleton, children }) {
  return (
    <Suspense fallback={skeleton}>
      <PageTransition>
        {children}
      </PageTransition>
    </Suspense>
  );
}

export default function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={
          <LazyPage skeleton={<AuthSkeleton />}><Login /></LazyPage>
        } />
        <Route path="/register" element={
          <LazyPage skeleton={<AuthSkeleton />}><Register /></LazyPage>
        } />
        <Route path="/" element={
          <ProtectedRoute><AppLayout>
            <LazyPage skeleton={<DashboardSkeleton />}><Dashboard /></LazyPage>
          </AppLayout></ProtectedRoute>
        } />
        <Route path="/calendar" element={
          <ProtectedRoute><AppLayout>
            <LazyPage skeleton={<CalendarSkeleton />}><Calendar /></LazyPage>
          </AppLayout></ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute><AppLayout>
            <LazyPage skeleton={<AnalyticsSkeleton />}><Analytics /></LazyPage>
          </AppLayout></ProtectedRoute>
        } />
        <Route path="/habits" element={
          <ProtectedRoute><AppLayout>
            <LazyPage skeleton={<HabitsSkeleton />}><Habits /></LazyPage>
          </AppLayout></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Verify build succeeds**

```bash
cd packages/client && npx vite build 2>&1 | tail -5
```

Expected: Build succeeds. Output should show multiple chunks (one per lazy page).

- [ ] **Step 3: Verify dev server works**

```bash
cd packages/client && npx vite --port 3099 &
sleep 5
curl -s http://localhost:3099 | head -5
kill %1 2>/dev/null
```

Expected: HTML output.

- [ ] **Step 4: Commit**

```bash
git add packages/client/src/App.jsx
git commit -m "feat: add lazy loading with Suspense skeletons and page crossfade transitions"
```

---

### Task 7: Animate HabitModal with fade + scale

**Files:**
- Modify: `src/components/HabitModal.jsx`

- [ ] **Step 1: Replace HabitModal.jsx with animated version**

Replace the entire contents of `src/components/HabitModal.jsx` with:

```jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HABIT_ICONS } from '@mindful-flow/shared/constants';

export default function HabitModal({ open, onClose, onSave, habit = null }) {
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [target, setTarget] = useState(3);
  const [icon, setIcon] = useState('check_circle');
  const [color, setColor] = useState('primary');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setFrequency(habit.frequency);
      setTarget(habit.target);
      setIcon(habit.icon);
      setColor(habit.color);
      setDescription(habit.description || '');
    } else {
      setName('');
      setFrequency('daily');
      setTarget(3);
      setIcon('check_circle');
      setColor('primary');
      setDescription('');
    }
  }, [habit, open]);

  function handleSubmit(e) {
    e.preventDefault();
    onSave({ name, frequency, target: frequency === 'daily' ? 1 : target, icon, color, description });
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          {/* Modal panel */}
          <motion.div
            className="relative w-full max-w-lg bg-surface-container-lowest rounded-4xl shadow-xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold font-headline tracking-tight">{habit ? 'Edit Habit' : 'Create Habit'}</h2>
                <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">Habit Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                    className="w-full px-5 py-4 rounded-2xl bg-surface-container border-none focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-on-surface-variant/40 font-medium"
                    placeholder="e.g., Morning Yoga" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">Icon</label>
                  <div className="flex flex-wrap gap-2">
                    {HABIT_ICONS.map((ic) => (
                      <button key={ic} type="button" onClick={() => setIcon(ic)}
                        className={`p-2 rounded-xl transition-colors ${icon === ic ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}>
                        <span className="material-symbols-outlined text-xl">{ic}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">Color</label>
                  <div className="flex gap-3">
                    {['primary', 'secondary', 'tertiary'].map((c) => (
                      <button key={c} type="button" onClick={() => setColor(c)}
                        className={`w-10 h-10 rounded-full bg-${c} ${color === c ? 'ring-4 ring-offset-2 ring-primary/30' : ''}`} />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">Frequency</label>
                  <div className="grid grid-cols-2 p-1.5 bg-surface-container rounded-2xl">
                    <button type="button" onClick={() => setFrequency('daily')}
                      className={`py-3 rounded-xl font-bold transition-all ${frequency === 'daily' ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-on-surface-variant'}`}>Daily</button>
                    <button type="button" onClick={() => setFrequency('weekly')}
                      className={`py-3 rounded-xl font-bold transition-all ${frequency === 'weekly' ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-on-surface-variant'}`}>Weekly</button>
                  </div>
                </div>
                {frequency === 'weekly' && (
                  <div>
                    <label className="block text-sm font-bold text-on-surface-variant mb-1">Weekly Target</label>
                    <div className="flex items-center gap-4">
                      <input type="range" min="1" max="7" value={target} onChange={(e) => setTarget(Number(e.target.value))}
                        className="flex-1 accent-primary h-2 bg-surface-container rounded-full" />
                      <span className="w-12 h-12 flex items-center justify-center bg-primary-container text-on-primary font-bold rounded-xl">{target}</span>
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">Description (optional)</label>
                  <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-surface-container border-none focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-on-surface-variant/40 font-medium"
                    placeholder="e.g., 10 minutes session" />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={onClose}
                    className="flex-1 py-4 px-6 border border-outline-variant/30 text-on-surface font-bold rounded-2xl hover:bg-surface-container transition-colors">Cancel</button>
                  <button type="submit"
                    className="flex-1 py-4 px-6 bg-primary text-on-primary font-bold rounded-2xl shadow-lg hover:opacity-90 active:scale-[0.98] transition-all">
                    {habit ? 'Update' : 'Save Habit'}
                  </button>
                </div>
              </form>
            </div>
            <div className="h-2 bg-gradient-to-r from-primary via-secondary to-tertiary opacity-50" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
```

Key changes from original:
- Removed `if (!open) return null;` — replaced with `<AnimatePresence>{open && (...)}</AnimatePresence>`
- Backdrop is now `<motion.div>` with `initial/animate/exit` opacity
- Modal panel is now `<motion.div>` with `initial/animate/exit` scale + opacity
- Moved `handleSubmit` above the return (before the `if (!open)` was blocking it)

- [ ] **Step 2: Verify build**

```bash
cd packages/client && npx vite build 2>&1 | tail -3
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add packages/client/src/components/HabitModal.jsx
git commit -m "feat: animate HabitModal with fade+scale enter/exit"
```

---

### Task 8: Animate ProgressRing SVG on mount

**Files:**
- Modify: `src/components/ProgressRing.jsx`

- [ ] **Step 1: Replace ProgressRing.jsx with animated version**

Replace the entire contents of `src/components/ProgressRing.jsx` with:

```jsx
import { motion } from 'framer-motion';

export default function ProgressRing({ percent = 0, size = 192, strokeWidth = 12, color = 'text-secondary' }) {
  const radius = (size / 2) - (strokeWidth / 2);
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="transparent" stroke="currentColor"
          strokeWidth={strokeWidth} className="text-surface-container" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="transparent" stroke="currentColor"
          strokeWidth={strokeWidth} strokeDasharray={circumference}
          strokeLinecap="round" className={color}
          style={{ filter: 'drop-shadow(0 0 8px rgba(0, 109, 74, 0.2))' }}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-headline text-4xl font-extrabold text-on-surface">{percent}%</span>
        <span className="text-on-surface-variant text-xs font-bold tracking-widest uppercase">ON TRACK</span>
      </div>
    </div>
  );
}
```

Key change: The progress circle now uses `<motion.circle>` with `initial={{ strokeDashoffset: circumference }}` (empty) → `animate={{ strokeDashoffset: offset }}` (target) over 800ms.

- [ ] **Step 2: Verify build**

```bash
cd packages/client && npx vite build 2>&1 | tail -3
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add packages/client/src/components/ProgressRing.jsx
git commit -m "feat: animate ProgressRing stroke-dashoffset on mount"
```

---

### Task 9: Animate HabitCard progress bar on mount

**Files:**
- Modify: `src/components/HabitCard.jsx`

- [ ] **Step 1: Replace HabitCard.jsx with animated version**

Replace the entire contents of `src/components/HabitCard.jsx` with:

```jsx
import { motion } from 'framer-motion';

const colorMap = {
  primary: { bg: 'bg-primary/10', text: 'text-primary', btnBg: 'bg-primary' },
  secondary: { bg: 'bg-secondary/10', text: 'text-secondary', btnBg: 'bg-secondary' },
  tertiary: { bg: 'bg-tertiary/10', text: 'text-tertiary', btnBg: 'bg-tertiary' },
};

const barColors = {
  primary: '#005bc4',
  secondary: '#006d4a',
  tertiary: '#bd0c3b',
};

export default function HabitCard({ habit, completed, progress = 0, onToggle }) {
  const colors = colorMap[habit.color] || colorMap.primary;
  const barColor = barColors[habit.color] || barColors.primary;
  const targetWidth = completed ? 100 : Math.max(progress, 5);

  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl flex items-center justify-between group hover:shadow-sm transition-all duration-300">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-3">
          <span className={`p-2 rounded-lg ${colors.bg} ${colors.text}`}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{habit.icon}</span>
          </span>
          <h3 className="font-headline font-semibold text-lg">{habit.name}</h3>
        </div>
        <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: completed ? barColor : '#d4dbdf' }}
            initial={{ width: '0%' }}
            animate={{ width: `${targetWidth}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>
      <div className="ml-8">
        <button onClick={onToggle}
          className={`w-12 h-12 rounded-xl flex items-center justify-center active:scale-95 transition-all ${
            completed
              ? `${colors.btnBg} text-white`
              : 'border-2 border-outline-variant/30 text-outline-variant hover:border-primary/50 hover:text-primary'
          }`}>
          <span className="material-symbols-outlined">{completed ? 'check_circle' : 'radio_button_unchecked'}</span>
        </button>
      </div>
    </div>
  );
}
```

Key changes:
- Progress bar is now `<motion.div>` with `initial={{ width: '0%' }}` → `animate={{ width: targetWidth }}` over 500ms
- Bar color uses inline `backgroundColor` with hex values instead of Tailwind classes (because `motion.div` animates style properties, and Tailwind dynamic class for the completed/uncompleted color won't animate)
- `#d4dbdf` is the `surface-dim` hex from tailwind config (used for uncompleted bar)

- [ ] **Step 2: Verify build**

```bash
cd packages/client && npx vite build 2>&1 | tail -3
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add packages/client/src/components/HabitCard.jsx
git commit -m "feat: animate HabitCard progress bar width on mount"
```

---

### Task 10: Animate DayDetailPanel on day selection

**Files:**
- Modify: `src/components/DayDetailPanel.jsx`

- [ ] **Step 1: Replace DayDetailPanel.jsx with animated version**

Replace the entire contents of `src/components/DayDetailPanel.jsx` with:

```jsx
import { motion, AnimatePresence } from 'framer-motion';

export default function DayDetailPanel({ date, completions = [], habits = [] }) {
  const d = date ? new Date(date + 'T00:00:00') : null;
  const formatted = d ? d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : '';

  const completedIds = new Set(completions.map((c) => c.habitId?._id || c.habitId));
  const completed = habits.filter((h) => completedIds.has(h._id));
  const missed = habits.filter((h) => h.frequency === 'daily' && !completedIds.has(h._id));

  return (
    <AnimatePresence mode="wait">
      {date && (
        <motion.div
          key={date}
          className="bg-surface-container-low rounded-4xl p-8 shadow-sm border border-outline-variant/10"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <div className="mb-8">
            <span className="uppercase tracking-widest text-on-surface-variant font-bold text-xs">Details for</span>
            <h2 className="text-3xl font-headline font-extrabold text-on-surface mt-1">{formatted}</h2>
          </div>
          <div className="space-y-6">
            {completed.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-secondary" />
                  <h3 className="text-sm font-bold text-secondary uppercase tracking-wider">Completed</h3>
                </div>
                <div className="space-y-3">
                  {completed.map((h) => (
                    <div key={h._id} className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-2xl shadow-sm border border-secondary/5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                          <span className="material-symbols-outlined text-lg">{h.icon}</span>
                        </div>
                        <p className="text-sm font-bold text-on-surface">{h.name}</p>
                      </div>
                      <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {missed.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-tertiary-fixed-dim" />
                  <h3 className="text-sm font-bold text-tertiary uppercase tracking-wider">Missed</h3>
                </div>
                <div className="space-y-3">
                  {missed.map((h) => (
                    <div key={h._id} className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-2xl shadow-sm border border-error/5 opacity-60">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary">
                          <span className="material-symbols-outlined text-lg">{h.icon}</span>
                        </div>
                        <p className="text-sm font-bold text-on-surface">{h.name}</p>
                      </div>
                      <span className="material-symbols-outlined text-tertiary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {completed.length === 0 && missed.length === 0 && (
              <p className="text-on-surface-variant text-center py-8">No data for this day</p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

Key changes:
- Wrapped in `<AnimatePresence mode="wait">` with `key={date}` so it re-animates when selected day changes
- Main container is `<motion.div>` with fade + slide from right (`x: 20 → 0`), exit slides left (`x: -20`)
- Removed early `if (!date) return null` — `AnimatePresence` handles it

- [ ] **Step 2: Verify build**

```bash
cd packages/client && npx vite build 2>&1 | tail -3
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add packages/client/src/components/DayDetailPanel.jsx
git commit -m "feat: animate DayDetailPanel fade+slide on day selection"
```

---

### Task 11: Add AnimatedList to Dashboard page

**Files:**
- Modify: `src/pages/Dashboard.jsx`

- [ ] **Step 1: Add AnimatedList import and wrap habit cards**

In `src/pages/Dashboard.jsx`:

1. Add import at the top (after existing imports):
```jsx
import AnimatedList, { AnimatedItem } from '../components/AnimatedList';
```

2. Replace the habit cards mapping section. Find this block (lines 62-65):
```jsx
          {dailyHabits.map((habit) => (
            <HabitCard key={habit._id} habit={habit} completed={completedIds.has(habit._id)}
              onToggle={() => handleToggle(habit)} />
          ))}
```

Replace with:
```jsx
          <AnimatedList className="space-y-6">
            {dailyHabits.map((habit) => (
              <AnimatedItem key={habit._id}>
                <HabitCard habit={habit} completed={completedIds.has(habit._id)}
                  onToggle={() => handleToggle(habit)} />
              </AnimatedItem>
            ))}
          </AnimatedList>
```

3. Remove the `space-y-6` class from the parent `<div className="lg:col-span-8 space-y-6">` since AnimatedList now handles spacing. Change it to:
```jsx
        <div className="lg:col-span-8">
```

And add `mb-2` separately to the header div above the cards. Find:
```jsx
          <div className="flex items-center justify-between mb-2">
```
Change to:
```jsx
          <div className="flex items-center justify-between mb-8">
```

- [ ] **Step 2: Verify build**

```bash
cd packages/client && npx vite build 2>&1 | tail -3
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add packages/client/src/pages/Dashboard.jsx
git commit -m "feat: add staggered entrance animation to Dashboard habit cards"
```

---

### Task 12: Add AnimatedList to Habits page

**Files:**
- Modify: `src/pages/Habits.jsx`

- [ ] **Step 1: Add AnimatedList import and wrap habit grid**

In `src/pages/Habits.jsx`:

1. Add import at the top (after existing imports):
```jsx
import AnimatedList, { AnimatedItem } from '../components/AnimatedList';
```

2. Replace the habits grid. Find this block (lines 55-82):
```jsx
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {habits.map((habit) => {
```

Replace the entire grid `<div>` and its contents with:
```jsx
      <AnimatedList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {habits.map((habit) => {
          const colors = colorMap[habit.color] || colorMap.primary;
          return (
            <AnimatedItem key={habit._id}>
              <div className="group bg-surface-container-lowest p-7 rounded-4xl border border-outline-variant/10 hover:border-primary/20 transition-all duration-300">
                <div className="flex justify-between items-start mb-6">
                  <div className={`p-3 rounded-2xl ${colors.bg} ${colors.text}`}>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{habit.icon}</span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(habit)} className="p-2 text-on-surface-variant hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-xl">edit</span>
                    </button>
                    <button onClick={() => handleDelete(habit._id)} className="p-2 text-on-surface-variant hover:text-error transition-colors">
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                  </div>
                </div>
                <h3 className="text-xl font-bold font-headline mb-2">{habit.name}</h3>
                <div className="flex items-center gap-3 mb-6">
                  <span className="px-3 py-1 bg-surface-container-high rounded-lg text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    {habit.frequency}
                  </span>
                  {habit.description && <span className="text-sm text-on-surface-variant">{habit.description}</span>}
                </div>
              </div>
            </AnimatedItem>
          );
        })}
      </AnimatedList>
```

- [ ] **Step 2: Verify build**

```bash
cd packages/client && npx vite build 2>&1 | tail -3
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add packages/client/src/pages/Habits.jsx
git commit -m "feat: add staggered entrance animation to Habits grid"
```

---

### Task 13: Add AnimatedList to Analytics page

**Files:**
- Modify: `src/pages/Analytics.jsx`

- [ ] **Step 1: Add AnimatedList import and wrap grid items**

In `src/pages/Analytics.jsx`:

1. Add import at the top (after existing imports):
```jsx
import AnimatedList, { AnimatedItem } from '../components/AnimatedList';
```

2. Replace the main grid. Find:
```jsx
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
```

Replace with:
```jsx
      <AnimatedList className="grid grid-cols-1 md:grid-cols-12 gap-6">
```

3. Wrap each direct child of the grid with `<AnimatedItem>`. There are 5 children:

The Hero Score card — find:
```jsx
        <div className="md:col-span-4 bg-surface-container-lowest p-8 rounded-3xl flex flex-col justify-between relative overflow-hidden">
```
Wrap it: `<AnimatedItem className="md:col-span-4">` and move `md:col-span-4` from the inner div to the AnimatedItem, changing the inner div to:
```jsx
        <AnimatedItem className="md:col-span-4">
          <div className="bg-surface-container-lowest p-8 rounded-3xl flex flex-col justify-between relative overflow-hidden h-full">
```
Close with `</AnimatedItem>` after the div's closing tag.

The Trend Chart — wrap similarly:
```jsx
        <AnimatedItem className="md:col-span-8">
          <div className="bg-surface-container-lowest p-8 rounded-3xl h-full">
```

The Comparison Bar:
```jsx
        <AnimatedItem className="md:col-span-7">
          <div className="bg-surface-container-lowest p-8 rounded-3xl h-full">
```

The Streak Tip:
```jsx
        <AnimatedItem className="md:col-span-5">
          <div className="bg-secondary-container/30 p-8 rounded-3xl flex flex-col justify-between border border-secondary/10 h-full">
```

The Habit Breakdown section:
```jsx
        <AnimatedItem className="md:col-span-12 mt-4">
          <div>
```
(remove `md:col-span-12 mt-4` from the inner div)

4. Close the grid with `</AnimatedList>` instead of `</div>`.

The full file after changes:

```jsx
import { useWeeklyAnalytics } from '../hooks/useAnalytics';
import { useHabits } from '../hooks/useHabits';
import { TrendChart, ComparisonBar } from '../components/ChartBlock';
import AnimatedList, { AnimatedItem } from '../components/AnimatedList';

export default function Analytics() {
  const { data: weekly } = useWeeklyAnalytics();
  const { data: habits = [] } = useHabits();

  const barData = [
    { label: 'THIS WEEK', completed: weekly?.completedCount || 0, target: weekly?.targetCount || 0 },
  ];

  return (
    <>
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-headline font-extrabold text-4xl md:text-5xl tracking-tight text-on-surface mb-2">Performance</h1>
          <p className="text-on-surface-variant text-lg">
            Your weekly overview
          </p>
        </div>
      </div>

      <AnimatedList className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Hero Score */}
        <AnimatedItem className="md:col-span-4">
          <div className="bg-surface-container-lowest p-8 rounded-3xl flex flex-col justify-between relative overflow-hidden h-full">
            <div>
              <span className="text-xs font-bold tracking-widest text-primary uppercase bg-primary-container/10 px-3 py-1 rounded-full">Current Status</span>
              <div className="mt-8">
                <h2 className="font-headline text-7xl font-extrabold text-on-surface leading-none">{weekly?.score || 0}%</h2>
                <p className="text-on-surface-variant font-medium mt-2">Weekly Score</p>
              </div>
            </div>
            <div className="mt-12">
              <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: `${weekly?.score || 0}%` }} />
              </div>
            </div>
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
          </div>
        </AnimatedItem>

        {/* Trend Chart */}
        <AnimatedItem className="md:col-span-8">
          <div className="bg-surface-container-lowest p-8 rounded-3xl h-full">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-headline font-bold text-xl">Consistency Trend</h3>
            </div>
            <TrendChart data={weekly?.dayData || []} />
          </div>
        </AnimatedItem>

        {/* Comparison Bar */}
        <AnimatedItem className="md:col-span-7">
          <div className="bg-surface-container-lowest p-8 rounded-3xl h-full">
            <h3 className="font-headline font-bold text-xl mb-8">Completed vs Target</h3>
            <ComparisonBar data={barData} />
          </div>
        </AnimatedItem>

        {/* Streak Tip */}
        <AnimatedItem className="md:col-span-5">
          <div className="bg-secondary-container/30 p-8 rounded-3xl flex flex-col justify-between border border-secondary/10 h-full">
            <div>
              <span className="material-symbols-outlined text-secondary text-3xl mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <h3 className="font-headline font-extrabold text-2xl text-on-surface mb-3">Zen Pulse Tip</h3>
              <p className="text-on-surface-variant leading-relaxed">
                Your current streak is <span className="font-bold text-secondary">{weekly?.streak || 0} days</span>. Keep building momentum!
              </p>
            </div>
          </div>
        </AnimatedItem>

        {/* Habit Breakdown */}
        <AnimatedItem className="md:col-span-12 mt-4">
          <div>
            <h3 className="font-headline font-bold text-2xl mb-6">Habit Breakdown</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {habits.map((habit) => {
                const colorClass = habit.color === 'secondary' ? 'bg-secondary' : habit.color === 'tertiary' ? 'bg-tertiary' : 'bg-primary';
                const iconBg = habit.color === 'secondary' ? 'bg-secondary/10 text-secondary' : habit.color === 'tertiary' ? 'bg-tertiary/10 text-tertiary' : 'bg-primary/10 text-primary';
                return (
                  <div key={habit._id} className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/5 hover:shadow-xl transition-shadow">
                    <div className="flex justify-between items-start mb-6">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
                        <span className="material-symbols-outlined">{habit.icon}</span>
                      </div>
                    </div>
                    <h4 className="font-bold text-on-surface mb-1">{habit.name}</h4>
                    <p className="text-xs text-on-surface-variant mb-4">{habit.description || habit.frequency}</p>
                    <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                      <div className={`${colorClass} h-full rounded-full`} style={{ width: '70%' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </AnimatedItem>
      </AnimatedList>
    </>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
cd packages/client && npx vite build 2>&1 | tail -3
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add packages/client/src/pages/Analytics.jsx
git commit -m "feat: add staggered entrance animation to Analytics page"
```

---

### Task 14: Add fade-in to Login and Register pages

**Files:**
- Modify: `src/pages/Login.jsx`
- Modify: `src/pages/Register.jsx`

- [ ] **Step 1: Add fade-in to Login.jsx**

In `src/pages/Login.jsx`, add import at the top:
```jsx
import { motion } from 'framer-motion';
```

Find the form card container:
```jsx
      <div className="w-full max-w-md bg-surface-container-lowest p-8 rounded-4xl shadow-lg">
```

Replace with:
```jsx
      <motion.div
        className="w-full max-w-md bg-surface-container-lowest p-8 rounded-4xl shadow-lg"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
```

And change the matching closing `</div>` (the one that closes this card, before the outer `</div>`) to `</motion.div>`.

The outermost wrapper `<div className="min-h-screen...">` stays as a regular div.

- [ ] **Step 2: Add fade-in to Register.jsx**

In `src/pages/Register.jsx`, add import at the top:
```jsx
import { motion } from 'framer-motion';
```

Find the form card container:
```jsx
      <div className="w-full max-w-md bg-surface-container-lowest p-8 rounded-4xl shadow-lg">
```

Replace with:
```jsx
      <motion.div
        className="w-full max-w-md bg-surface-container-lowest p-8 rounded-4xl shadow-lg"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
```

And change the matching closing `</div>` to `</motion.div>`.

- [ ] **Step 3: Verify build**

```bash
cd packages/client && npx vite build 2>&1 | tail -3
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add packages/client/src/pages/Login.jsx packages/client/src/pages/Register.jsx
git commit -m "feat: add fade-in animation to Login and Register form cards"
```

---

### Task 15: Manual verification of all animations

- [ ] **Step 1: Start dev servers**

```bash
pnpm run dev:mem
```

Wait for both server and client to start.

- [ ] **Step 2: Test skeleton loading**

Open `http://localhost:3000` in a browser. On first load (cold), you should briefly see the `AuthSkeleton` (shimmer placeholders) before the Login page fades in. After logging in, you should see `DashboardSkeleton` briefly before the Dashboard fades in.

To force seeing skeletons: open DevTools → Network tab → set throttling to "Slow 3G", then navigate between pages.

- [ ] **Step 3: Test page crossfade**

Navigate between Dashboard → Calendar → Analytics → Habits using the nav bar. Each page should fade out gently, then the next page fades in with a subtle slide-up. No hard cuts.

- [ ] **Step 4: Test modal animation**

On the Habits page, click "New Habit" button. The modal should fade in with a scale-up effect (from 95% to 100%). Click "Cancel" or the backdrop — the modal should fade out with a scale-down. No hard cut.

- [ ] **Step 5: Test progress animations**

On the Dashboard, habit card progress bars should animate their width from 0 to the target value on mount. The weekly ProgressRing should animate its circle stroke from empty to the target percentage.

- [ ] **Step 6: Test DayDetailPanel animation**

On the Calendar page, click different days. The detail panel on the right should slide in from the right with a fade. Clicking a different day should slide the old panel out to the left and the new one in from the right.

- [ ] **Step 7: Test staggered lists**

On the Dashboard, habit cards should appear one by one with a slight delay between each. Same on the Habits page grid and Analytics page sections.

- [ ] **Step 8: Fix any issues found during manual testing**

If any animation doesn't work as expected, debug and fix. Common issues:
- `AnimatePresence` needs a `key` prop on its direct children
- `motion.div` needs to be the direct child of `AnimatePresence` for exit animations
- SVG `motion.circle` may need `as` prop in some React versions

- [ ] **Step 9: Final commit if fixes were needed**

```bash
git add -A
git commit -m "fix: address animation issues found during manual testing"
```
