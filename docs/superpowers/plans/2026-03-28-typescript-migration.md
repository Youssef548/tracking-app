# TypeScript Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate all four packages from JavaScript to TypeScript with maximum strictness and zero `any` types.

**Architecture:** Incremental migration — shared → server → client → e2e. Each package must pass its validation gate before the next begins. Server uses tsx (no compile step), shared uses tsup (dual CJS/ESM output).

**Tech Stack:** TypeScript 5, tsup, tsx, ts-jest, @types/express, @types/mongoose (built-in), @types/bcryptjs, @types/jsonwebtoken, @types/cors, @types/node, @types/react-dom

---

## Task 1: Root — Create tsconfig.base.json

**Files:**
- Create: `tsconfig.base.json`

- [ ] **Create root base config**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

Note: `skipLibCheck: true` avoids false positives from third-party @types packages that don't fully support `exactOptionalPropertyTypes`. Your own code is still fully checked.

- [ ] **Commit**

```bash
git add tsconfig.base.json
git commit -m "chore: add root tsconfig.base.json for TypeScript migration"
```

---

## Task 2: packages/shared — Install deps + create src/constants.ts

**Files:**
- Create: `packages/shared/src/constants.ts`

- [ ] **Install tsup and typescript**

```bash
cd packages/shared
pnpm add -D tsup typescript
mkdir src
```

- [ ] **Create src/constants.ts**

```ts
export const FREQUENCIES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
} as const;
export type Frequency = (typeof FREQUENCIES)[keyof typeof FREQUENCIES];

export const COLORS = ['primary', 'secondary', 'tertiary'] as const;
export type Color = (typeof COLORS)[number];

export const NOTIFICATION_TYPES = {
  STREAK: 'streak',
  REMINDER: 'reminder',
  ACHIEVEMENT: 'achievement',
  TIP: 'tip',
} as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export const HABIT_ICONS = [
  'self_improvement', 'water_drop', 'menu_book', 'fitness_center',
  'forest', 'edit_note', 'bedtime', 'restaurant', 'code', 'music_note',
] as const;
export type HabitIcon = (typeof HABIT_ICONS)[number];

export const TRACKING_TYPES = {
  CHECKMARK: 'checkmark',
  DURATION: 'duration',
} as const;
export type TrackingType = (typeof TRACKING_TYPES)[keyof typeof TRACKING_TYPES];

export const CATEGORY_COLORS = [
  '#8b5cf6', '#22c55e', '#f59e0b', '#3b82f6', '#ef4444',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
] as const;
```

---

## Task 3: packages/shared — Create src/validation.ts + src/types.ts

**Files:**
- Create: `packages/shared/src/validation.ts`
- Create: `packages/shared/src/types.ts`

- [ ] **Create src/validation.ts**

```ts
import { FREQUENCIES, COLORS, TRACKING_TYPES } from './constants';
import type { Frequency, Color, TrackingType } from './constants';

export interface ValidationResult<E extends Record<string, string> = Record<string, string>> {
  isValid: boolean;
  errors: Partial<E>;
}

interface AuthErrors { name: string; email: string; password: string; }
interface HabitErrors { name: string; frequency: string; target: string; color: string; trackingType: string; weeklyTarget: string; }
interface CompletionErrors { habitId: string; date: string; value: string; }
interface CategoryErrors { name: string; color: string; }

export function validateAuthInput(
  data: Partial<{ name: string; email: string; password: string }>,
  isLogin = false,
): ValidationResult<AuthErrors> {
  const errors: Partial<AuthErrors> = {};
  if (!isLogin && (!data.name || data.name.trim().length === 0)) errors.name = 'Name is required';
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Valid email is required';
  if (!data.password || data.password.length < 6) errors.password = 'Password must be at least 6 characters';
  return { isValid: Object.keys(errors).length === 0, errors };
}

export function validateHabitInput(
  data: Partial<{ name: string; frequency: Frequency; target: number; color: Color; trackingType: TrackingType; weeklyTarget: number }>,
): ValidationResult<HabitErrors> {
  const errors: Partial<HabitErrors> = {};
  if (!data.name || data.name.trim().length === 0) errors.name = 'Habit name is required';
  if (data.name && data.name.length > 100) errors.name = 'Habit name must be under 100 characters';
  if (!data.frequency || !Object.values(FREQUENCIES).includes(data.frequency)) errors.frequency = 'Frequency must be "daily" or "weekly"';
  if (data.frequency === FREQUENCIES.WEEKLY) {
    if (!data.target || data.target < 1 || data.target > 7) errors.target = 'Weekly target must be between 1 and 7';
  }
  if (data.color && !COLORS.includes(data.color)) errors.color = 'Invalid color token';
  if (data.trackingType && !Object.values(TRACKING_TYPES).includes(data.trackingType)) errors.trackingType = 'Tracking type must be "checkmark" or "duration"';
  if (data.trackingType === TRACKING_TYPES.DURATION) {
    if (!data.weeklyTarget || data.weeklyTarget < 1 || data.weeklyTarget > 168) errors.weeklyTarget = 'Weekly target must be between 1 and 168 hours';
  }
  return { isValid: Object.keys(errors).length === 0, errors };
}

export function validateCompletionInput(
  data: Partial<{ habitId: string; date: string; value: number }>,
): ValidationResult<CompletionErrors> {
  const errors: Partial<CompletionErrors> = {};
  if (!data.habitId) errors.habitId = 'Habit ID is required';
  if (!data.date) errors.date = 'Date is required';
  if (data.value !== undefined && (typeof data.value !== 'number' || data.value < 0)) errors.value = 'Value must be a non-negative number';
  return { isValid: Object.keys(errors).length === 0, errors };
}

export function validateCategoryInput(
  data: Partial<{ name: string; color: string }>,
): ValidationResult<CategoryErrors> {
  const errors: Partial<CategoryErrors> = {};
  if (!data.name || data.name.trim().length === 0) errors.name = 'Category name is required';
  if (data.name && data.name.length > 50) errors.name = 'Category name must be under 50 characters';
  if (!data.color || !/^#[0-9a-fA-F]{6}$/.test(data.color)) errors.color = 'Valid hex color is required';
  return { isValid: Object.keys(errors).length === 0, errors };
}
```

- [ ] **Create src/types.ts**

```ts
import type { Frequency, Color, TrackingType, NotificationType } from './constants';

export type { Frequency, Color, TrackingType, NotificationType };

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar: string;
  createdAt: string;
  updatedAt: string;
}

export interface HabitCategory {
  _id: string;
  name: string;
  color: string;
}

export interface Habit {
  _id: string;
  userId: string;
  name: string;
  icon: string;
  color: Color;
  frequency: Frequency;
  target: number;
  description: string;
  categoryId: HabitCategory | null;
  trackingType: TrackingType;
  weeklyTarget: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompletionHabit {
  _id: string;
  name: string;
  icon: string;
  color: Color;
  frequency: Frequency;
}

export interface Completion {
  _id: string;
  habitId: CompletionHabit;
  userId: string;
  date: string;
  value: number;
  note: string;
  createdAt: string;
}

export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface Category {
  _id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHabitInput {
  name: string;
  frequency: Frequency;
  icon?: string;
  color?: Color;
  target?: number;
  description?: string;
  categoryId?: string | null;
  trackingType?: TrackingType;
  weeklyTarget?: number | null;
}

export interface CreateCompletionInput {
  habitId: string;
  date: string;
  value?: number;
  note?: string;
}

export interface CreateCategoryInput {
  name: string;
  color: string;
}
```

---

## Task 4: packages/shared — tsup.config.ts + tsconfig.json + update package.json + build + commit

**Files:**
- Create: `packages/shared/tsup.config.ts`
- Create: `packages/shared/tsconfig.json`
- Modify: `packages/shared/package.json`
- Delete: `packages/shared/constants.js`, `packages/shared/constants.mjs`, `packages/shared/validation.js`, `packages/shared/validation.mjs`

- [ ] **Create tsup.config.ts**

```ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/constants.ts', 'src/validation.ts', 'src/types.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  outDir: 'dist',
  outExtension({ format }) {
    return { js: format === 'esm' ? '.mjs' : '.js' };
  },
});
```

- [ ] **Create tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "outDir": "dist"
  },
  "include": ["src"]
}
```

- [ ] **Update package.json**

Replace the entire file:

```json
{
  "name": "@mindful-flow/shared",
  "version": "1.0.0",
  "main": "dist/constants.js",
  "exports": {
    "./constants": {
      "import": "./dist/constants.mjs",
      "require": "./dist/constants.js",
      "types": "./dist/constants.d.ts"
    },
    "./validation": {
      "import": "./dist/validation.mjs",
      "require": "./dist/validation.js",
      "types": "./dist/validation.d.ts"
    },
    "./types": {
      "import": "./dist/types.mjs",
      "require": "./dist/types.js",
      "types": "./dist/types.d.ts"
    }
  },
  "scripts": {
    "build": "tsup",
    "typecheck": "tsc --noEmit",
    "test": "echo 'No tests for shared'"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.0.0"
  }
}
```

- [ ] **Build and verify**

```bash
cd packages/shared
pnpm build
```

Expected: `dist/` contains `constants.js`, `constants.mjs`, `constants.d.ts`, `validation.js`, `validation.mjs`, `validation.d.ts`, `types.js`, `types.mjs`, `types.d.ts`

- [ ] **Delete old hand-written files**

```bash
cd packages/shared
rm constants.js constants.mjs validation.js validation.mjs
```

- [ ] **Commit**

```bash
git add packages/shared/
git commit -m "feat(shared): migrate to TypeScript with tsup dual CJS/ESM build"
```

---

## Task 5: packages/server — Install deps + tsconfig.json + jest.config.js + update package.json

**Files:**
- Create: `packages/server/tsconfig.json`
- Create: `packages/server/jest.config.js`
- Modify: `packages/server/package.json`

- [ ] **Install TypeScript dependencies**

```bash
cd packages/server
pnpm add -D typescript tsx ts-jest @types/express @types/bcryptjs @types/jsonwebtoken @types/cors @types/node @types/supertest
```

- [ ] **Create tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "node",
    "rootDir": "."
  },
  "include": ["src", "__tests__"]
}
```

