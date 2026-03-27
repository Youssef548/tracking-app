# TypeScript Migration Design

**Date:** 2026-03-28
**Project:** The Mindful Flow (monorepo)
**Scope:** Full JavaScript → TypeScript migration across all 4 packages

---

## Overview

Migrate the entire monorepo from JavaScript to TypeScript using a strict, no-`any` policy. The migration proceeds incrementally — one package at a time — keeping the app runnable at every step. Each package must pass its validation gate before the next package begins.

**Order:** `shared` → `server` → `client` → `e2e`

---

## Constraints

- **No `any` type, ever.** Enforced via ESLint rule `@typescript-eslint/no-explicit-any: "error"`.
- **No `allowJs`.** Each package is fully TypeScript when done; no mixing.
- **App stays runnable** throughout the migration.
- **No new features** introduced during migration — pure type-level changes only.

---

## TypeScript Strictness

All packages extend a shared base config with maximum strictness:

```json
// tsconfig.base.json (monorepo root)
{
  "compilerOptions": {
    "target": "ES2022",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": false
  }
}
```

`strict: true` enables: `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`, `noImplicitThis`, `alwaysStrict`.

Additional flags beyond `strict`:
- `noUncheckedIndexedAccess` — array/object index access returns `T | undefined`, not `T`
- `exactOptionalPropertyTypes` — `{ a?: string }` does not accept `{ a: undefined }`
- `noImplicitOverride` — `override` keyword required on overriding methods

---

## Architecture

### Root

- `tsconfig.base.json` — base config extended by all packages
- ESLint root config adds `@typescript-eslint/no-explicit-any: "error"` (or per-package)

### Per-Package tsconfigs

**`packages/shared/tsconfig.json`**
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
Used for type-checking only. tsup handles actual compilation.

**`packages/server/tsconfig.json`**
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
No `outDir` — tsx runs TypeScript directly, `tsc` is used only with `--noEmit` for type-checking.

**`packages/client/tsconfig.json`**
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  },
  "include": ["src"]
}
```

**`packages/e2e/tsconfig.json`**
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler"
  },
  "include": ["**/*.ts"]
}
```

---

## Package 1: `packages/shared`

### Goal
Single TypeScript source compiled to both CJS and ESM via tsup. No more hand-syncing `.js` and `.mjs` files.

### Changes
- Create `src/constants.ts` and `src/validation.ts` (from existing `.js` files)
- Delete `constants.js`, `constants.mjs`, `validation.js`, `validation.mjs` — replaced by tsup output
- Add `src/types.ts` for shared domain interfaces
- Add `tsup.config.ts` for build configuration
- Add `tsup` as devDependency
- Update `package.json` scripts: `"build": "tsup"`
- Update `package.json` exports to point to tsup output

### tsup Config
```ts
// tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/constants.ts', 'src/validation.ts', 'src/types.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  outDir: 'dist',
});
```

### Package exports (updated)
```json
{
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
  }
}
```

### Constants typing
```ts
export const FREQUENCIES = { DAILY: 'daily', WEEKLY: 'weekly' } as const;
export type Frequency = typeof FREQUENCIES[keyof typeof FREQUENCIES];

export const TRACKING_TYPES = { CHECKMARK: 'checkmark', DURATION: 'duration' } as const;
export type TrackingType = typeof TRACKING_TYPES[keyof typeof TRACKING_TYPES];

export const NOTIFICATION_TYPES = { STREAK: 'streak', REMINDER: 'reminder', ACHIEVEMENT: 'achievement', TIP: 'tip' } as const;
export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];
```

### Validation typing
```ts
interface ValidationResult<E extends Record<string, string> = Record<string, string>> {
  isValid: boolean;
  errors: Partial<E>;
}

interface AuthErrors { email: string; password: string; name: string; }
export function validateAuthInput(data: unknown, isLogin: boolean): ValidationResult<AuthErrors>;
```

### Shared domain types (`src/types.ts`)
```ts
export interface User {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Habit {
  _id: string;
  name: string;
  frequency: Frequency;
  color: string;
  icon: string;
  trackingType: TrackingType;
  targetValue?: number;
  isActive: boolean;
  createdAt: string;
}

export interface Completion {
  _id: string;
  habitId: string;
  date: string;
  value: number;
  createdAt: string;
}

export interface Notification {
  _id: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface Category {
  _id: string;
  name: string;
  color: string;
}
```

### Validation gate
- `pnpm --filter @mindful-flow/shared build` succeeds
- `dist/` contains `.js`, `.mjs`, and `.d.ts` for each entry

---

## Package 2: `packages/server`

### Goal
All source files converted to `.ts`. Runs via `tsx` — no compilation to `dist/` needed.

### New devDependencies
- `tsx`, `ts-jest`, `typescript`
- `@types/express`, `@types/bcryptjs`, `@types/jsonwebtoken`, `@types/cors`, `@types/node`

