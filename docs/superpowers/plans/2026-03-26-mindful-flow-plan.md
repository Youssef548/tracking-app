# The Mindful Flow - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack habit tracking app with multi-user auth, habit CRUD, daily completions, calendar view, analytics dashboard, and in-app notifications.

**Architecture:** Turborepo monorepo with 3 packages (client, server, shared). Express REST API with Mongoose models, Vite+React SPA with TanStack Query for server state and React Context for auth. Docker Compose for deployment.

**Tech Stack:** MongoDB 7, Express.js, React (Vite), Node.js, Turborepo, pnpm, Tailwind CSS, shadcn/ui, Recharts, JWT, bcrypt, TanStack Query, Axios, Jest, Supertest, Vitest, React Testing Library

---

## File Map

### Root
- `package.json` — pnpm workspace root config
- `pnpm-workspace.yaml` — workspace package paths
- `turbo.json` — Turborepo pipeline config
- `.env.example` — environment variable template
- `.gitignore` — ignore node_modules, dist, .env
- `docker-compose.yml` — 3-service deployment (client, server, mongo)

### packages/shared
- `package.json` — shared package config
- `constants.js` — FREQUENCIES, COLORS, NOTIFICATION_TYPES enums
- `validation.js` — validateHabit, validateCompletion, validateAuth helpers

### packages/server
- `package.json` — server dependencies
- `Dockerfile` — Node production image
- `src/index.js` — Express app entry, MongoDB connect, route mounting
- `src/models/User.js` — User schema (name, email, password, avatar)
- `src/models/Habit.js` — Habit schema (name, icon, color, frequency, target, userId)
- `src/models/Completion.js` — Completion schema (habitId, userId, date, value)
- `src/models/Notification.js` — Notification schema (userId, type, title, message, isRead)
- `src/middleware/auth.js` — JWT verification middleware
- `src/middleware/errorHandler.js` — Central error response middleware
- `src/middleware/validate.js` — Request validation middleware
- `src/routes/auth.js` — POST /register, POST /login, GET /me, PUT /profile
- `src/controllers/authController.js` — Auth route handlers
- `src/routes/habits.js` — GET /, POST /, PUT /:id, DELETE /:id
- `src/controllers/habitsController.js` — Habits route handlers
- `src/routes/completions.js` — GET /, POST /, DELETE /:id
- `src/controllers/completionsController.js` — Completions route handlers
- `src/routes/analytics.js` — GET /weekly, GET /monthly, GET /habits/:id
- `src/controllers/analyticsController.js` — Analytics route handlers
- `src/routes/notifications.js` — GET /, PUT /:id/read, PUT /read-all
- `src/controllers/notificationsController.js` — Notifications route handlers
- `src/utils/dateHelpers.js` — normalizeDate, getWeekRange, getMonthRange
- `src/utils/streakCalculator.js` — calculateStreak from completions

### packages/client
- `package.json` — client dependencies
- `Dockerfile` — Multi-stage build (node build → nginx serve)
- `nginx.conf` — SPA routing config for nginx
- `index.html` — Vite entry HTML
- `vite.config.js` — Vite config with proxy to server
- `tailwind.config.js` — Material Design 3 color tokens, fonts
- `postcss.config.js` — Tailwind + autoprefixer
- `src/main.jsx` — React entry, providers (QueryClient, AuthProvider, BrowserRouter)
- `src/App.jsx` — Route definitions, layout wrapper
- `src/services/api.js` — Axios instance with JWT interceptor
- `src/context/AuthContext.jsx` — AuthProvider, useAuth hook
- `src/hooks/useHabits.js` — TanStack Query hooks for habits CRUD
- `src/hooks/useCompletions.js` — TanStack Query hooks for completions
- `src/hooks/useAnalytics.js` — TanStack Query hooks for analytics endpoints
- `src/hooks/useNotifications.js` — TanStack Query hooks for notifications
- `src/components/TopNavBar.jsx` — Desktop nav with logo, links, bell, avatar
- `src/components/BottomNavBar.jsx` — Mobile 5-tab nav
- `src/components/ProtectedRoute.jsx` — Redirects to /login if unauthenticated
- `src/components/HabitCard.jsx` — Habit with icon, progress bar, check button
- `src/components/ProgressRing.jsx` — SVG circular progress
- `src/components/StatCard.jsx` — Small metric card
- `src/components/HabitModal.jsx` — Create/edit habit dialog
- `src/components/CalendarGrid.jsx` — 7-column month grid with dots
- `src/components/DayDetailPanel.jsx` — Selected day habit list
- `src/components/ChartBlock.jsx` — Recharts line/bar wrapper
- `src/components/NotificationDropdown.jsx` — Bell + dropdown
- `src/components/FAB.jsx` — Floating action button
- `src/pages/Login.jsx` — Login form
- `src/pages/Register.jsx` — Register form
- `src/pages/Dashboard.jsx` — Home page with daily habits + weekly flow
- `src/pages/Calendar.jsx` — Calendar grid + day detail panel
- `src/pages/Analytics.jsx` — Performance charts + habit breakdown
- `src/pages/Habits.jsx` — Habit management grid

---

### Task 1: Monorepo Scaffolding

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `packages/shared/package.json`
- Create: `packages/server/package.json`
- Create: `packages/client/package.json`

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "the-mindful-flow",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint"
  },
  "devDependencies": {
    "turbo": "^2.4.0"
  },
  "packageManager": "pnpm@9.15.0"
}
```

- [ ] **Step 2: Create pnpm-workspace.yaml**

```yaml
packages:
  - "packages/*"
```

- [ ] **Step 3: Create turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "lint": {}
  }
}
```

- [ ] **Step 4: Create .gitignore**

```
node_modules
dist
.env
*.log
.turbo
```

- [ ] **Step 5: Create .env.example**

```
MONGO_URI=mongodb://localhost:27017/mindful-flow
JWT_SECRET=your-secret-key-change-in-production
PORT=5000
```

- [ ] **Step 6: Create packages/shared/package.json**

```json
{
  "name": "@mindful-flow/shared",
  "version": "1.0.0",
  "main": "constants.js",
  "scripts": {
    "test": "jest"
  },
  "devDependencies": {
    "jest": "^29.7.0"
  }
}
```

- [ ] **Step 7: Create packages/server/package.json**

```json
{
  "name": "@mindful-flow/server",
  "version": "1.0.0",
  "main": "src/index.js",
  "scripts": {
    "dev": "nodemon src/index.js",
    "build": "echo 'No build step for server'",
    "start": "node src/index.js",
    "test": "jest --runInBand"
  },
  "dependencies": {
    "@mindful-flow/shared": "workspace:*",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "express-rate-limit": "^7.5.0",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.10.0"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "mongodb-memory-server": "^10.4.0",
    "nodemon": "^3.1.9",
    "supertest": "^7.0.0"
  }
}
```

- [ ] **Step 8: Create packages/client/package.json**

```json
{
  "name": "@mindful-flow/client",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "@mindful-flow/shared": "workspace:*",
    "@tanstack/react-query": "^5.67.0",
    "axios": "^1.7.9",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.3.0",
    "recharts": "^2.15.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.2.0",
    "@types/react": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "jsdom": "^26.0.0",
    "postcss": "^8.5.0",
    "tailwindcss": "^3.4.17",
    "vite": "^6.2.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 9: Install dependencies**

Run: `cd G:/personal/tracking-app && pnpm install`
Expected: All packages installed, node_modules created with symlinked workspaces.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "chore: scaffold Turborepo monorepo with pnpm workspaces"
```