- [ ] **Create jest.config.js**

```js
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./__tests__/setup.ts'],
  testMatch: ['**/__tests__/**/*.test.ts'],
};
```

- [ ] **Update package.json scripts and remove inline jest config**

Change `scripts` section and remove the top-level `"jest"` key:

```json
{
  "name": "@mindful-flow/server",
  "version": "1.0.0",
  "main": "src/index.ts",
  "scripts": {
    "dev": "nodemon --exec tsx src/index.ts",
    "dev:mem": "tsx start-dev.ts",
    "build": "echo 'No build step — server runs via tsx'",
    "start": "tsx src/index.ts",
    "typecheck": "tsc --noEmit",
    "test": "jest --runInBand --forceExit"
  },
  "dependencies": {
    "@mindful-flow/shared": "workspace:*",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "express-rate-limit": "^7.5.0",
    "helmet": "^8.1.0",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.10.0"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/node": "^22.0.0",
    "@types/supertest": "^6.0.2",
    "jest": "^29.7.0",
    "mongodb-memory-server": "^10.4.0",
    "nodemon": "^3.1.9",
    "supertest": "^7.0.0",
    "ts-jest": "^29.2.0",
    "tsx": "^4.0.0",
    "typescript": "^5.0.0"
  }
}
```

---

## Task 6: packages/server — src/types/express.d.ts + all 5 models

**Files:**
- Create: `packages/server/src/types/express.d.ts`
- Create: `packages/server/src/models/User.ts`
- Create: `packages/server/src/models/Habit.ts`
- Create: `packages/server/src/models/Completion.ts`
- Create: `packages/server/src/models/Notification.ts`
- Create: `packages/server/src/models/Category.ts`

- [ ] **Create src/types/express.d.ts**

```ts
import type { UserDocument } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: UserDocument;
    }
  }
}
```

- [ ] **Create src/models/User.ts**

```ts
import mongoose, { Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser {
  name: string;
  email: string;
  password: string;
  avatar: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  comparePassword(candidate: string): Promise<boolean>;
}

export type UserDocument = Document & IUser & IUserMethods;
type UserModel = Model<IUser, Record<string, never>, IUserMethods>;

const userSchema = new mongoose.Schema<IUser, UserModel, IUserMethods>(
  {
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
  },
  { timestamps: true },
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const rounds = process.env['E2E'] === 'true' || process.env['NODE_ENV'] === 'test' ? 1 : 10;
  this.password = await bcrypt.hash(this.password, rounds);
  next();
});

userSchema.methods.comparePassword = async function (this: UserDocument, candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toJSON = function (this: UserDocument) {
  const { password: _pw, ...rest } = this.toObject();
  return rest;
};

export default mongoose.model<IUser, UserModel>('User', userSchema);
```

- [ ] **Create src/models/Habit.ts**

```ts
import mongoose, { Document, Model } from 'mongoose';
import { FREQUENCIES, COLORS, TRACKING_TYPES } from '@mindful-flow/shared/constants';
import type { Frequency, Color, TrackingType } from '@mindful-flow/shared/constants';
import type { CategoryDocument } from './Category';

export interface IHabit {
  userId: mongoose.Types.ObjectId;
  name: string;
  icon: string;
  color: Color;
  frequency: Frequency;
  target: number;
  description: string;
  categoryId: mongoose.PopulatedDoc<CategoryDocument> | null;
  trackingType: TrackingType;
  weeklyTarget: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type HabitDocument = Document & IHabit;
type HabitModel = Model<IHabit>;

const habitSchema = new mongoose.Schema<IHabit, HabitModel>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: [true, 'Habit name is required'], trim: true, maxlength: 100 },
    icon: { type: String, default: 'check_circle' },
    color: { type: String, enum: [...COLORS], default: 'primary' },
    frequency: { type: String, enum: Object.values(FREQUENCIES), required: true },
    target: { type: Number, default: 1, min: 1, max: 7 },
    description: { type: String, default: '', maxlength: 255 },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    trackingType: { type: String, enum: Object.values(TRACKING_TYPES), default: 'checkmark' },
    weeklyTarget: { type: Number, default: null, min: 1, max: 168 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

habitSchema.index({ userId: 1, isActive: 1 });

export default mongoose.model<IHabit, HabitModel>('Habit', habitSchema);
```

- [ ] **Create src/models/Completion.ts**

```ts
import mongoose, { Document, Model } from 'mongoose';
import type { HabitDocument } from './Habit';

export interface ICompletion {
  habitId: mongoose.PopulatedDoc<HabitDocument>;
  userId: mongoose.Types.ObjectId;
  date: Date;
  value: number;
  note: string;
  completedAt: Date;
}

export type CompletionDocument = Document & ICompletion;
type CompletionModel = Model<ICompletion>;

const completionSchema = new mongoose.Schema<ICompletion, CompletionModel>({
  habitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Habit', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  value: { type: Number, default: 1, min: 0 },
  note: { type: String, default: '', maxlength: 500 },
  completedAt: { type: Date, default: Date.now },
});

completionSchema.index({ userId: 1, date: 1 });
completionSchema.index({ habitId: 1, date: 1 }, { unique: true });

export default mongoose.model<ICompletion, CompletionModel>('Completion', completionSchema);
```

- [ ] **Create src/models/Notification.ts**

```ts
import mongoose, { Document, Model } from 'mongoose';
import { NOTIFICATION_TYPES } from '@mindful-flow/shared/constants';
import type { NotificationType } from '@mindful-flow/shared/constants';

export interface INotification {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type NotificationDocument = Document & INotification;
type NotificationModel = Model<INotification>;

const notificationSchema = new mongoose.Schema<INotification, NotificationModel>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: Object.values(NOTIFICATION_TYPES), required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model<INotification, NotificationModel>('Notification', notificationSchema);
```

- [ ] **Create src/models/Category.ts**

```ts
import mongoose, { Document, Model } from 'mongoose';

export interface ICategory {
  name: string;
  color: string;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type CategoryDocument = Document & ICategory;
type CategoryModel = Model<ICategory>;

const categorySchema = new mongoose.Schema<ICategory, CategoryModel>(
  {
    name: { type: String, required: [true, 'Category name is required'], trim: true, maxlength: 50 },
    color: { type: String, required: [true, 'Color is required'], match: /^#[0-9a-fA-F]{6}$/ },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true },
);

categorySchema.index({ userId: 1, name: 1 }, { unique: true });

export default mongoose.model<ICategory, CategoryModel>('Category', categorySchema);
```

---

## Task 7: packages/server — All middleware + all utils

**Files:**
- Create: `packages/server/src/middleware/auth.ts`
- Create: `packages/server/src/middleware/errorHandler.ts`
- Create: `packages/server/src/middleware/validate.ts`
- Create: `packages/server/src/utils/dateHelpers.ts`
- Create: `packages/server/src/utils/streakCalculator.ts`

- [ ] **Create src/middleware/auth.ts**

```ts
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import User from '../models/User';

const JWT_SECRET = process.env['JWT_SECRET'];
if (!JWT_SECRET) throw new Error('JWT_SECRET environment variable is required');

export default async function auth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: { message: 'No token provided', code: 'NO_TOKEN' } });
    return;
  }
  try {
    const token = header.split(' ')[1] as string;
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(401).json({ error: { message: 'User not found', code: 'USER_NOT_FOUND' } });
      return;
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: { message: 'Invalid token', code: 'INVALID_TOKEN' } });
  }
}
```

- [ ] **Create src/middleware/errorHandler.ts**

```ts
import { Request, Response, NextFunction } from 'express';

interface MongooseValidationError extends Error {
  name: 'ValidationError';
  errors: Record<string, { message: string }>;
}

interface MongoDuplicateError extends Error {
  code: number;
}

export default function errorHandler(
  err: Error | MongooseValidationError | MongoDuplicateError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error(err.stack ?? err.message);

  if (err.name === 'ValidationError') {
    const e = err as MongooseValidationError;
    const fields: Record<string, string> = {};
    for (const key of Object.keys(e.errors)) {
      fields[key] = e.errors[key]?.message ?? 'Invalid value';
    }
    res.status(400).json({ error: { message: 'Validation failed', code: 'VALIDATION_ERROR', fields } });
    return;
  }

  if (err.name === 'CastError') {
    res.status(400).json({ error: { message: 'Invalid ID format', code: 'INVALID_ID' } });
    return;
  }

  const dupErr = err as MongoDuplicateError;
  if (dupErr.code === 11000) {
    res.status(409).json({ error: { message: 'Duplicate entry', code: 'DUPLICATE' } });
    return;
  }

  const statusErr = err as Error & { status?: number };
  const status = statusErr.status ?? 500;
  const message = statusErr.status ? err.message : 'Internal server error';
  res.status(status).json({ error: { message, code: 'SERVER_ERROR' } });
}
```