### Script changes
```json
{
  "scripts": {
    "dev": "nodemon --exec tsx src/index.ts",
    "start": "tsx src/index.ts",
    "typecheck": "tsc --noEmit",
    "test": "jest --runInBand --forceExit"
  }
}
```

### File renames
All files in `src/` and `__tests__/` renamed from `.js` to `.ts`. No content changes beyond adding types.

### Express augmentation
```ts
// src/types/express.d.ts
import { UserDocument } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: UserDocument;
    }
  }
}
```

### Mongoose model typing
```ts
// src/models/User.ts
import mongoose, { Document, Model } from 'mongoose';

export interface IUser {
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  comparePassword(candidate: string): Promise<boolean>;
}

export type UserDocument = Document & IUser & IUserMethods;
type UserModel = Model<IUser, Record<string, never>, IUserMethods>;

const UserSchema = new mongoose.Schema<IUser, UserModel, IUserMethods>({ ... });
export default mongoose.model<IUser, UserModel>('User', UserSchema);
```

Same pattern applies to `Habit.ts`, `Completion.ts`, `Notification.ts`, `Category.ts`.

### Controller typing
```ts
import { RequestHandler } from 'express';

export const getHabits: RequestHandler = async (req, res, next) => {
  try {
    const habits = await HabitModel.find({ user: req.user!._id, isActive: true });
    res.json(habits);
  } catch (err) {
    next(err);
  }
};
```

### Jest config update
```js
// jest.config.js → jest.config.ts
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  transform: { '^.+\\.ts$': 'ts-jest' },
};
```

### Validation gate
- `tsc --noEmit` exits 0
- `NODE_ENV=test npx jest --runInBand --forceExit` passes all tests

---

## Package 3: `packages/client`

### Goal
All `.jsx` → `.tsx`, all `.js` → `.ts`. Vite handles compilation natively.

### New devDependencies
- `typescript`, `@types/react-dom`
- (`@types/react` already installed)

### Script changes
```json
{
  "scripts": {
    "typecheck": "tsc --noEmit"
  }
}
```

### File renames
- `src/**/*.jsx` → `src/**/*.tsx`
- `src/**/*.js` → `src/**/*.ts`
- `vite.config.js` → `vite.config.ts`

### Context typing
```ts
// src/context/AuthContext.tsx
interface AuthContextValue {
  user: User | null;
  login: (data: LoginInput) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

### Custom hook typing
```ts
// src/hooks/useHabits.ts
import { UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { Habit, CreateHabitInput } from '@mindful-flow/shared/types';

export function useHabits(): UseQueryResult<Habit[]> {
  return useQuery({ queryKey: ['habits'], queryFn: () => api.get<Habit[]>('/habits').then(r => r.data) });
}

export function useCreateHabit(): UseMutationResult<Habit, Error, CreateHabitInput> { ... }
```

### Component typing
```ts
// Props interface above each component
interface HabitCardProps {
  habit: Habit;
  onComplete: (id: string) => void;
}

const HabitCard = memo(function HabitCard({ habit, onComplete }: HabitCardProps) {
  ...
});
```

### API service typing
```ts
// src/services/api.ts
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

// Typed usage at call sites:
const habits = await api.get<Habit[]>('/habits');
const habit = await api.post<Habit>('/habits', data);
```

### Validation gate
- `vite build` succeeds
- `tsc --noEmit` exits 0

---

## Package 4: `packages/e2e`

### Goal
Convert Playwright test files to TypeScript. Playwright has native TypeScript support.

### Changes
- All `.js` → `.ts` (spec files + helpers)
- `playwright.config.js` → `playwright.config.ts`
- Type helper functions explicitly

### Validation gate
- All 17 Playwright tests pass (`npx playwright test`)

---

## Turbo Pipeline Updates

```json
// turbo.json
{
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "typecheck": { "dependsOn": ["^build"] },
    "test": { "dependsOn": ["^build"] }
  }
}
```

`typecheck` is a new task that runs `tsc --noEmit` per package. CI runs both `build` and `typecheck`.

---

## Validation Gates Summary

| Step | Package | Gate |
|------|---------|------|
| 1 | `shared` | `tsup build` succeeds, `dist/` has `.js` + `.mjs` + `.d.ts` |
| 2 | `server` | `tsc --noEmit` clean + all Jest tests pass |
| 3 | `client` | `vite build` succeeds + `tsc --noEmit` clean |
| 4 | `e2e` | All 17 Playwright tests pass |

---

## What Does Not Change

- Runtime behavior — no logic changes, only types added
- API contracts — request/response shapes are unchanged
- Test assertions — tests verify the same behavior
- File structure within each package — only extensions change
- Deployment pipeline — no Docker or CI changes needed (tsx runs `.ts` directly on server)

---

## MEMORY.md Updates Required

After migration, update MEMORY.md:
- File extensions: `.ts` / `.tsx` instead of `.js` / `.jsx`
- Shared package now has a `build` step (tsup); `dist/` is the output
- Server runs via `tsx src/index.ts` not `node src/index.js`
- Jest uses `ts-jest` preset