---

### Task 2: Shared Package

**Files:**
- Create: `packages/shared/constants.js`
- Create: `packages/shared/validation.js`

- [ ] **Step 1: Create constants.js**

```js
const FREQUENCIES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
};

const COLORS = ['primary', 'secondary', 'tertiary'];

const NOTIFICATION_TYPES = {
  STREAK: 'streak',
  REMINDER: 'reminder',
  ACHIEVEMENT: 'achievement',
  TIP: 'tip',
};

const HABIT_ICONS = [
  'self_improvement',
  'water_drop',
  'menu_book',
  'fitness_center',
  'forest',
  'edit_note',
  'bedtime',
  'restaurant',
  'code',
  'music_note',
];

module.exports = { FREQUENCIES, COLORS, NOTIFICATION_TYPES, HABIT_ICONS };
```

- [ ] **Step 2: Create validation.js**

```js
const { FREQUENCIES, COLORS } = require('./constants');

function validateHabitInput(data) {
  const errors = {};
  if (!data.name || data.name.trim().length === 0) {
    errors.name = 'Habit name is required';
  }
  if (data.name && data.name.length > 100) {
    errors.name = 'Habit name must be under 100 characters';
  }
  if (!data.frequency || !Object.values(FREQUENCIES).includes(data.frequency)) {
    errors.frequency = 'Frequency must be "daily" or "weekly"';
  }
  if (data.frequency === FREQUENCIES.WEEKLY) {
    if (!data.target || data.target < 1 || data.target > 7) {
      errors.target = 'Weekly target must be between 1 and 7';
    }
  }
  if (data.color && !COLORS.includes(data.color)) {
    errors.color = 'Invalid color token';
  }
  return { isValid: Object.keys(errors).length === 0, errors };
}

function validateAuthInput(data, isLogin = false) {
  const errors = {};
  if (!isLogin && (!data.name || data.name.trim().length === 0)) {
    errors.name = 'Name is required';
  }
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Valid email is required';
  }
  if (!data.password || data.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }
  return { isValid: Object.keys(errors).length === 0, errors };
}

function validateCompletionInput(data) {
  const errors = {};
  if (!data.habitId) {
    errors.habitId = 'Habit ID is required';
  }
  if (!data.date) {
    errors.date = 'Date is required';
  }
  if (data.value !== undefined && (typeof data.value !== 'number' || data.value < 0)) {
    errors.value = 'Value must be a non-negative number';
  }
  return { isValid: Object.keys(errors).length === 0, errors };
}

module.exports = { validateHabitInput, validateAuthInput, validateCompletionInput };
```

- [ ] **Step 3: Commit**

```bash
git add packages/shared
git commit -m "feat: add shared constants and validation helpers"
```

---

### Task 3: Server Setup + Mongoose Models

**Files:**
- Create: `packages/server/src/index.js`
- Create: `packages/server/src/models/User.js`
- Create: `packages/server/src/models/Habit.js`
- Create: `packages/server/src/models/Completion.js`
- Create: `packages/server/src/models/Notification.js`
- Create: `packages/server/src/middleware/errorHandler.js`

- [ ] **Step 1: Create server entry point**

Create `packages/server/src/index.js`:

```js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

// Routes will be mounted here in later tasks
// app.use('/api/auth', require('./routes/auth'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mindful-flow';

if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(MONGO_URI).then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  }).catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
}

module.exports = app;
```

- [ ] **Step 2: Create errorHandler middleware**

Create `packages/server/src/middleware/errorHandler.js`:

```js
function errorHandler(err, req, res, next) {
  console.error(err.stack || err.message);

  if (err.name === 'ValidationError') {
    const fields = {};
    for (const key of Object.keys(err.errors)) {
      fields[key] = err.errors[key].message;
    }
    return res.status(400).json({ error: { message: 'Validation failed', code: 'VALIDATION_ERROR', fields } });
  }

  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({ error: { message: 'Invalid ID format', code: 'INVALID_ID' } });
  }

  if (err.code === 11000) {
    return res.status(409).json({ error: { message: 'Duplicate entry', code: 'DUPLICATE' } });
  }

  const status = err.status || 500;
  const message = err.status ? err.message : 'Internal server error';
  res.status(status).json({ error: { message, code: err.code || 'SERVER_ERROR' } });
}

module.exports = errorHandler;
```

- [ ] **Step 3: Create User model**

Create `packages/server/src/models/User.js`:

```js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'],
  },
  password: { type: String, required: [true, 'Password is required'], minlength: [6, 'Password must be at least 6 characters'] },
  avatar: { type: String, default: '' },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
```

- [ ] **Step 4: Create Habit model**

Create `packages/server/src/models/Habit.js`:

```js
const mongoose = require('mongoose');
const { FREQUENCIES, COLORS } = require('@mindful-flow/shared/constants');

const habitSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: [true, 'Habit name is required'], trim: true, maxlength: 100 },
  icon: { type: String, default: 'check_circle' },
  color: { type: String, enum: COLORS, default: 'primary' },
  frequency: { type: String, enum: Object.values(FREQUENCIES), required: true },
  target: { type: Number, default: 1, min: 1, max: 7 },
  description: { type: String, default: '', maxlength: 255 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Habit', habitSchema);
```

- [ ] **Step 5: Create Completion model**

Create `packages/server/src/models/Completion.js`:

```js
const mongoose = require('mongoose');

const completionSchema = new mongoose.Schema({
  habitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Habit', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  value: { type: Number, default: 1, min: 0 },
  note: { type: String, default: '', maxlength: 500 },
  completedAt: { type: Date, default: Date.now },
});

completionSchema.index({ userId: 1, date: 1 });
completionSchema.index({ habitId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Completion', completionSchema);
```

- [ ] **Step 6: Create Notification model**

Create `packages/server/src/models/Notification.js`:

```js
const mongoose = require('mongoose');
const { NOTIFICATION_TYPES } = require('@mindful-flow/shared/constants');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: Object.values(NOTIFICATION_TYPES), required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
```

- [ ] **Step 7: Commit**

```bash
git add packages/server/src
git commit -m "feat: add Express server setup and Mongoose models"
```

---

### Task 4: Auth Middleware + Auth Routes

**Files:**
- Create: `packages/server/src/middleware/auth.js`
- Create: `packages/server/src/middleware/validate.js`
- Create: `packages/server/src/controllers/authController.js`
- Create: `packages/server/src/routes/auth.js`
- Modify: `packages/server/src/index.js` (mount auth routes)

- [ ] **Step 1: Create auth middleware**

Create `packages/server/src/middleware/auth.js`:

```js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: { message: 'No token provided', code: 'NO_TOKEN' } });
  }
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: { message: 'User not found', code: 'USER_NOT_FOUND' } });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: { message: 'Invalid token', code: 'INVALID_TOKEN' } });
  }
}

module.exports = auth;
```

- [ ] **Step 2: Create validate middleware**

Create `packages/server/src/middleware/validate.js`:

```js
function validate(validationFn, ...args) {
  return (req, res, next) => {
    const { isValid, errors } = validationFn(req.body, ...args);
    if (!isValid) {
      return res.status(400).json({ error: { message: 'Validation failed', code: 'VALIDATION_ERROR', fields: errors } });
    }
    next();
  };
}

module.exports = validate;
```

- [ ] **Step 3: Create auth controller**

Create `packages/server/src/controllers/authController.js`:

```js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_EXPIRES_IN = '7d';

function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: { message: 'Email already registered', code: 'EMAIL_EXISTS' } });
    }
    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);
    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: { message: 'Invalid email or password', code: 'INVALID_CREDENTIALS' } });
    }
    const token = generateToken(user._id);
    res.json({ token, user });
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res) {
  res.json({ user: req.user });
}

async function updateProfile(req, res, next) {
  try {
    const { name, avatar } = req.body;
    if (name !== undefined) req.user.name = name;
    if (avatar !== undefined) req.user.avatar = avatar;
    await req.user.save();
    res.json({ user: req.user });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, getMe, updateProfile };
```

- [ ] **Step 4: Create auth routes**

Create `packages/server/src/routes/auth.js`:

```js
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { validateAuthInput } = require('@mindful-flow/shared/validation');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const { register, login, getMe, updateProfile } = require('../controllers/authController');

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: { message: 'Too many attempts, try again later', code: 'RATE_LIMIT' } },
});

router.post('/register', authLimiter, validate(validateAuthInput, false), register);
router.post('/login', authLimiter, validate(validateAuthInput, true), login);
router.get('/me', auth, getMe);
router.put('/profile', auth, updateProfile);

module.exports = router;
```

- [ ] **Step 5: Mount auth routes in index.js**

Update `packages/server/src/index.js` — replace the comment `// Routes will be mounted here in later tasks` and the line below it with:

```js
app.use('/api/auth', require('./routes/auth'));
```

- [ ] **Step 6: Commit**

```bash
git add packages/server/src
git commit -m "feat: add auth middleware, controller, and routes"
```

---

### Task 5: Habits CRUD Routes

**Files:**
- Create: `packages/server/src/controllers/habitsController.js`
- Create: `packages/server/src/routes/habits.js`
- Modify: `packages/server/src/index.js` (mount habits routes)

- [ ] **Step 1: Create habits controller**

Create `packages/server/src/controllers/habitsController.js`:

```js
const Habit = require('../models/Habit');

async function getHabits(req, res, next) {
  try {
    const filter = { userId: req.user._id };
    if (req.query.active !== 'false') {
      filter.isActive = true;
    }
    const habits = await Habit.find(filter).sort({ createdAt: -1 });
    res.json(habits);
  } catch (err) {
    next(err);
  }
}

async function createHabit(req, res, next) {
  try {
    const { name, icon, color, frequency, target, description } = req.body;
    const habit = await Habit.create({
      userId: req.user._id,
      name,
      icon: icon || 'check_circle',
      color: color || 'primary',
      frequency,
      target: frequency === 'daily' ? 1 : (target || 1),
      description: description || '',
    });
    res.status(201).json(habit);
  } catch (err) {
    next(err);
  }
}

async function updateHabit(req, res, next) {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.user._id });
    if (!habit) {
      return res.status(404).json({ error: { message: 'Habit not found', code: 'NOT_FOUND' } });
    }
    const allowed = ['name', 'icon', 'color', 'frequency', 'target', 'description'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        habit[key] = req.body[key];
      }
    }
    if (habit.frequency === 'daily') habit.target = 1;
    await habit.save();
    res.json(habit);
  } catch (err) {
    next(err);
  }
}

async function deleteHabit(req, res, next) {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.user._id });
    if (!habit) {
      return res.status(404).json({ error: { message: 'Habit not found', code: 'NOT_FOUND' } });
    }
    habit.isActive = false;
    await habit.save();
    res.json(habit);
  } catch (err) {
    next(err);
  }
}

module.exports = { getHabits, createHabit, updateHabit, deleteHabit };
```

- [ ] **Step 2: Create habits routes**

Create `packages/server/src/routes/habits.js`:

```js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { validateHabitInput } = require('@mindful-flow/shared/validation');
const { getHabits, createHabit, updateHabit, deleteHabit } = require('../controllers/habitsController');

router.use(auth);
router.get('/', getHabits);
router.post('/', validate(validateHabitInput), createHabit);
router.put('/:id', updateHabit);
router.delete('/:id', deleteHabit);

module.exports = router;
```

- [ ] **Step 3: Mount habits routes in index.js**

Add after the auth route mount in `packages/server/src/index.js`:

```js
app.use('/api/habits', require('./routes/habits'));
```

- [ ] **Step 4: Commit**

```bash
git add packages/server/src
git commit -m "feat: add habits CRUD controller and routes"
```

---

### Task 6: Completions Routes + Date Helpers

**Files:**
- Create: `packages/server/src/utils/dateHelpers.js`
- Create: `packages/server/src/controllers/completionsController.js`
- Create: `packages/server/src/routes/completions.js`
- Modify: `packages/server/src/index.js` (mount completions routes)

- [ ] **Step 1: Create date helpers**

Create `packages/server/src/utils/dateHelpers.js`:

```js
function normalizeDate(dateInput) {
  const d = new Date(dateInput);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function getWeekRange() {
  const now = new Date();
  const dayOfWeek = now.getUTCDay();
  const start = new Date(now);
  start.setUTCDate(now.getUTCDate() - dayOfWeek);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 7);
  return { start, end };
}

function getMonthRange(month, year) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { start, end };
}

module.exports = { normalizeDate, getWeekRange, getMonthRange };
```

- [ ] **Step 2: Create completions controller**

Create `packages/server/src/controllers/completionsController.js`:

```js
const Completion = require('../models/Completion');
const Habit = require('../models/Habit');
const { normalizeDate } = require('../utils/dateHelpers');

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
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: { message: 'Already completed for this date', code: 'DUPLICATE' } });
    }
    next(err);
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

- [ ] **Step 3: Create completions routes**

Create `packages/server/src/routes/completions.js`:

```js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { validateCompletionInput } = require('@mindful-flow/shared/validation');
const { getCompletions, createCompletion, deleteCompletion } = require('../controllers/completionsController');

router.use(auth);
router.get('/', getCompletions);
router.post('/', validate(validateCompletionInput), createCompletion);
router.delete('/:id', deleteCompletion);

module.exports = router;
```

- [ ] **Step 4: Mount completions routes in index.js**

Add after habits route mount in `packages/server/src/index.js`:

```js
app.use('/api/completions', require('./routes/completions'));
```

- [ ] **Step 5: Commit**

```bash
git add packages/server/src
git commit -m "feat: add completions routes and date helpers"
```

---

### Task 7: Analytics Routes + Streak Calculator

**Files:**
- Create: `packages/server/src/utils/streakCalculator.js`
- Create: `packages/server/src/controllers/analyticsController.js`
- Create: `packages/server/src/routes/analytics.js`
- Modify: `packages/server/src/index.js` (mount analytics routes)

- [ ] **Step 1: Create streak calculator**

Create `packages/server/src/utils/streakCalculator.js`:

```js
const { normalizeDate } = require('./dateHelpers');