- [ ] **Create src/middleware/validate.ts**

```ts
import { Request, Response, NextFunction } from 'express';
import type { ValidationResult } from '@mindful-flow/shared/validation';

type ValidatorFn = (...args: unknown[]) => ValidationResult;

export default function validate(validationFn: ValidatorFn, ...args: unknown[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { isValid, errors } = validationFn(req.body, ...args);
    if (!isValid) {
      res.status(400).json({ error: { message: 'Validation failed', code: 'VALIDATION_ERROR', fields: errors } });
      return;
    }
    next();
  };
}
```

- [ ] **Create src/utils/dateHelpers.ts**

```ts
export interface DateRange {
  start: Date;
  end: Date;
}

export function normalizeDate(dateInput: string | Date | number): Date {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) throw new Error(`Invalid date: ${String(dateInput)}`);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function getWeekRange(): DateRange {
  const now = new Date();
  const dayOfWeek = now.getUTCDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const start = new Date(now);
  start.setUTCDate(now.getUTCDate() - diff);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 7);
  return { start, end };
}

export function getMonthRange(month: number, year: number): DateRange {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { start, end };
}
```

- [ ] **Create src/utils/streakCalculator.ts**

```ts
import { normalizeDate } from './dateHelpers';

interface CompletionLike {
  date: Date;
}

export function calculateStreak(completions: CompletionLike[], dailyHabitCount: number): number {
  if (dailyHabitCount === 0) return 0;

  const completionsByDate: Record<string, number> = {};
  for (const c of completions) {
    const key = normalizeDate(c.date).toISOString().split('T')[0] as string;
    completionsByDate[key] = (completionsByDate[key] ?? 0) + 1;
  }

  let streak = 0;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const current = new Date(today);

  while (true) {
    const key = current.toISOString().split('T')[0] as string;
    const count = completionsByDate[key] ?? 0;
    if (count >= dailyHabitCount) {
      streak++;
      current.setUTCDate(current.getUTCDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}
```

---

## Task 8: packages/server — Auth + Habits controllers

**Files:**
- Create: `packages/server/src/controllers/authController.ts`
- Create: `packages/server/src/controllers/habitsController.ts`

- [ ] **Create src/controllers/authController.ts**

```ts
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import User from '../models/User';

const JWT_SECRET = process.env['JWT_SECRET'];
if (!JWT_SECRET) throw new Error('JWT_SECRET environment variable is required');

function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, password } = req.body as { name: string; email: string; password: string };
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(409).json({ error: { message: 'Email already registered', code: 'EMAIL_EXISTS' } });
      return;
    }
    const user = await User.create({ name, email, password });
    const token = generateToken(user._id.toString());
    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ error: { message: 'Invalid email or password', code: 'INVALID_CREDENTIALS' } });
      return;
    }
    const token = generateToken(user._id.toString());
    res.json({ token, user });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: Request, res: Response): Promise<void> {
  res.json({ user: req.user });
}

export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, avatar } = req.body as Partial<{ name: string; avatar: string }>;
    if (!req.user) { res.status(401).json({ error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } }); return; }
    if (name !== undefined) req.user.name = name;
    if (avatar !== undefined) req.user.avatar = avatar;
    await req.user.save();
    res.json({ user: req.user });
  } catch (err) {
    next(err);
  }
}
```

- [ ] **Create src/controllers/habitsController.ts**

```ts
import { Request, Response, NextFunction } from 'express';
import Habit from '../models/Habit';
import type { IHabit } from '../models/Habit';

export async function getHabits(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const filter: Partial<IHabit> & { isActive?: boolean } = { userId: req.user!._id as never };
    if (req.query['active'] !== 'false') filter.isActive = true;
    const habits = await Habit.find(filter).sort({ createdAt: -1 }).populate('categoryId', 'name color');
    res.json(habits);
  } catch (err) { next(err); }
}

export async function createHabit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, icon, color, frequency, target, description, categoryId, trackingType, weeklyTarget } =
      req.body as Partial<IHabit & { categoryId: string }>;
    const habit = await Habit.create({
      userId: req.user!._id,
      name,
      icon: icon ?? 'check_circle',
      color: color ?? 'primary',
      frequency: trackingType === 'duration' ? 'weekly' : frequency,
      target: frequency === 'daily' ? 1 : (target ?? 1),
      description: description ?? '',
      categoryId: categoryId ?? null,
      trackingType: trackingType ?? 'checkmark',
      weeklyTarget: trackingType === 'duration' ? weeklyTarget : null,
    });
    const populated = await habit.populate('categoryId', 'name color');
    res.status(201).json(populated);
  } catch (err) { next(err); }
}

export async function updateHabit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const habit = await Habit.findOne({ _id: req.params['id'], userId: req.user!._id });
    if (!habit) { res.status(404).json({ error: { message: 'Habit not found', code: 'NOT_FOUND' } }); return; }
    const body = req.body as Partial<IHabit & { categoryId: string | null }>;
    if (body.name !== undefined) habit.name = body.name;
    if (body.icon !== undefined) habit.icon = body.icon;
    if (body.color !== undefined) habit.color = body.color;
    if (body.frequency !== undefined) habit.frequency = body.frequency;
    if (body.target !== undefined) habit.target = body.target;
    if (body.description !== undefined) habit.description = body.description;
    if (body.categoryId !== undefined) habit.categoryId = body.categoryId as never;
    if (body.trackingType !== undefined) habit.trackingType = body.trackingType;
    if (body.weeklyTarget !== undefined) habit.weeklyTarget = body.weeklyTarget;
    if (habit.frequency === 'daily') habit.target = 1;
    if (habit.trackingType === 'duration') habit.frequency = 'weekly';
    if (habit.trackingType === 'checkmark') habit.weeklyTarget = null;
    await habit.save();
    const populated = await habit.populate('categoryId', 'name color');
    res.json(populated);
  } catch (err) { next(err); }
}

export async function deleteHabit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const habit = await Habit.findOne({ _id: req.params['id'], userId: req.user!._id });
    if (!habit) { res.status(404).json({ error: { message: 'Habit not found', code: 'NOT_FOUND' } }); return; }
    habit.isActive = false;
    await habit.save();
    res.json(habit);
  } catch (err) { next(err); }
}
```

---

## Task 9: packages/server — Remaining 4 controllers

**Files:**
- Create: `packages/server/src/controllers/completionsController.ts`
- Create: `packages/server/src/controllers/analyticsController.ts`
- Create: `packages/server/src/controllers/notificationsController.ts`
- Create: `packages/server/src/controllers/categoriesController.ts`

- [ ] **Create src/controllers/completionsController.ts**

```ts
import { Request, Response, NextFunction } from 'express';
import Completion from '../models/Completion';
import Habit from '../models/Habit';
import { normalizeDate } from '../utils/dateHelpers';

export async function getCompletions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const filter: Record<string, unknown> = { userId: req.user!._id };
    if (req.query['date']) {
      const d = normalizeDate(req.query['date'] as string);
      const nextDay = new Date(d);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);
      filter['date'] = { $gte: d, $lt: nextDay };
    } else if (req.query['from'] && req.query['to']) {
      filter['date'] = { $gte: normalizeDate(req.query['from'] as string), $lte: normalizeDate(req.query['to'] as string) };
    }
    const completions = await Completion.find(filter).populate('habitId', 'name icon color frequency').sort({ completedAt: -1 });
    res.json(completions);
  } catch (err) { next(err); }
}

export async function createCompletion(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { habitId, date, value, note } = req.body as { habitId: string; date: string; value?: number; note?: string };
    const habit = await Habit.findOne({ _id: habitId, userId: req.user!._id, isActive: true });
    if (!habit) { res.status(404).json({ error: { message: 'Habit not found', code: 'NOT_FOUND' } }); return; }
    const completion = await Completion.create({
      habitId, userId: req.user!._id, date: normalizeDate(date), value: value ?? 1, note: note ?? '',
    });
    res.status(201).json(completion);
  } catch (err) {
    const e = err as { code?: number };
    if (e.code === 11000) { res.status(409).json({ error: { message: 'Already completed for this date', code: 'DUPLICATE' } }); return; }
    next(err);
  }
}

export async function deleteCompletion(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const completion = await Completion.findOne({ _id: req.params['id'], userId: req.user!._id });
    if (!completion) { res.status(404).json({ error: { message: 'Completion not found', code: 'NOT_FOUND' } }); return; }
    await Completion.deleteOne({ _id: req.params['id'] });
    res.status(204).send();
  } catch (err) { next(err); }
}
```

- [ ] **Create src/controllers/analyticsController.ts**

```ts
import { Request, Response, NextFunction } from 'express';
import Completion from '../models/Completion';
import Habit from '../models/Habit';
import { getWeekRange, getMonthRange, normalizeDate } from '../utils/dateHelpers';
import { calculateStreak } from '../utils/streakCalculator';
import type { TrackingType } from '@mindful-flow/shared/constants';

export async function getWeeklyAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!._id;
    const { start, end } = getWeekRange();
    const habits = await Habit.find({ userId, isActive: true });
    const completions = await Completion.find({ userId, date: { $gte: start, $lt: end } });

    let totalTarget = 0;
    for (const h of habits) {
      if (h.frequency === 'daily') {
        const created = normalizeDate(h.createdAt);
        const effectiveStart = created > start ? created : start;
        const daysActive = Math.max(0, Math.ceil((end.getTime() - effectiveStart.getTime()) / 86400000));
        totalTarget += Math.min(daysActive, 7);
      } else {
        totalTarget += h.target;
      }
    }

    const completedCount = completions.length;
    const score = totalTarget > 0 ? Math.round((completedCount / totalTarget) * 100) : 0;
    const dailyHabits = habits.filter((h) => h.frequency === 'daily');
    const streakCutoff = new Date();
    streakCutoff.setUTCDate(streakCutoff.getUTCDate() - 365);
    streakCutoff.setUTCHours(0, 0, 0, 0);
    const allCompletions = await Completion.find({ userId, date: { $gte: streakCutoff } }).sort({ date: -1 });
    const streak = calculateStreak(allCompletions, dailyHabits.length);

    const dayData: Array<{ date: string; count: number }> = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setUTCDate(start.getUTCDate() + i);
      const dayKey = d.toISOString().split('T')[0] as string;
      const dayCompletions = completions.filter((c) => normalizeDate(c.date).toISOString().split('T')[0] === dayKey);
      dayData.push({ date: dayKey, count: dayCompletions.length });
    }

    res.json({ score, completedCount, targetCount: totalTarget, streak, dayData });
  } catch (err) { next(err); }
}

export async function getMonthlyAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!._id;
    const month = parseInt(req.query['month'] as string) || new Date().getMonth() + 1;
    const year = parseInt(req.query['year'] as string) || new Date().getFullYear();
    const { start, end } = getMonthRange(month, year);
    const completions = await Completion.find({ userId, date: { $gte: start, $lt: end } }).populate('habitId', 'name icon color');
    const daysMap: Record<string, unknown[]> = {};
    for (const c of completions) {
      const key = normalizeDate(c.date).toISOString().split('T')[0] as string;
      if (!daysMap[key]) daysMap[key] = [];
      daysMap[key]!.push(c);
    }
    const days = Object.entries(daysMap).map(([date, comps]) => ({ date, completions: comps }));
    res.json({ month, year, days });
  } catch (err) { next(err); }
}

export async function getHabitAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!._id;
    const habit = await Habit.findOne({ _id: req.params['id'], userId });
    if (!habit) { res.status(404).json({ error: { message: 'Habit not found', code: 'NOT_FOUND' } }); return; }
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);
    thirtyDaysAgo.setUTCHours(0, 0, 0, 0);
    const recentCompletions = await Completion.find({ habitId: habit._id, date: { $gte: thirtyDaysAgo } }).sort({ date: -1 });
    const habitCreated = normalizeDate(habit.createdAt);
    const effectiveStart = habitCreated > thirtyDaysAgo ? habitCreated : thirtyDaysAgo;
    const now = new Date();
    now.setUTCHours(0, 0, 0, 0);
    const daysSinceCreation = Math.max(1, Math.ceil((now.getTime() - effectiveStart.getTime()) / 86400000) + 1);
    const expectedDays = habit.frequency === 'daily'
      ? Math.min(daysSinceCreation, 30)
      : Math.round((daysSinceCreation / 7) * habit.target);
    const completionRate = expectedDays > 0 ? Math.round((recentCompletions.length / expectedDays) * 100) : 0;
    let streakDays = 0;
    if (habit.frequency === 'daily') {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const current = new Date(today);
      const dateSet = new Set(recentCompletions.map((c) => normalizeDate(c.date).toISOString().split('T')[0]));
      while (dateSet.has(current.toISOString().split('T')[0] as string)) {
        streakDays++;
        current.setUTCDate(current.getUTCDate() - 1);
      }
    }
    res.json({ completionRate, recentCompletions: recentCompletions.slice(0, 10), streakDays });
  } catch (err) { next(err); }
}

interface DayStatus { completed: boolean; value: number; isFuture?: boolean; }

interface HabitRow {
  habitId: unknown;
  name: string;
  icon: string;
  trackingType: TrackingType;
  category: { name: string; color: string } | null;
  days: Record<string, DayStatus>;
  weeklyTarget?: number | null;
  totalHours?: number;
  rate?: number;
}

export async function weeklyConsistency(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!._id;
    const weekParam = req.query['week'] as string | undefined;
    let weekStart: Date;
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
    const completions = await Completion.find({ userId, date: { $gte: weekStart, $lt: weekEnd } });
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
    const today = normalizeDate(new Date());
    const completionMap = new Map<string, (typeof completions)[number]>();
    for (const c of completions) {
      const key = `${c.habitId.toString()}_${normalizeDate(c.date).toISOString().split('T')[0]}`;
      completionMap.set(key, c);
    }

    const habitRows: HabitRow[] = habits.map((habit) => {
      const days: Record<string, DayStatus> = {};
      let completedDays = 0;
      let totalHours = 0;
      const habitCreated = normalizeDate(habit.createdAt);
      for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setUTCDate(weekStart.getUTCDate() + i);
        const dateStr = d.toISOString().split('T')[0] as string;
        const dayName = dayNames[i] as string;
        if (d > today || d < habitCreated) { days[dayName] = { completed: false, value: 0, isFuture: true }; continue; }
        const completion = completionMap.get(`${habit._id.toString()}_${dateStr}`);
        if (completion) {
          days[dayName] = { completed: true, value: completion.value };
          if (habit.trackingType === 'duration') totalHours += completion.value;
          completedDays++;
        } else {
          days[dayName] = { completed: false, value: 0, isFuture: false };
        }
      }
      const catRef = habit.categoryId as { name?: string; color?: string } | null;
      const row: HabitRow = {
        habitId: habit._id,
        name: habit.name,
        icon: habit.icon,
        trackingType: habit.trackingType,
        category: catRef?.name ? { name: catRef.name, color: catRef.color ?? '' } : null,
        days,
      };
      if (habit.trackingType === 'duration') {
        row.weeklyTarget = habit.weeklyTarget;
        row.totalHours = totalHours;
        row.rate = habit.weeklyTarget && habit.weeklyTarget > 0 ? Math.min(totalHours / habit.weeklyTarget, 1) : 0;
      } else {
        const activeDays = Object.values(days).filter((d) => !d.isFuture).length;
        row.rate = activeDays > 0 ? completedDays / activeDays : 0;
      }
      return row;
    });

    const dailyScores: Record<string, number | null> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setUTCDate(weekStart.getUTCDate() + i);
      const dayName = dayNames[i] as string;
      if (d > today) { dailyScores[dayName] = null; continue; }
      let completed = 0; let activeHabits = 0;
      for (const habit of habitRows) {
        if (!habit.days[dayName]?.isFuture) { activeHabits++; if (habit.days[dayName]?.completed) completed++; }
      }
      dailyScores[dayName] = activeHabits > 0 ? completed / activeHabits : null;
    }

    const activeDailyScores = Object.values(dailyScores).filter((s): s is number => s !== null);
    const overallScore = activeDailyScores.length > 0
      ? activeDailyScores.reduce((a, b) => a + b, 0) / activeDailyScores.length : 0;

    res.json({
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: new Date(weekEnd.getTime() - 86400000).toISOString().split('T')[0],
      habits: habitRows,
      dailyScores,
      overallScore: Math.round(overallScore * 100) / 100,
    });
  } catch (err) { next(err); }
}
```

- [ ] **Create src/controllers/notificationsController.ts**

```ts
import { Request, Response, NextFunction } from 'express';
import Notification from '../models/Notification';

export async function getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const notifications = await Notification.find({ userId: req.user!._id }).sort({ isRead: 1, createdAt: -1 }).limit(50);
    res.json(notifications);
  } catch (err) { next(err); }
}

export async function markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const notification = await Notification.findOne({ _id: req.params['id'], userId: req.user!._id });
    if (!notification) { res.status(404).json({ error: { message: 'Notification not found', code: 'NOT_FOUND' } }); return; }
    notification.isRead = true;
    await notification.save();
    res.json(notification);
  } catch (err) { next(err); }
}

export async function markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await Notification.updateMany({ userId: req.user!._id, isRead: false }, { isRead: true });
    res.status(204).send();
  } catch (err) { next(err); }
}
```

- [ ] **Create src/controllers/categoriesController.ts**

```ts
import { Request, Response, NextFunction } from 'express';
import Category from '../models/Category';
import Habit from '../models/Habit';

export async function getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const categories = await Category.find({ userId: req.user!._id }).sort({ name: 1 });
    res.json(categories);
  } catch (err) { next(err); }
}

export async function createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, color } = req.body as { name: string; color: string };
    const category = await Category.create({ name, color, userId: req.user!._id });
    res.status(201).json(category);
  } catch (err) {
    const e = err as { code?: number };
    if (e.code === 11000) { res.status(409).json({ error: { message: 'Category name already exists', code: 'DUPLICATE' } }); return; }
    next(err);
  }
}

export async function updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const category = await Category.findOne({ _id: req.params['id'], userId: req.user!._id });
    if (!category) { res.status(404).json({ error: { message: 'Category not found', code: 'NOT_FOUND' } }); return; }
    const body = req.body as Partial<{ name: string; color: string }>;
    if (body.name !== undefined) category.name = body.name;
    if (body.color !== undefined) category.color = body.color;
    await category.save();
    res.json(category);
  } catch (err) {
    const e = err as { code?: number };
    if (e.code === 11000) { res.status(409).json({ error: { message: 'Category name already exists', code: 'DUPLICATE' } }); return; }
    next(err);
  }
}

export async function deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const category = await Category.findOne({ _id: req.params['id'], userId: req.user!._id });
    if (!category) { res.status(404).json({ error: { message: 'Category not found', code: 'NOT_FOUND' } }); return; }
    await Habit.updateMany({ categoryId: category._id }, { $set: { categoryId: null } });
    await Category.deleteOne({ _id: category._id });
    res.status(204).send();
  } catch (err) { next(err); }
}
```