function calculateStreak(completions, dailyHabitCount) {
  if (dailyHabitCount === 0) return 0;

  const completionsByDate = {};
  for (const c of completions) {
    const key = normalizeDate(c.date).toISOString().split('T')[0];
    completionsByDate[key] = (completionsByDate[key] || 0) + 1;
  }

  let streak = 0;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const current = new Date(today);

  while (true) {
    const key = current.toISOString().split('T')[0];
    const count = completionsByDate[key] || 0;
    if (count >= dailyHabitCount) {
      streak++;
      current.setUTCDate(current.getUTCDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

module.exports = { calculateStreak };
```

- [ ] **Step 2: Create analytics controller**

Create `packages/server/src/controllers/analyticsController.js`:

```js
const Completion = require('../models/Completion');
const Habit = require('../models/Habit');
const { getWeekRange, getMonthRange, normalizeDate } = require('../utils/dateHelpers');
const { calculateStreak } = require('../utils/streakCalculator');

async function getWeeklyAnalytics(req, res, next) {
  try {
    const userId = req.user._id;
    const { start, end } = getWeekRange();

    const habits = await Habit.find({ userId, isActive: true });
    const completions = await Completion.find({ userId, date: { $gte: start, $lt: end } });

    let totalTarget = 0;
    for (const h of habits) {
      totalTarget += h.frequency === 'daily' ? 7 : h.target;
    }

    const completedCount = completions.length;
    const score = totalTarget > 0 ? Math.round((completedCount / totalTarget) * 100) : 0;

    const dailyHabitCount = habits.filter(h => h.frequency === 'daily').length;
    const allCompletions = await Completion.find({ userId }).sort({ date: -1 });
    const streak = calculateStreak(allCompletions, dailyHabitCount);

    const dayData = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setUTCDate(start.getUTCDate() + i);
      const dayKey = d.toISOString().split('T')[0];
      const dayCompletions = completions.filter(c => normalizeDate(c.date).toISOString().split('T')[0] === dayKey);
      dayData.push({ date: dayKey, count: dayCompletions.length });
    }

    res.json({ score, completedCount, targetCount: totalTarget, streak, dayData });
  } catch (err) {
    next(err);
  }
}

async function getMonthlyAnalytics(req, res, next) {
  try {
    const userId = req.user._id;
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const { start, end } = getMonthRange(month, year);

    const completions = await Completion.find({ userId, date: { $gte: start, $lt: end } }).populate('habitId', 'name icon color');

    const daysMap = {};
    for (const c of completions) {
      const key = normalizeDate(c.date).toISOString().split('T')[0];
      if (!daysMap[key]) daysMap[key] = [];
      daysMap[key].push(c);
    }

    const days = Object.entries(daysMap).map(([date, comps]) => ({ date, completions: comps }));
    res.json({ month, year, days });
  } catch (err) {
    next(err);
  }
}

async function getHabitAnalytics(req, res, next) {
  try {
    const userId = req.user._id;
    const habit = await Habit.findOne({ _id: req.params.id, userId });
    if (!habit) {
      return res.status(404).json({ error: { message: 'Habit not found', code: 'NOT_FOUND' } });
    }

    const completions = await Completion.find({ habitId: habit._id }).sort({ date: -1 });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);
    thirtyDaysAgo.setUTCHours(0, 0, 0, 0);
    const recentCompletions = completions.filter(c => c.date >= thirtyDaysAgo);

    let expectedDays;
    if (habit.frequency === 'daily') {
      expectedDays = 30;
    } else {
      expectedDays = Math.round((30 / 7) * habit.target);
    }

    const completionRate = expectedDays > 0 ? Math.round((recentCompletions.length / expectedDays) * 100) : 0;

    let streakDays = 0;
    if (habit.frequency === 'daily') {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const current = new Date(today);
      const dateSet = new Set(completions.map(c => normalizeDate(c.date).toISOString().split('T')[0]));
      while (dateSet.has(current.toISOString().split('T')[0])) {
        streakDays++;
        current.setUTCDate(current.getUTCDate() - 1);
      }
    }

    res.json({ completionRate, recentCompletions: recentCompletions.slice(0, 10), streakDays });
  } catch (err) {
    next(err);
  }
}

module.exports = { getWeeklyAnalytics, getMonthlyAnalytics, getHabitAnalytics };
```

- [ ] **Step 3: Create analytics routes**

Create `packages/server/src/routes/analytics.js`:

```js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getWeeklyAnalytics, getMonthlyAnalytics, getHabitAnalytics } = require('../controllers/analyticsController');

router.use(auth);
router.get('/weekly', getWeeklyAnalytics);
router.get('/monthly', getMonthlyAnalytics);
router.get('/habits/:id', getHabitAnalytics);

module.exports = router;
```

- [ ] **Step 4: Mount analytics routes in index.js**

Add after completions route mount in `packages/server/src/index.js`:

```js
app.use('/api/analytics', require('./routes/analytics'));
```

- [ ] **Step 5: Commit**

```bash
git add packages/server/src
git commit -m "feat: add analytics routes and streak calculator"
```

---

### Task 8: Notifications Routes

**Files:**
- Create: `packages/server/src/controllers/notificationsController.js`
- Create: `packages/server/src/routes/notifications.js`
- Modify: `packages/server/src/index.js` (mount notifications routes)

- [ ] **Step 1: Create notifications controller**

Create `packages/server/src/controllers/notificationsController.js`:

```js
const Notification = require('../models/Notification');

async function getNotifications(req, res, next) {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ isRead: 1, createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (err) {
    next(err);
  }
}

async function markAsRead(req, res, next) {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, userId: req.user._id });
    if (!notification) {
      return res.status(404).json({ error: { message: 'Notification not found', code: 'NOT_FOUND' } });
    }
    notification.isRead = true;
    await notification.save();
    res.json(notification);
  } catch (err) {
    next(err);
  }
}

async function markAllAsRead(req, res, next) {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { getNotifications, markAsRead, markAllAsRead };
```

- [ ] **Step 2: Create notifications routes**

Create `packages/server/src/routes/notifications.js`:

```js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getNotifications, markAsRead, markAllAsRead } = require('../controllers/notificationsController');

router.use(auth);
router.get('/', getNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);

module.exports = router;
```

- [ ] **Step 3: Mount notifications routes in index.js**

Add after analytics route mount in `packages/server/src/index.js`:

```js
app.use('/api/notifications', require('./routes/notifications'));
```

- [ ] **Step 4: Commit**

```bash
git add packages/server/src
git commit -m "feat: add notifications routes"
```

---

### Task 9: Client Setup (Vite + React + Tailwind + shadcn/ui)

**Files:**
- Create: `packages/client/index.html`
- Create: `packages/client/vite.config.js`
- Create: `packages/client/tailwind.config.js`
- Create: `packages/client/postcss.config.js`
- Create: `packages/client/src/main.jsx`
- Create: `packages/client/src/App.jsx`

- [ ] **Step 1: Create index.html**

Create `packages/client/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>The Mindful Flow</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
</head>
<body class="bg-surface font-body text-on-surface antialiased">
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
```

- [ ] **Step 2: Create vite.config.js**

Create `packages/client/vite.config.js`:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
```

- [ ] **Step 3: Create tailwind.config.js**