---

## Task 10: packages/server — All routes + src/index.ts + start-dev.ts

**Files:**
- Create: `packages/server/src/routes/auth.ts`
- Create: `packages/server/src/routes/habits.ts`
- Create: `packages/server/src/routes/completions.ts`
- Create: `packages/server/src/routes/analytics.ts`
- Create: `packages/server/src/routes/notifications.ts`
- Create: `packages/server/src/routes/categories.ts`
- Create: `packages/server/src/index.ts`
- Create: `packages/server/start-dev.ts`

- [ ] **Create all route files**

`src/routes/auth.ts`:
```ts
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validateAuthInput } from '@mindful-flow/shared/validation';
import validate from '../middleware/validate';
import auth from '../middleware/auth';
import { register, login, getMe, updateProfile } from '../controllers/authController';

const router = Router();
const authLimiter = rateLimit({
  windowMs: 60 * 1000, max: 10,
  message: { error: { message: 'Too many attempts, try again later', code: 'RATE_LIMIT' } },
  skip: () => process.env['NODE_ENV'] === 'test' || process.env['E2E'] === 'true',
});

router.post('/register', authLimiter, validate(validateAuthInput, false), register);
router.post('/login', authLimiter, validate(validateAuthInput, true), login);
router.get('/me', auth, getMe);
router.put('/profile', auth, updateProfile);

export default router;
```

`src/routes/habits.ts`:
```ts
import { Router } from 'express';
import auth from '../middleware/auth';
import validate from '../middleware/validate';
import { validateHabitInput } from '@mindful-flow/shared/validation';
import { getHabits, createHabit, updateHabit, deleteHabit } from '../controllers/habitsController';

const router = Router();
router.use(auth);
router.get('/', getHabits);
router.post('/', validate(validateHabitInput), createHabit);
router.put('/:id', validate(validateHabitInput), updateHabit);
router.delete('/:id', deleteHabit);
export default router;
```

`src/routes/completions.ts`:
```ts
import { Router } from 'express';
import auth from '../middleware/auth';
import validate from '../middleware/validate';
import { validateCompletionInput } from '@mindful-flow/shared/validation';
import { getCompletions, createCompletion, deleteCompletion } from '../controllers/completionsController';

const router = Router();
router.use(auth);
router.get('/', getCompletions);
router.post('/', validate(validateCompletionInput), createCompletion);
router.delete('/:id', deleteCompletion);
export default router;
```

`src/routes/analytics.ts`:
```ts
import { Router } from 'express';
import auth from '../middleware/auth';
import { getWeeklyAnalytics, getMonthlyAnalytics, getHabitAnalytics, weeklyConsistency } from '../controllers/analyticsController';

const router = Router();
router.use(auth);
router.get('/weekly', getWeeklyAnalytics);
router.get('/monthly', getMonthlyAnalytics);
router.get('/habits/:id', getHabitAnalytics);
router.get('/weekly-consistency', weeklyConsistency);
export default router;
```

`src/routes/notifications.ts`:
```ts
import { Router } from 'express';
import auth from '../middleware/auth';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notificationsController';

const router = Router();
router.use(auth);
router.get('/', getNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);
export default router;
```

`src/routes/categories.ts`:
```ts
import { Router } from 'express';
import auth from '../middleware/auth';
import validate from '../middleware/validate';
import { validateCategoryInput } from '@mindful-flow/shared/validation';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categoriesController';

const router = Router();
router.use(auth);
router.get('/', getCategories);
router.post('/', validate(validateCategoryInput), createCategory);
router.put('/:id', validate(validateCategoryInput), updateCategory);
router.delete('/:id', deleteCategory);
export default router;
```

- [ ] **Create src/index.ts**

```ts
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import 'dotenv/config';
import errorHandler from './middleware/errorHandler';
import './types/express';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/auth', (await import('./routes/auth')).default);
app.use('/api/habits', (await import('./routes/habits')).default);
app.use('/api/completions', (await import('./routes/completions')).default);
app.use('/api/analytics', (await import('./routes/analytics')).default);
app.use('/api/notifications', (await import('./routes/notifications')).default);
app.use('/api/categories', (await import('./routes/categories')).default);

app.get('/api/health', (_req, res) => { res.json({ status: 'ok' }); });
app.use(errorHandler);

const PORT = process.env['PORT'] ?? 5000;
const MONGO_URI = process.env['MONGO_URI'] ?? 'mongodb://localhost:27017/mindful-flow';

if (process.env['NODE_ENV'] !== 'test') {
  mongoose.connect(MONGO_URI).then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  }).catch((err: unknown) => { console.error('MongoDB connection error:', err); process.exit(1); });
}

export default app;
```

Note: using top-level `await import()` requires `"module": "NodeNext"` or use synchronous require-style. If top-level await causes issues with `module: "CommonJS"`, change to synchronous imports at the top:

```ts
// Alternative — use sync imports (preferred with CommonJS):
import authRoutes from './routes/auth';
import habitsRoutes from './routes/habits';
import completionsRoutes from './routes/completions';
import analyticsRoutes from './routes/analytics';
import notificationsRoutes from './routes/notifications';
import categoriesRoutes from './routes/categories';
// ...
app.use('/api/auth', authRoutes);
// etc.
```

Use the synchronous version. tsx handles this fine with `module: "CommonJS"`.

- [ ] **Create start-dev.ts**

```ts
import { MongoMemoryServer } from 'mongodb-memory-server';

async function main(): Promise<void> {
  const mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  console.log(`In-memory MongoDB started: ${uri}`);
  process.env['MONGO_URI'] = uri;
  process.env['JWT_SECRET'] = process.env['JWT_SECRET'] ?? 'dev-secret';
  process.env['PORT'] = process.env['PORT'] ?? '5000';
  await import('./src/index');
  const shutdown = async (): Promise<void> => { await mongo.stop(); process.exit(0); };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err: unknown) => { console.error('Failed to start dev server:', err); process.exit(1); });
```

---

## Task 11: packages/server — __tests__/setup.ts + api.test.ts

**Files:**
- Create: `packages/server/__tests__/setup.ts`
- Create: `packages/server/__tests__/api.test.ts`

- [ ] **Create __tests__/setup.ts**

```ts
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

jest.setTimeout(60_000);

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
```

- [ ] **Create __tests__/api.test.ts**

The test logic is identical to the JS version — only types and imports change:

```ts
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/index';
import Notification from '../src/models/Notification';

async function clearDB(): Promise<void> {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key]!.deleteMany({});
  }
}

const testUser = { name: 'Test User', email: 'test@example.com', password: 'password123' };

let token: string;
let userId: string;
let habitId: string;
let completionId: string;
let notificationId: string;

async function registerAndGetToken(user = testUser): Promise<{ token: string; userId: string }> {
  const res = await request(app).post('/api/auth/register').send(user);
  return { token: res.body.token as string, userId: res.body.user._id as string };
}

// ─── Auth ────────────────────────────────────────────────────────────

describe('Auth endpoints', () => {
  beforeAll(async () => { await clearDB(); });

  it('POST /register — should register a new user', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('email', testUser.email);
    token = res.body.token as string;
    userId = res.body.user._id as string;
  });

  it('POST /register — should reject duplicate email', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_EXISTS');
  });

  it('POST /register — should reject missing fields', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'a@b.com' });
    expect(res.status).toBe(400);
  });

  it('POST /login — should login with valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: testUser.email, password: testUser.password });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    token = res.body.token as string;
  });

  it('POST /login — should reject invalid password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: testUser.email, password: 'wrongpassword' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('POST /login — should reject non-existent email', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'nope@example.com', password: 'password123' });
    expect(res.status).toBe(401);
  });

  it('GET /me — should return current user', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user).toHaveProperty('email', testUser.email);
  });

  it('GET /me — should reject without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('GET /me — should reject invalid token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer invalidtoken');
    expect(res.status).toBe(401);
  });

  it('PUT /profile — should update profile', async () => {
    const res = await request(app).put('/api/auth/profile').set('Authorization', `Bearer ${token}`).send({ name: 'Updated Name' });
    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Updated Name');
  });
});

// ─── Habits ──────────────────────────────────────────────────────────

describe('Habits endpoints', () => {
  beforeAll(async () => {
    await clearDB();
    const auth = await registerAndGetToken();
    token = auth.token; userId = auth.userId;
  });

  it('POST /habits — should create a habit', async () => {
    const res = await request(app).post('/api/habits').set('Authorization', `Bearer ${token}`).send({ name: 'Meditate', frequency: 'daily' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('name', 'Meditate');
    habitId = res.body._id as string;
  });

  it('POST /habits — should reject without auth', async () => {
    const res = await request(app).post('/api/habits').send({ name: 'Read', frequency: 'daily' });
    expect(res.status).toBe(401);
  });

  it('POST /habits — should reject invalid data', async () => {
    const res = await request(app).post('/api/habits').set('Authorization', `Bearer ${token}`).send({ name: '' });
    expect(res.status).toBe(400);
  });

  it('GET /habits — should return user habits', async () => {
    const res = await request(app).get('/api/habits').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('PUT /habits/:id — should update a habit', async () => {
    const res = await request(app).put(`/api/habits/${habitId}`).set('Authorization', `Bearer ${token}`).send({ name: 'Morning Meditation' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Morning Meditation');
  });

  it('PUT /habits/:id — should return 404 for non-existent habit', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).put(`/api/habits/${fakeId.toString()}`).set('Authorization', `Bearer ${token}`).send({ name: 'Ghost' });
    expect(res.status).toBe(404);
  });

  it('DELETE /habits/:id — should soft-delete a habit', async () => {
    const res = await request(app).delete(`/api/habits/${habitId}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.isActive).toBe(false);
  });

  it('GET /habits — should not list soft-deleted habits by default', async () => {
    const res = await request(app).get('/api/habits').set('Authorization', `Bearer ${token}`);
    expect(res.body.length).toBe(0);
  });
});

// ─── Completions ─────────────────────────────────────────────────────

describe('Completions endpoints', () => {
  beforeAll(async () => {
    await clearDB();
    const auth = await registerAndGetToken();
    token = auth.token; userId = auth.userId;
    const habitRes = await request(app).post('/api/habits').set('Authorization', `Bearer ${token}`).send({ name: 'Exercise', frequency: 'daily' });
    habitId = habitRes.body._id as string;
  });

  it('POST /completions — should log a completion', async () => {
    const today = new Date().toISOString().split('T')[0] as string;
    const res = await request(app).post('/api/completions').set('Authorization', `Bearer ${token}`).send({ habitId, date: today });
    expect(res.status).toBe(201);
    completionId = res.body._id as string;
  });

  it('POST /completions — should reject duplicate completion', async () => {
    const today = new Date().toISOString().split('T')[0] as string;
    const res = await request(app).post('/api/completions').set('Authorization', `Bearer ${token}`).send({ habitId, date: today });
    expect(res.status).toBe(409);
  });

  it('POST /completions — should reject non-existent habit', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).post('/api/completions').set('Authorization', `Bearer ${token}`).send({ habitId: fakeId.toString(), date: '2025-01-01' });
    expect(res.status).toBe(404);
  });

  it('GET /completions — should return completions', async () => {
    const res = await request(app).get('/api/completions').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /completions — should filter by date', async () => {
    const today = new Date().toISOString().split('T')[0] as string;
    const res = await request(app).get(`/api/completions?date=${today}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('DELETE /completions/:id — should delete a completion', async () => {
    const res = await request(app).delete(`/api/completions/${completionId}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
  });

  it('DELETE /completions/:id — should return 404 for non-existent', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).delete(`/api/completions/${fakeId.toString()}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

// ─── Analytics ───────────────────────────────────────────────────────

describe('Analytics endpoints', () => {
  beforeAll(async () => {
    await clearDB();
    const auth = await registerAndGetToken();
    token = auth.token; userId = auth.userId;
    const habitRes = await request(app).post('/api/habits').set('Authorization', `Bearer ${token}`).send({ name: 'Read', frequency: 'daily' });
    habitId = habitRes.body._id as string;
    const today = new Date().toISOString().split('T')[0] as string;
    await request(app).post('/api/completions').set('Authorization', `Bearer ${token}`).send({ habitId, date: today });
  });

  it('GET /analytics/weekly — should return weekly analytics', async () => {
    const res = await request(app).get('/api/analytics/weekly').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('score');
    expect(res.body).toHaveProperty('dayData');
  });

  it('GET /analytics/weekly — should reject without auth', async () => {
    const res = await request(app).get('/api/analytics/weekly');
    expect(res.status).toBe(401);
  });

  it('GET /analytics/monthly — should return monthly analytics', async () => {
    const now = new Date();
    const res = await request(app).get(`/api/analytics/monthly?month=${now.getMonth() + 1}&year=${now.getFullYear()}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('GET /analytics/habits/:id — should return habit analytics', async () => {
    const res = await request(app).get(`/api/analytics/habits/${habitId}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('completionRate');
  });

  it('GET /analytics/habits/:id — should return 404 for non-existent', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/analytics/habits/${fakeId.toString()}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

// ─── Notifications ───────────────────────────────────────────────────

describe('Notifications endpoints', () => {
  beforeAll(async () => {
    await clearDB();
    const auth = await registerAndGetToken();
    token = auth.token; userId = auth.userId;
    const n = await Notification.create({ userId, type: 'streak', title: 'Great streak!', message: 'You have a 7-day streak!', isRead: false });
    notificationId = n._id.toString();
    await Notification.create({ userId, type: 'tip', title: 'Daily tip', message: 'Stay hydrated!', isRead: false });
  });

  it('GET /notifications — should return notifications', async () => {
    const res = await request(app).get('/api/notifications').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });

  it('PUT /notifications/:id/read — should mark as read', async () => {
    const res = await request(app).put(`/api/notifications/${notificationId}/read`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.isRead).toBe(true);
  });

  it('PUT /notifications/read-all — should mark all as read', async () => {
    const res = await request(app).put('/api/notifications/read-all').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
  });
});

// ─── Health check ────────────────────────────────────────────────────

describe('Health check', () => {
  it('GET /api/health — should return ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
```

---

## Task 12: packages/server — Typecheck + run tests + delete old .js files + commit

**Files:**
- Delete: all `packages/server/src/**/*.js` and `packages/server/__tests__/*.js`
- Delete: `packages/server/start-dev.js`

- [ ] **Run typecheck**

```bash
cd packages/server
NODE_ENV=test npx tsc --noEmit
```

Expected: exits 0, no errors.

- [ ] **Run tests**

```bash
cd packages/server
NODE_ENV=test npx jest --runInBand --forceExit
```

Expected: all tests pass.

- [ ] **Delete old JS files**

```bash
cd packages/server
rm src/index.js src/middleware/auth.js src/middleware/errorHandler.js src/middleware/validate.js
rm src/models/User.js src/models/Habit.js src/models/Completion.js src/models/Notification.js src/models/Category.js
rm src/controllers/authController.js src/controllers/habitsController.js src/controllers/completionsController.js
rm src/controllers/analyticsController.js src/controllers/notificationsController.js src/controllers/categoriesController.js
rm src/routes/auth.js src/routes/habits.js src/routes/completions.js src/routes/analytics.js src/routes/notifications.js src/routes/categories.js
rm src/utils/dateHelpers.js src/utils/streakCalculator.js
rm __tests__/setup.js __tests__/api.test.js
rm start-dev.js
```

- [ ] **Commit**

```bash
git add packages/server/
git commit -m "feat(server): migrate to TypeScript — tsx runtime, ts-jest for tests"
```

---

## Task 13: packages/client — Install deps + tsconfig.json + bulk rename all files

**Files:**
- Create: `packages/client/tsconfig.json`
- Modify: `packages/client/package.json` (add typescript, @types/react-dom, typecheck script)
- Rename: all `.jsx` → `.tsx`, all `.js` → `.ts` in `src/`

- [ ] **Install deps**

```bash
cd packages/client
pnpm add -D typescript @types/react-dom
```

- [ ] **Create tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "noEmit": true
  },
  "include": ["src"]
}
```

- [ ] **Add typecheck script to package.json**

Add to `scripts`:
```json
"typecheck": "tsc --noEmit"
```

- [ ] **Bulk rename all files**

```bash
cd packages/client/src

# Rename .jsx to .tsx
for f in $(find . -name "*.jsx"); do git mv "$f" "${f%.jsx}.tsx"; done

# Rename .js to .ts (excluding config files)
for f in $(find . -name "*.js"); do git mv "$f" "${f%.js}.ts"; done
```

- [ ] **Rename vite.config.js**

```bash
cd packages/client
git mv vite.config.js vite.config.ts
```

---

## Task 14: packages/client — vite.config.ts + services/api.ts + utils/colorMap.ts

**Files:**
- Modify: `packages/client/vite.config.ts`
- Modify: `packages/client/src/services/api.ts`
- Modify: `packages/client/src/utils/colorMap.ts`

- [ ] **Update vite.config.ts**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: process.env['VITE_BASE_PATH'] ?? '/',
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 3000,
    proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: true } },
  },
});
```

- [ ] **Update src/services/api.ts**

```ts
import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env['VITE_API_BASE'] ?? '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const err = error as { response?: { status: number }; config?: { url?: string } };
    if (err.response?.status === 401) {
      const url = err.config?.url ?? '';
      if (!url.includes('/auth/')) {
        localStorage.removeItem('token');
        window.location.href = (import.meta.env['BASE_URL'] as string) + 'login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
```

- [ ] **Update src/utils/colorMap.ts**

```ts
import type { Color } from '@mindful-flow/shared/types';

interface ColorTokens {
  bg: string;
  text: string;
  btnBg: string;
  progress: string;
}

export const colorMap: Record<Color, ColorTokens> = {
  primary: { bg: 'bg-primary/10', text: 'text-primary', btnBg: 'bg-primary', progress: 'bg-primary' },
  secondary: { bg: 'bg-secondary/10', text: 'text-secondary', btnBg: 'bg-secondary', progress: 'bg-secondary' },
  tertiary: { bg: 'bg-tertiary/10', text: 'text-tertiary', btnBg: 'bg-tertiary', progress: 'bg-tertiary' },
};

export const barColors: Record<Color, string> = {
  primary: 'var(--color-primary)',
  secondary: 'var(--color-secondary)',
  tertiary: 'var(--color-tertiary)',
};
```

---

## Task 15: packages/client — context/AuthContext.tsx + ThemeContext.tsx

**Files:**
- Modify: `packages/client/src/context/AuthContext.tsx`
- Modify: `packages/client/src/context/ThemeContext.tsx`

- [ ] **Update src/context/AuthContext.tsx**

```tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import type { User } from '@mindful-flow/shared/types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ token: string; user: User }>;
  register: (name: string, email: string, password: string) => Promise<{ token: string; user: User }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get<{ user: User }>('/auth/me')
        .then((res) => setUser(res.data.user))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data;
  }

  async function register(name: string, email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await api.post<{ token: string; user: User }>('/auth/register', { name, email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data;
  }

  function logout(): void {
    localStorage.removeItem('token');
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

- [ ] **Update src/context/ThemeContext.tsx**

```tsx
import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'auto';

interface ThemeContextValue { theme: Theme; setTheme: (value: Theme) => void; }

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(value: Theme, mq: MediaQueryList): void {
  const html = document.documentElement;
  if (value === 'dark') { html.classList.add('dark'); }
  else if (value === 'light') { html.classList.remove('dark'); }
  else { mq.matches ? html.classList.add('dark') : html.classList.remove('dark'); }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => (localStorage.getItem('theme') as Theme | null) ?? 'auto');
  const mq = useRef(window.matchMedia('(prefers-color-scheme: dark)'));
  const listenerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (listenerRef.current) { mq.current.removeEventListener('change', listenerRef.current); listenerRef.current = null; }
    applyTheme(theme, mq.current);
    if (theme === 'auto') {
      listenerRef.current = () => applyTheme('auto', mq.current);
      mq.current.addEventListener('change', listenerRef.current);
    }
    return () => { if (listenerRef.current) mq.current.removeEventListener('change', listenerRef.current); };
  }, [theme]);

  function setTheme(value: Theme): void { localStorage.setItem('theme', value); setThemeState(value); }

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
```

---

## Task 16: packages/client — All 6 hooks

**Files:**
- Modify: `packages/client/src/hooks/useHabits.ts`
- Modify: `packages/client/src/hooks/useCompletions.ts`
- Modify: `packages/client/src/hooks/useAnalytics.ts`
- Modify: `packages/client/src/hooks/useNotifications.ts`
- Modify: `packages/client/src/hooks/useCategories.ts`
- Modify: `packages/client/src/hooks/useWeeklyConsistency.ts`

- [ ] **Update src/hooks/useHabits.ts**

```ts
import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import api from '../services/api';
import type { Habit, CreateHabitInput } from '@mindful-flow/shared/types';

export function useHabits(): UseQueryResult<Habit[]> {
  return useQuery({ queryKey: ['habits'], queryFn: () => api.get<Habit[]>('/habits').then((r) => r.data) });
}

export function useCreateHabit(): UseMutationResult<Habit, Error, CreateHabitInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateHabitInput) => api.post<Habit>('/habits', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits'] }),
  });
}