Create `packages/client/tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#005bc4',
        'primary-container': '#4388fd',
        'primary-dim': '#004fad',
        secondary: '#006d4a',
        'secondary-container': '#6ffbbe',
        'secondary-dim': '#005f40',
        tertiary: '#bd0c3b',
        'tertiary-container': '#fc4563',
        'tertiary-fixed-dim': '#ea3858',
        surface: '#f7f9fb',
        'surface-bright': '#f7f9fb',
        'surface-dim': '#d4dbdf',
        'surface-container': '#eaeff2',
        'surface-container-low': '#f0f4f7',
        'surface-container-high': '#e3e9ed',
        'surface-container-highest': '#dce4e8',
        'surface-container-lowest': '#ffffff',
        'on-surface': '#2c3437',
        'on-surface-variant': '#596064',
        'on-primary': '#f9f8ff',
        'on-secondary': '#e6ffee',
        'on-tertiary': '#fff7f6',
        'on-primary-container': '#000311',
        'on-secondary-container': '#005e3f',
        outline: '#747c80',
        'outline-variant': '#acb3b7',
        error: '#a83836',
        'error-container': '#fa746f',
        'on-error': '#fff7f6',
        background: '#f7f9fb',
        'on-background': '#2c3437',
      },
      fontFamily: {
        headline: ['Plus Jakarta Sans', 'sans-serif'],
        body: ['Manrope', 'sans-serif'],
        label: ['Manrope', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '2.5rem',
        full: '9999px',
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 4: Create postcss.config.js**

Create `packages/client/postcss.config.js`:

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 5: Create src/main.css**

Create `packages/client/src/main.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  display: inline-block;
  vertical-align: middle;
}
```

- [ ] **Step 6: Create src/main.jsx**

Create `packages/client/src/main.jsx`:

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import './main.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
```

- [ ] **Step 7: Create src/App.jsx**

Create `packages/client/src/App.jsx`:

```jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import TopNavBar from './components/TopNavBar';
import BottomNavBar from './components/BottomNavBar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import Analytics from './pages/Analytics';
import Habits from './pages/Habits';

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

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/calendar" element={<ProtectedRoute><AppLayout><Calendar /></AppLayout></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><AppLayout><Analytics /></AppLayout></ProtectedRoute>} />
      <Route path="/habits" element={<ProtectedRoute><AppLayout><Habits /></AppLayout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add packages/client
git commit -m "feat: scaffold Vite + React client with Tailwind config"
```

---

### Task 10: API Client + Auth Context + Auth Pages

**Files:**
- Create: `packages/client/src/services/api.js`
- Create: `packages/client/src/context/AuthContext.jsx`
- Create: `packages/client/src/components/ProtectedRoute.jsx`
- Create: `packages/client/src/pages/Login.jsx`
- Create: `packages/client/src/pages/Register.jsx`

- [ ] **Step 1: Create API client**

Create `packages/client/src/services/api.js`:

```jsx
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

- [ ] **Step 2: Create AuthContext**

Create `packages/client/src/context/AuthContext.jsx`:

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

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
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

- [ ] **Step 3: Create ProtectedRoute**

Create `packages/client/src/components/ProtectedRoute.jsx`:

```jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-on-surface-variant font-medium">Loading...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}
```

- [ ] **Step 4: Create Login page**

Create `packages/client/src/pages/Login.jsx`:

```jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Login failed');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md bg-surface-container-lowest p-8 rounded-4xl shadow-lg">
        <h1 className="font-headline text-3xl font-extrabold text-on-surface mb-2">Welcome back</h1>
        <p className="text-on-surface-variant mb-8">Sign in to The Mindful Flow</p>
        {error && (
          <div className="bg-error-container/20 text-error p-3 rounded-xl text-sm font-medium mb-4">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-on-surface-variant mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full px-5 py-4 rounded-2xl bg-surface-container border-none focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-on-surface-variant/40 font-medium" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-bold text-on-surface-variant mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full px-5 py-4 rounded-2xl bg-surface-container border-none focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-on-surface-variant/40 font-medium" placeholder="••••••" />
          </div>
          <button type="submit" className="w-full py-4 bg-primary text-on-primary font-bold rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all">
            Sign In
          </button>
        </form>
        <p className="text-center text-on-surface-variant text-sm mt-6">
          Don't have an account? <Link to="/register" className="text-primary font-semibold">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create Register page**

Create `packages/client/src/pages/Register.jsx`:

```jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await register(name, email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Registration failed');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md bg-surface-container-lowest p-8 rounded-4xl shadow-lg">
        <h1 className="font-headline text-3xl font-extrabold text-on-surface mb-2">Create account</h1>
        <p className="text-on-surface-variant mb-8">Start your mindful journey</p>
        {error && (
          <div className="bg-error-container/20 text-error p-3 rounded-xl text-sm font-medium mb-4">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-on-surface-variant mb-1">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full px-5 py-4 rounded-2xl bg-surface-container border-none focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-on-surface-variant/40 font-medium" placeholder="Your name" />
          </div>
          <div>
            <label className="block text-sm font-bold text-on-surface-variant mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full px-5 py-4 rounded-2xl bg-surface-container border-none focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-on-surface-variant/40 font-medium" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-bold text-on-surface-variant mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
              className="w-full px-5 py-4 rounded-2xl bg-surface-container border-none focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-on-surface-variant/40 font-medium" placeholder="••••••" />
          </div>
          <button type="submit" className="w-full py-4 bg-primary text-on-primary font-bold rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all">
            Create Account
          </button>
        </form>
        <p className="text-center text-on-surface-variant text-sm mt-6">
          Already have an account? <Link to="/login" className="text-primary font-semibold">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add packages/client/src
git commit -m "feat: add API client, auth context, and auth pages"
```

---

### Task 11: Navigation Components

**Files:**
- Create: `packages/client/src/components/TopNavBar.jsx`
- Create: `packages/client/src/components/BottomNavBar.jsx`
- Create: `packages/client/src/components/NotificationDropdown.jsx`
- Create: `packages/client/src/hooks/useNotifications.js`

- [ ] **Step 1: Create useNotifications hook**

Create `packages/client/src/hooks/useNotifications.js`:

```jsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then((r) => r.data),
    refetchInterval: 60000,
  });
}

export function useMarkAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.put(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarkAllAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.put('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}
```

- [ ] **Step 2: Create NotificationDropdown**

Create `packages/client/src/components/NotificationDropdown.jsx`:

```jsx
import { useState, useRef, useEffect } from 'react';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '../hooks/useNotifications';

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { data: notifications = [] } = useNotifications();
  const markRead = useMarkAsRead();
  const markAllRead = useMarkAllAsRead();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors relative">
        <span className="material-symbols-outlined">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-tertiary text-on-tertiary text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/10 z-50 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-outline-variant/10">
            <h3 className="font-headline font-bold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={() => markAllRead.mutate()} className="text-xs text-primary font-semibold">Mark all read</button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-center text-on-surface-variant text-sm">No notifications</p>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <div key={n._id} onClick={() => !n.isRead && markRead.mutate(n._id)}
                  className={`p-4 border-b border-outline-variant/5 cursor-pointer hover:bg-surface-container-low transition-colors ${!n.isRead ? 'bg-primary/5' : ''}`}>
                  <p className="text-sm font-semibold text-on-surface">{n.title}</p>
                  <p className="text-xs text-on-surface-variant mt-1">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create TopNavBar**

Create `packages/client/src/components/TopNavBar.jsx`:

```jsx
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';

const links = [
  { to: '/', label: 'Home' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/habits', label: 'Habits' },
];

export default function TopNavBar() {
  const { user, logout } = useAuth();

  return (
    <header className="hidden md:block bg-white/80 backdrop-blur-xl border-b border-outline-variant/15 shadow-sm sticky top-0 z-50">
      <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
        <div className="text-xl font-bold tracking-tighter text-on-surface font-headline">The Mindful Flow</div>
        <nav className="flex items-center space-x-8">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'}
              className={({ isActive }) =>
                `font-headline text-sm tracking-tight transition-colors ${isActive ? 'text-primary font-semibold border-b-2 border-primary pb-1' : 'text-on-surface-variant hover:text-on-surface'}`
              }>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center space-x-4">
          <NotificationDropdown />
          <button onClick={logout} className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors" title="Logout">
            <span className="material-symbols-outlined">logout</span>
          </button>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold font-headline">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Create BottomNavBar**

Create `packages/client/src/components/BottomNavBar.jsx`:

```jsx
import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/', icon: 'home', label: 'Home' },
  { to: '/calendar', icon: 'calendar_month', label: 'Calendar' },
  { to: '/habits', icon: 'add_circle', label: 'Add', special: true },
  { to: '/analytics', icon: 'analytics', label: 'Analytics' },
  { to: '/habits', icon: 'checklist', label: 'Habits' },
];

export default function BottomNavBar() {
  return (
    <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 md:hidden bg-white/85 backdrop-blur-2xl border-t border-outline-variant/20 shadow-lg">
      {tabs.map((t, i) => (
        <NavLink key={i} to={t.to} end={t.to === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center transition-transform active:scale-95 duration-150 ${
              isActive ? 'text-primary' : 'text-on-surface-variant'
            }`
          }>
          <span className={`material-symbols-outlined ${t.special ? 'text-3xl text-primary' : ''}`}>{t.icon}</span>
          <span className="text-[10px] font-semibold mt-1">{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add packages/client/src
git commit -m "feat: add navigation components and notification dropdown"
```

---

### Task 12: TanStack Query Hooks (Habits, Completions, Analytics)

**Files:**
- Create: `packages/client/src/hooks/useHabits.js`
- Create: `packages/client/src/hooks/useCompletions.js`
- Create: `packages/client/src/hooks/useAnalytics.js`

- [ ] **Step 1: Create useHabits hook**

Create `packages/client/src/hooks/useHabits.js`:

```jsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export function useHabits() {
  return useQuery({
    queryKey: ['habits'],
    queryFn: () => api.get('/habits').then((r) => r.data),
  });
}

export function useCreateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/habits', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits'] }),
  });
}

export function useUpdateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/habits/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits'] }),
  });
}

export function useDeleteHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/habits/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits'] }),
  });
}
```

- [ ] **Step 2: Create useCompletions hook**

Create `packages/client/src/hooks/useCompletions.js`:

```jsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export function useCompletionsByDate(date) {
  return useQuery({
    queryKey: ['completions', date],
    queryFn: () => api.get('/completions', { params: { date } }).then((r) => r.data),
    enabled: !!date,
  });
}

export function useCompletionsByRange(from, to) {
  return useQuery({
    queryKey: ['completions', from, to],
    queryFn: () => api.get('/completions', { params: { from, to } }).then((r) => r.data),
    enabled: !!from && !!to,
  });
}

export function useCreateCompletion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/completions', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['completions'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useDeleteCompletion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/completions/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['completions'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}
```

- [ ] **Step 3: Create useAnalytics hook**

Create `packages/client/src/hooks/useAnalytics.js`:

```jsx
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export function useWeeklyAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'weekly'],
    queryFn: () => api.get('/analytics/weekly').then((r) => r.data),
  });
}

export function useMonthlyAnalytics(month, year) {
  return useQuery({
    queryKey: ['analytics', 'monthly', month, year],
    queryFn: () => api.get('/analytics/monthly', { params: { month, year } }).then((r) => r.data),
    enabled: !!month && !!year,
  });
}