export function useUpdateHabit(): UseMutationResult<Habit, Error, { id: string } & Partial<CreateHabitInput>> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put<Habit>(`/habits/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits'] }),
  });
}

export function useDeleteHabit(): UseMutationResult<Habit, Error, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<Habit>(`/habits/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits'] }),
  });
}
```

- [ ] **Update src/hooks/useCompletions.ts**

```ts
import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import api from '../services/api';
import type { Completion, CreateCompletionInput } from '@mindful-flow/shared/types';

export function useCompletionsByDate(date: string): UseQueryResult<Completion[]> {
  return useQuery({
    queryKey: ['completions', date],
    queryFn: () => api.get<Completion[]>('/completions', { params: { date } }).then((r) => r.data),
    enabled: !!date,
  });
}

export function useCompletionsByRange(from: string, to: string): UseQueryResult<Completion[]> {
  return useQuery({
    queryKey: ['completions', from, to],
    queryFn: () => api.get<Completion[]>('/completions', { params: { from, to } }).then((r) => r.data),
    enabled: !!from && !!to,
  });
}

export function useCreateCompletion(): UseMutationResult<Completion, Error, CreateCompletionInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCompletionInput) => api.post<Completion>('/completions', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['completions'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useDeleteCompletion(): UseMutationResult<void, Error, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/completions/${id}`).then(() => undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['completions'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}
```

- [ ] **Update src/hooks/useAnalytics.ts**

```ts
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import api from '../services/api';

export function useWeeklyAnalytics(): UseQueryResult<{ score: number; completedCount: number; targetCount: number; streak: number; dayData: Array<{ date: string; count: number }> }> {
  return useQuery({ queryKey: ['analytics', 'weekly'], queryFn: () => api.get('/analytics/weekly').then((r) => r.data) });
}

export function useMonthlyAnalytics(month: number, year: number): UseQueryResult<{ month: number; year: number; days: unknown[] }> {
  return useQuery({
    queryKey: ['analytics', 'monthly', month, year],
    queryFn: () => api.get('/analytics/monthly', { params: { month, year } }).then((r) => r.data),
    enabled: !!month && !!year,
  });
}

export function useHabitAnalytics(habitId: string | null): UseQueryResult<{ completionRate: number; recentCompletions: unknown[]; streakDays: number }> {
  return useQuery({
    queryKey: ['analytics', 'habit', habitId],
    queryFn: () => api.get(`/analytics/habits/${habitId}`).then((r) => r.data),
    enabled: !!habitId,
  });
}
```

- [ ] **Update src/hooks/useNotifications.ts**

```ts
import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import api from '../services/api';
import type { Notification } from '@mindful-flow/shared/types';

export function useNotifications(): UseQueryResult<Notification[]> {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get<Notification[]>('/notifications').then((r) => r.data),
    refetchInterval: 60000,
  });
}

export function useMarkAsRead(): UseMutationResult<void, Error, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.put(`/notifications/${id}/read`).then(() => undefined),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarkAllAsRead(): UseMutationResult<void, Error, void> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.put('/notifications/read-all').then(() => undefined),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}
```

- [ ] **Update src/hooks/useCategories.ts**

```ts
import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import api from '../services/api';
import type { Category, CreateCategoryInput } from '@mindful-flow/shared/types';

export function useCategories(): UseQueryResult<Category[]> {
  return useQuery({ queryKey: ['categories'], queryFn: () => api.get<Category[]>('/categories').then((r) => r.data) });
}

export function useCreateCategory(): UseMutationResult<Category, Error, CreateCategoryInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoryInput) => api.post<Category>('/categories', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}

export function useUpdateCategory(): UseMutationResult<Category, Error, { id: string } & Partial<CreateCategoryInput>> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put<Category>(`/categories/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}

export function useDeleteCategory(): UseMutationResult<void, Error, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`).then(() => undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ queryKey: ['habits'] });
    },
  });
}
```

- [ ] **Update src/hooks/useWeeklyConsistency.ts**

```ts
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import api from '../services/api';

export function useWeeklyConsistency(weekStart: string | null): UseQueryResult<unknown> {
  return useQuery({
    queryKey: ['weekly-consistency', weekStart],
    queryFn: () => api.get('/analytics/weekly-consistency', { params: { week: weekStart } }).then((r) => r.data),
    enabled: !!weekStart,
  });
}
```

---

## Task 17: packages/client — src/main.tsx + App.tsx + key page changes

**Files:**
- Modify: `packages/client/src/main.tsx`
- Modify: `packages/client/src/App.tsx`
- Modify: `packages/client/src/pages/Dashboard.tsx`
- Modify: `packages/client/src/pages/Habits.tsx`

- [ ] **Update src/main.tsx**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './main.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <BrowserRouter basename={(import.meta.env['BASE_URL'] as string).replace(/\/+$/, '')}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
```

- [ ] **Update src/App.tsx**

```tsx
import { lazy, Suspense, ReactNode } from 'react';
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
import WeeklySkeleton from './components/skeletons/WeeklySkeleton';
import SettingsSkeleton from './components/skeletons/SettingsSkeleton';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Weekly = lazy(() => import('./pages/Weekly'));
const Habits = lazy(() => import('./pages/Habits'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Settings = lazy(() => import('./pages/Settings'));

function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface">
      <TopNavBar />
      <main className="max-w-7xl mx-auto px-6 pt-8 pb-32 md:pb-12">{children}</main>
      <BottomNavBar />
    </div>
  );
}

function LazyPage({ skeleton, children }: { skeleton: ReactNode; children: ReactNode }) {
  return <Suspense fallback={skeleton}><PageTransition>{children}</PageTransition></Suspense>;
}

export default function App() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<LazyPage skeleton={<AuthSkeleton />}><Login /></LazyPage>} />
        <Route path="/register" element={<LazyPage skeleton={<AuthSkeleton />}><Register /></LazyPage>} />
        <Route path="/" element={<ProtectedRoute><AppLayout><LazyPage skeleton={<DashboardSkeleton />}><Dashboard /></LazyPage></AppLayout></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute><AppLayout><LazyPage skeleton={<CalendarSkeleton />}><Calendar /></LazyPage></AppLayout></ProtectedRoute>} />
        <Route path="/weekly" element={<ProtectedRoute><AppLayout><LazyPage skeleton={<WeeklySkeleton />}><Weekly /></LazyPage></AppLayout></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><AppLayout><LazyPage skeleton={<AnalyticsSkeleton />}><Analytics /></LazyPage></AppLayout></ProtectedRoute>} />
        <Route path="/habits" element={<ProtectedRoute><AppLayout><LazyPage skeleton={<HabitsSkeleton />}><Habits /></LazyPage></AppLayout></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><AppLayout><LazyPage skeleton={<SettingsSkeleton />}><Settings /></LazyPage></AppLayout></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}