export function useHabitAnalytics(habitId) {
  return useQuery({
    queryKey: ['analytics', 'habit', habitId],
    queryFn: () => api.get(`/analytics/habits/${habitId}`).then((r) => r.data),
    enabled: !!habitId,
  });
}
```

- [ ] **Step 4: Commit**

```bash
git add packages/client/src/hooks
git commit -m "feat: add TanStack Query hooks for habits, completions, analytics"
```

---

### Task 13: Shared UI Components

**Files:**
- Create: `packages/client/src/components/HabitCard.jsx`
- Create: `packages/client/src/components/ProgressRing.jsx`
- Create: `packages/client/src/components/StatCard.jsx`
- Create: `packages/client/src/components/HabitModal.jsx`
- Create: `packages/client/src/components/FAB.jsx`

- [ ] **Step 1: Create ProgressRing**

Create `packages/client/src/components/ProgressRing.jsx`:

```jsx
export default function ProgressRing({ percent = 0, size = 192, strokeWidth = 12, color = 'text-secondary' }) {
  const radius = (size / 2) - (strokeWidth / 2);
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="transparent" stroke="currentColor"
          strokeWidth={strokeWidth} className="text-surface-container" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="transparent" stroke="currentColor"
          strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" className={color} style={{ filter: 'drop-shadow(0 0 8px rgba(0, 109, 74, 0.2))' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-headline text-4xl font-extrabold text-on-surface">{percent}%</span>
        <span className="text-on-surface-variant text-xs font-bold tracking-widest uppercase">ON TRACK</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create StatCard**

Create `packages/client/src/components/StatCard.jsx`:

```jsx
export default function StatCard({ icon, value, label, iconColor = 'text-primary' }) {
  return (
    <div className="bg-surface-container-low p-5 rounded-xl">
      <span className="material-symbols-outlined mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>
        <span className={iconColor}>{icon}</span>
      </span>
      <div className="text-2xl font-extrabold font-headline">{value}</div>
      <div className="text-xs font-bold text-on-surface-variant uppercase tracking-tighter">{label}</div>
    </div>
  );
}
```

- [ ] **Step 3: Create HabitCard**

Create `packages/client/src/components/HabitCard.jsx`:

```jsx
const colorMap = {
  primary: { bg: 'bg-primary/10', text: 'text-primary', btnBg: 'bg-primary' },
  secondary: { bg: 'bg-secondary/10', text: 'text-secondary', btnBg: 'bg-secondary' },
  tertiary: { bg: 'bg-tertiary/10', text: 'text-tertiary', btnBg: 'bg-tertiary' },
};

export default function HabitCard({ habit, completed, progress = 0, onToggle }) {
  const colors = colorMap[habit.color] || colorMap.primary;

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
          <div className={`${completed ? colors.btnBg : 'bg-surface-dim'} h-full rounded-full transition-all duration-500`}
            style={{ width: `${completed ? 100 : Math.max(progress, 5)}%` }} />
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

- [ ] **Step 4: Create HabitModal**

Create `packages/client/src/components/HabitModal.jsx`:

```jsx
import { useState, useEffect } from 'react';
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

  if (!open) return null;

  function handleSubmit(e) {
    e.preventDefault();
    onSave({ name, frequency, target: frequency === 'daily' ? 1 : target, icon, color, description });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-4xl shadow-xl overflow-hidden">
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
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create FAB**

Create `packages/client/src/components/FAB.jsx`:

```jsx
export default function FAB({ onClick }) {
  return (
    <button onClick={onClick}
      className="fixed bottom-28 right-6 md:bottom-8 md:right-8 bg-primary text-on-primary w-14 h-14 md:w-16 md:h-16 rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-40 group">
      <span className="material-symbols-outlined text-2xl md:text-3xl">add</span>
      <span className="absolute right-full mr-4 bg-on-surface text-surface text-xs font-bold py-2 px-4 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden md:block">
        Add Habit
      </span>
    </button>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add packages/client/src/components
git commit -m "feat: add shared UI components (HabitCard, ProgressRing, HabitModal, FAB)"
```

---

### Task 14: Dashboard Page

**Files:**
- Create: `packages/client/src/pages/Dashboard.jsx`

- [ ] **Step 1: Create Dashboard page**

Create `packages/client/src/pages/Dashboard.jsx`:

```jsx
import { useAuth } from '../context/AuthContext';
import { useHabits } from '../hooks/useHabits';
import { useCompletionsByDate, useCreateCompletion, useDeleteCompletion } from '../hooks/useCompletions';
import { useWeeklyAnalytics } from '../hooks/useAnalytics';
import HabitCard from '../components/HabitCard';
import ProgressRing from '../components/ProgressRing';
import StatCard from '../components/StatCard';

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: habits = [] } = useHabits();
  const today = getToday();
  const { data: completions = [] } = useCompletionsByDate(today);
  const { data: weekly } = useWeeklyAnalytics();
  const createCompletion = useCreateCompletion();
  const deleteCompletion = useDeleteCompletion();

  const dailyHabits = habits.filter((h) => h.frequency === 'daily');
  const completedIds = new Set(completions.map((c) => c.habitId?._id || c.habitId));
  const completedCount = dailyHabits.filter((h) => completedIds.has(h._id)).length;

  function handleToggle(habit) {
    const existing = completions.find((c) => (c.habitId?._id || c.habitId) === habit._id);
    if (existing) {
      deleteCompletion.mutate(existing._id);
    } else {
      createCompletion.mutate({ habitId: habit._id, date: today });
    }
  }

  const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  return (
    <>
      <section className="mb-10">
        <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface mb-2">
          {getGreeting()}, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-on-surface-variant font-medium">{dayName}, {dateStr}</p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-headline text-xl font-bold">Daily Rituals</h2>
            <span className="text-sm font-semibold text-primary bg-primary/5 px-3 py-1 rounded-full">
              {completedCount} of {dailyHabits.length} completed
            </span>
          </div>
          {dailyHabits.map((habit) => (
            <HabitCard key={habit._id} habit={habit} completed={completedIds.has(habit._id)}
              onToggle={() => handleToggle(habit)} />
          ))}
          {dailyHabits.length === 0 && (
            <p className="text-on-surface-variant text-center py-12">No daily habits yet. Create one to get started!</p>
          )}
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm relative overflow-hidden">
            <h2 className="font-headline text-xl font-bold mb-8">Weekly Flow</h2>
            <div className="flex flex-col items-center">
              <ProgressRing percent={weekly?.score || 0} />
              <p className="text-center text-on-surface-variant text-sm leading-relaxed px-4 mt-6">
                You've completed <span className="text-secondary font-bold">{weekly?.completedCount || 0} rituals</span> this week.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <StatCard icon="bolt" value={weekly?.streak || 0} label="Day Streak" iconColor="text-primary" />
            <StatCard icon="star" value={weekly?.score || 0} label="Weekly Score" iconColor="text-tertiary" />
          </div>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/client/src/pages/Dashboard.jsx
git commit -m "feat: add Dashboard page with daily habits and weekly flow"
```

---

### Task 15: Habits Management Page

**Files:**
- Create: `packages/client/src/pages/Habits.jsx`

- [ ] **Step 1: Create Habits page**

Create `packages/client/src/pages/Habits.jsx`:

```jsx
import { useState } from 'react';
import { useHabits, useCreateHabit, useUpdateHabit, useDeleteHabit } from '../hooks/useHabits';
import HabitModal from '../components/HabitModal';
import FAB from '../components/FAB';

const colorMap = {
  primary: { bg: 'bg-primary/10', text: 'text-primary', progress: 'bg-primary' },
  secondary: { bg: 'bg-secondary/10', text: 'text-secondary', progress: 'bg-secondary' },
  tertiary: { bg: 'bg-tertiary/10', text: 'text-tertiary', progress: 'bg-tertiary' },
};

export default function Habits() {
  const { data: habits = [] } = useHabits();
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  const deleteHabit = useDeleteHabit();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  function handleSave(data) {
    if (editing) {
      updateHabit.mutate({ id: editing._id, ...data });
    } else {
      createHabit.mutate(data);
    }
    setModalOpen(false);
    setEditing(null);
  }

  function handleEdit(habit) {
    setEditing(habit);
    setModalOpen(true);
  }

  function handleDelete(id) {
    if (window.confirm('Archive this habit?')) {
      deleteHabit.mutate(id);
    }
  }

  return (
    <>
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-3">Habit Ecosystem</h1>
          <p className="text-on-surface-variant text-lg">Nurture your daily rituals and track your evolution.</p>
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true); }}
          className="flex items-center gap-2 px-8 py-4 bg-primary text-on-primary rounded-xl font-semibold active:scale-95 transition-transform shadow-sm">
          <span className="material-symbols-outlined">add_circle</span>
          <span>New Habit</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {habits.map((habit) => {
          const colors = colorMap[habit.color] || colorMap.primary;
          return (
            <div key={habit._id} className="group bg-surface-container-lowest p-7 rounded-4xl border border-outline-variant/10 hover:border-primary/20 transition-all duration-300">
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
          );
        })}
      </div>

      {habits.length === 0 && (
        <p className="text-on-surface-variant text-center py-20 text-lg">No habits yet. Create your first one!</p>
      )}

      <HabitModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} onSave={handleSave} habit={editing} />
      <FAB onClick={() => { setEditing(null); setModalOpen(true); }} />
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/client/src/pages/Habits.jsx
git commit -m "feat: add Habits management page with create/edit/delete"
```

---

### Task 16: Calendar Page

**Files:**
- Create: `packages/client/src/components/CalendarGrid.jsx`
- Create: `packages/client/src/components/DayDetailPanel.jsx`
- Create: `packages/client/src/pages/Calendar.jsx`

- [ ] **Step 1: Create CalendarGrid**

Create `packages/client/src/components/CalendarGrid.jsx`:

```jsx
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarGrid({ year, month, dayData = {}, selectedDate, onSelectDate }) {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date().toISOString().split('T')[0];

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="bg-surface-container-lowest rounded-4xl p-4 md:p-8 shadow-sm">
      <div className="grid grid-cols-7 mb-4">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center text-xs font-bold uppercase tracking-widest text-outline py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} className="aspect-square p-2 bg-surface/30" />;
          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const completions = dayData[dateStr] || [];
          const isSelected = selectedDate === dateStr;
          const isToday = dateStr === today;

          return (
            <div key={i} onClick={() => onSelectDate(dateStr)}
              className={`aspect-square p-2 md:p-3 cursor-pointer transition-all border ${
                isSelected ? 'bg-primary-container/10 border-2 border-primary ring-4 ring-primary/5' :
                'bg-surface-container-lowest border-surface-container hover:bg-surface-container-low'
              }`}>
              <span className={`text-sm font-bold ${isSelected ? 'text-primary font-extrabold' : isToday ? 'text-primary' : 'text-on-surface-variant'}`}>{day}</span>
              <div className="mt-1 flex flex-wrap gap-0.5">
                {completions.slice(0, 4).map((c, ci) => (
                  <span key={ci} className="w-1.5 h-1.5 rounded-full bg-secondary" />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create DayDetailPanel**

Create `packages/client/src/components/DayDetailPanel.jsx`:

```jsx
export default function DayDetailPanel({ date, completions = [], habits = [] }) {
  if (!date) return null;

  const d = new Date(date + 'T00:00:00');
  const formatted = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', ordinal: true });

  const completedIds = new Set(completions.map((c) => c.habitId?._id || c.habitId));
  const completed = habits.filter((h) => completedIds.has(h._id));
  const missed = habits.filter((h) => h.frequency === 'daily' && !completedIds.has(h._id));

  return (
    <div className="bg-surface-container-low rounded-4xl p-8 shadow-sm border border-outline-variant/10">
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
    </div>
  );
}
```

- [ ] **Step 3: Create Calendar page**

Create `packages/client/src/pages/Calendar.jsx`:

```jsx
import { useState, useMemo } from 'react';
import { useMonthlyAnalytics } from '../hooks/useAnalytics';
import { useHabits } from '../hooks/useHabits';
import { useCompletionsByDate } from '../hooks/useCompletions';
import CalendarGrid from '../components/CalendarGrid';
import DayDetailPanel from '../components/DayDetailPanel';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function Calendar() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [selectedDate, setSelectedDate] = useState(now.toISOString().split('T')[0]);

  const { data: monthly } = useMonthlyAnalytics(month, year);
  const { data: habits = [] } = useHabits();
  const { data: dayCompletions = [] } = useCompletionsByDate(selectedDate);

  const dayData = useMemo(() => {
    const map = {};
    if (monthly?.days) {
      for (const d of monthly.days) {
        map[d.date] = d.completions;
      }
    }
    return map;
  }, [monthly]);

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
  }

  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
  }

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-2">
            {MONTH_NAMES[month - 1]} {year}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-grow">
          <CalendarGrid year={year} month={month} dayData={dayData} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        </div>
        <aside className="w-full lg:w-96 shrink-0">
          <DayDetailPanel date={selectedDate} completions={dayCompletions} habits={habits} />
        </aside>
      </div>
    </>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add packages/client/src