```

- [ ] **Key Dashboard.tsx type changes**

Add these type annotations to the existing renamed file:

```tsx
// Change:
const [durationHabit, setDurationHabit] = useState(null);
// To:
const [durationHabit, setDurationHabit] = useState<Habit | null>(null);

// Change (completedIds usage — habitId is always populated):
const completedIds = new Set(completions.map((c) => c.habitId?._id || c.habitId));
// To:
const completedIds = new Set(completions.map((c) => c.habitId._id));

// Change handleToggle signature:
function handleToggle(habit) {
// To:
function handleToggle(habit: Habit): void {

// Change — find by populated habitId:
const existing = completions.find((c) => (c.habitId?._id || c.habitId) === habit._id);
// To (both occurrences):
const existing = completions.find((c) => c.habitId._id === habit._id);

// Change handleDurationSubmit:
function handleDurationSubmit(hours) {
// To:
function handleDurationSubmit(hours: number): void {
```

Also add at top of file:
```tsx
import type { Habit } from '@mindful-flow/shared/types';
```

- [ ] **Key Habits.tsx type changes**

```tsx
// Add import:
import type { Habit, Category } from '@mindful-flow/shared/types';

// Change state declarations:
const [editing, setEditing] = useState<Habit | null>(null);
const [editingCat, setEditingCat] = useState<Category | null>(null);
const [confirmDelete, setConfirmDelete] = useState<{ type: 'habit' | 'category'; id: string; label: string } | null>(null);

// Change function signatures:
function handleSave(data: Omit<Habit, '_id' | 'userId' | 'isActive' | 'createdAt' | 'updatedAt'>): void {
function handleEdit(habit: Habit): void {
function handleDelete(habit: Habit): void {
function handleSaveCategory(data: Pick<Category, 'name' | 'color'>): void {
function handleDeleteCategory(cat: Category): void {
function confirmAction(): void {

// Fix categoryId comparison (populated habit):
habits.filter((h) => (h.categoryId?._id || h.categoryId) === cat._id)
// To:
habits.filter((h) => h.categoryId?._id === cat._id)
```

- [ ] **Pattern for remaining pages and components**

All other pages (Login, Register, Settings, Analytics, Calendar, Weekly) and components follow the same pattern:

1. Add explicit types to `useState` calls where TypeScript can't infer: `useState<string>('')`, `useState<number | null>(null)`, etc.
2. Add types to event handlers: `(e: React.ChangeEvent<HTMLInputElement>)`, `(e: React.FormEvent<HTMLFormElement>)`
3. Add prop interfaces above each component function: `interface MyComponentProps { propName: type; }`
4. Hook return types are automatically inferred from the typed hooks in Task 16

Run `tsc --noEmit` after the bulk rename to see the exact list of errors — each error points to a specific location and the fix is always one of the patterns above.

---

## Task 18: packages/client — Typecheck + build + commit

- [ ] **Run typecheck**

```bash
cd packages/client
npx tsc --noEmit
```

Expected: exits 0, no errors. Fix any remaining errors following the patterns in Task 17.

- [ ] **Run build**

```bash
cd packages/client
pnpm build
```

Expected: `dist/` generated successfully, no build errors.

- [ ] **Commit**

```bash
git add packages/client/
git commit -m "feat(client): migrate to TypeScript — tsx/tsx files, typed hooks, contexts, and services"
```

---

## Task 19: packages/e2e — tsconfig + install tsx + rename + playwright.config.ts + start-server.ts + run tests + commit

**Files:**
- Create: `packages/e2e/tsconfig.json`
- Modify: `packages/e2e/package.json`
- Rename: `playwright.config.js` → `playwright.config.ts`, `start-server.js` → `start-server.ts`, `tests/helpers.js` → `tests/helpers.ts`, all `tests/*.spec.js` → `tests/*.spec.ts`
- Modify: `packages/e2e/playwright.config.ts`
- Modify: `packages/e2e/start-server.ts`
- Modify: `packages/e2e/tests/helpers.ts`

- [ ] **Install tsx + typescript**

```bash
cd packages/e2e
pnpm add -D tsx typescript
```

- [ ] **Create tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "node"
  },
  "include": ["**/*.ts"]
}
```

- [ ] **Rename all e2e files**

```bash
cd packages/e2e
git mv playwright.config.js playwright.config.ts
git mv start-server.js start-server.ts
git mv tests/helpers.js tests/helpers.ts
for f in tests/*.spec.js; do git mv "$f" "${f%.spec.js}.spec.ts"; done
```

- [ ] **Update playwright.config.ts**

```ts
import { defineConfig } from '@playwright/test';
import path from 'path';

const clientDir = path.resolve(__dirname, '../client');

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: { baseURL: 'http://localhost:3000', trace: 'on-first-retry', screenshot: 'only-on-failure' },
  webServer: [
    {
      command: `npx tsx "${path.resolve(__dirname, 'start-server.ts')}"`,
      port: 5000,
      reuseExistingServer: !process.env['CI'],
      timeout: 30000,
    },
    {
      command: 'npx vite --port 3000',
      port: 3000,
      reuseExistingServer: true,
      cwd: clientDir,
      timeout: 30000,
    },
  ],
});
```

- [ ] **Update start-server.ts**

```ts
import { MongoMemoryServer } from 'mongodb-memory-server';

async function main(): Promise<void> {
  const mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  console.log(`E2E MongoMemoryServer started: ${uri}`);
  process.env['MONGO_URI'] = uri;
  process.env['JWT_SECRET'] = 'e2e-test-secret';
  process.env['PORT'] = process.env['PORT'] ?? '5000';
  process.env['E2E'] = 'true';
  process.env['NODE_ENV'] = 'e2e';
  await import('../server/src/index');
  const shutdown = async (): Promise<void> => { await mongo.stop(); process.exit(0); };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err: unknown) => { console.error('Failed to start E2E server:', err); process.exit(1); });
```

- [ ] **Update tests/helpers.ts**

```ts
import { expect, Page } from '@playwright/test';

const unique = (): string => `user_${Date.now()}@test.com`;

export async function registerAndLogin(page: Page): Promise<string> {
  const email = unique();
  await page.goto('/register');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/register');
  await page.getByPlaceholder('Your name').fill('E2E Tester');
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder('••••••').fill('testpass123');
  await page.getByRole('button', { name: 'Create Account' }).click();
  await expect(page).toHaveURL('/', { timeout: 10000 });
  return email;
}

export { unique };
```

- [ ] **Update spec files — change require to import**

In each `tests/*.spec.ts` file, change:
```ts
// From:
const { test, expect } = require('@playwright/test');
const { registerAndLogin } = require('./helpers');
// To:
import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers';
```

- [ ] **Run e2e tests**

```bash
cd packages/e2e
npx playwright test
```

Expected: all 17 tests pass.

- [ ] **Delete old JS files**

```bash
cd packages/e2e
rm -f playwright.config.js start-server.js tests/helpers.js
```

- [ ] **Commit**

```bash
git add packages/e2e/
git commit -m "feat(e2e): migrate Playwright tests to TypeScript"
```

---

## Task 20: Root — Update turbo.json + add typecheck to root + final verification + commit

**Files:**
- Modify: `turbo.json`
- Modify: `package.json` (root)

- [ ] **Update turbo.json — add typecheck task**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "dev": { "cache": false, "persistent": true },
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "typecheck": { "dependsOn": ["^build"] },
    "test": { "dependsOn": ["^build"] },
    "lint": {}
  }
}
```

- [ ] **Add typecheck script to root package.json**

Add to `scripts`:
```json
"typecheck": "turbo run typecheck"
```

- [ ] **Run full typecheck from root**

```bash
cd /  # monorepo root
pnpm run typecheck
```

Expected: all packages exit 0.

- [ ] **Run all tests from root**

```bash
pnpm test:api
```

Expected: all server tests pass.

- [ ] **Update MEMORY.md**

After verifying everything passes, update `~/.claude/projects/G--personal-tracking-app/memory/MEMORY.md`:

Change in the Stack section:
- Client: `src/**/*.tsx` and `src/**/*.ts` (not `.jsx`/`.js`)
- Shared: now has a `build` step — run `pnpm --filter @mindful-flow/shared build` before other packages

Change in Testing section:
- Jest uses `ts-jest` preset; test files are `.test.ts`
- Server runs via `tsx src/index.ts`

Change in Dual CJS/ESM section:
- Shared package now has `src/constants.ts`, `src/validation.ts`, `src/types.ts` — tsup generates the dist/ output
- Do NOT edit the `.js`/`.mjs` files in `dist/` — edit the `.ts` source files in `src/`

- [ ] **Final commit**

```bash
git add turbo.json package.json
git commit -m "chore: add typecheck task to Turbo pipeline + update root scripts"
```

---

## Validation Gates Summary

| Package | Gate |
|---------|------|
| `shared` | `pnpm --filter @mindful-flow/shared build` → `dist/*.js`, `*.mjs`, `*.d.ts` present |
| `server` | `tsc --noEmit` exits 0 + all Jest tests pass |
| `client` | `tsc --noEmit` exits 0 + `vite build` succeeds |
| `e2e` | All 17 Playwright tests pass |
| Root | `pnpm run typecheck` exits 0 across all packages |