git commit -m "feat: add Calendar page with grid and day detail panel"
```

---

### Task 17: Analytics Page

**Files:**
- Create: `packages/client/src/components/ChartBlock.jsx`
- Create: `packages/client/src/pages/Analytics.jsx`

- [ ] **Step 1: Create ChartBlock**

Create `packages/client/src/components/ChartBlock.jsx`:

```jsx
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function TrendChart({ data = [] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eaeff2" />
        <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: 700 }} stroke="#acb3b7"
          tickFormatter={(v) => ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][new Date(v).getUTCDay()]} />
        <YAxis hide />
        <Tooltip />
        <Line type="monotone" dataKey="count" stroke="#005bc4" strokeWidth={3} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ComparisonBar({ data = [] }) {
  return (
    <div className="space-y-6">
      {data.map((item, i) => (
        <div key={i} className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-on-surface-variant">
            <span>{item.label}</span>
            <span className={i === 0 ? 'text-primary' : ''}>{item.completed} / {item.target}</span>
          </div>
          <div className="h-8 w-full bg-surface-container rounded-xl overflow-hidden">
            <div className={`h-full rounded-l-xl ${i === 0 ? 'bg-primary-container' : 'bg-surface-dim'}`}
              style={{ width: `${item.target > 0 ? (item.completed / item.target) * 100 : 0}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create Analytics page**

Create `packages/client/src/pages/Analytics.jsx`:

```jsx
import { useWeeklyAnalytics } from '../hooks/useAnalytics';
import { useHabits } from '../hooks/useHabits';
import { TrendChart, ComparisonBar } from '../components/ChartBlock';

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

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Hero Score */}
        <div className="md:col-span-4 bg-surface-container-lowest p-8 rounded-3xl flex flex-col justify-between relative overflow-hidden">
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

        {/* Trend Chart */}
        <div className="md:col-span-8 bg-surface-container-lowest p-8 rounded-3xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-headline font-bold text-xl">Consistency Trend</h3>
          </div>
          <TrendChart data={weekly?.dayData || []} />
        </div>

        {/* Comparison Bar */}
        <div className="md:col-span-7 bg-surface-container-lowest p-8 rounded-3xl">
          <h3 className="font-headline font-bold text-xl mb-8">Completed vs Target</h3>
          <ComparisonBar data={barData} />
        </div>

        {/* Streak Tip */}
        <div className="md:col-span-5 bg-secondary-container/30 p-8 rounded-3xl flex flex-col justify-between border border-secondary/10">
          <div>
            <span className="material-symbols-outlined text-secondary text-3xl mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <h3 className="font-headline font-extrabold text-2xl text-on-surface mb-3">Zen Pulse Tip</h3>
            <p className="text-on-surface-variant leading-relaxed">
              Your current streak is <span className="font-bold text-secondary">{weekly?.streak || 0} days</span>. Keep building momentum!
            </p>
          </div>
        </div>

        {/* Habit Breakdown */}
        <div className="md:col-span-12 mt-4">
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
      </div>
    </>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/client/src
git commit -m "feat: add Analytics page with charts and habit breakdown"
```

---

### Task 18: Docker Compose + Dockerfiles

**Files:**
- Create: `docker-compose.yml`
- Create: `packages/server/Dockerfile`
- Create: `packages/client/Dockerfile`
- Create: `packages/client/nginx.conf`

- [ ] **Step 1: Create docker-compose.yml**

Create `docker-compose.yml`:

```yaml
services:
  client:
    build: ./packages/client
    ports:
      - "3000:80"
    depends_on:
      - server

  server:
    build: ./packages/server
    ports:
      - "5000:5000"
    depends_on:
      - mongo
    environment:
      - MONGO_URI=mongodb://mongo:27017/mindful-flow
      - JWT_SECRET=${JWT_SECRET:-change-me-in-production}
      - PORT=5000
      - NODE_ENV=production

  mongo:
    image: mongo:7
    volumes:
      - mongo-data:/data/db
    ports:
      - "27017:27017"

volumes:
  mongo-data:
```

- [ ] **Step 2: Create server Dockerfile**

Create `packages/server/Dockerfile`:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY src ./src
COPY ../shared /shared
EXPOSE 5000
CMD ["node", "src/index.js"]
```

- [ ] **Step 3: Create client nginx.conf**

Create `packages/client/nginx.conf`:

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://server:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

- [ ] **Step 4: Create client Dockerfile**

Create `packages/client/Dockerfile`:

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

- [ ] **Step 5: Commit**

```bash
git add docker-compose.yml packages/server/Dockerfile packages/client/Dockerfile packages/client/nginx.conf
git commit -m "feat: add Docker Compose config and Dockerfiles"
```
