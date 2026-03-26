# The Mindful Flow - Design Specification

## Overview

A habit tracking web application called "The Mindful Flow" built with the MERN stack (MongoDB, Express, React, Node.js) in a Turborepo monorepo. Multi-user with JWT authentication, Docker Compose deployment.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vite + React (JavaScript) |
| Styling | Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| State | React Context (auth) + TanStack Query (server state) |
| Backend | Express.js + Mongoose |
| Database | MongoDB 7 |
| Auth | JWT (bcrypt for passwords) |
| Monorepo | Turborepo + pnpm workspaces |
| Deployment | Docker Compose (nginx + Express + MongoDB) |
| Testing | Jest + Supertest (backend), Vitest + RTL (frontend) |

## Monorepo Structure

```
tracking-app/
├── turbo.json
├── package.json                 # root workspace config (pnpm)
├── docker-compose.yml
├── .env.example
├── packages/
│   ├── client/                  # Vite + React SPA
│   │   ├── src/
│   │   │   ├── components/      # HabitCard, ProgressRing, NavBar, CalendarGrid, etc.
│   │   │   ├── pages/           # Dashboard, Calendar, Analytics, Habits, Login, Register
│   │   │   ├── hooks/           # useAuth, useHabits, useCompletions, useNotifications
│   │   │   ├── services/        # API client (axios instance with interceptors)
│   │   │   ├── context/         # AuthContext, ThemeContext
│   │   │   └── lib/             # utils, constants, tailwind theme tokens
│   │   ├── tailwind.config.js
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── server/                  # Express REST API
│   │   ├── src/
│   │   │   ├── routes/          # auth, habits, completions, analytics, notifications
│   │   │   ├── models/          # User, Habit, Completion, Notification
│   │   │   ├── middleware/      # auth, errorHandler, validate
│   │   │   ├── controllers/     # route handler functions
│   │   │   └── utils/           # date helpers, streak calculator
│   │   ├── Dockerfile
│   │   └── package.json
│   └── shared/                  # Shared between client and server
│       ├── constants.js         # frequency enums, icon mappings, color mappings
│       ├── validation.js        # shared validation rules
│       └── package.json
```

## Data Model

### User
| Field | Type | Notes |
|-------|------|-------|
| _id | ObjectId | auto |
| name | String | required |
| email | String | unique, required |
| password | String | bcrypt hashed |
| avatar | String | URL or default placeholder |
| createdAt | Date | auto |

### Habit
| Field | Type | Notes |
|-------|------|-------|
| _id | ObjectId | auto |
| userId | ObjectId | ref: User |
| name | String | required, e.g., "Morning Meditation" |
| icon | String | Material icon name, e.g., "self_improvement" |
| color | String | Theme token: "secondary", "primary", "tertiary" |
| frequency | String | "daily" or "weekly" |
| target | Number | Weekly: times per week (1-7). Daily: always 1 |
| description | String | optional, e.g., "10 minutes session" |
| isActive | Boolean | default true, false = soft deleted |
| createdAt | Date | auto |

### Completion
| Field | Type | Notes |
|-------|------|-------|
| _id | ObjectId | auto |
| habitId | ObjectId | ref: Habit |
| userId | ObjectId | ref: User |
| date | Date | normalized to YYYY-MM-DD (date only, no time) |
| value | Number | 1 for simple check, or quantity (e.g., liters) |
| note | String | optional |
| completedAt | Date | actual timestamp of logging |

Compound index on `(userId, date)` for efficient calendar queries.
Compound index on `(habitId, date)` with unique constraint to prevent duplicate completions.

### Notification
| Field | Type | Notes |
|-------|------|-------|
| _id | ObjectId | auto |
| userId | ObjectId | ref: User |
| type | String | "streak", "reminder", "achievement", "tip" |
| title | String | e.g., "Streak Alert!" |
| message | String | e.g., "You've hit 12 days of meditation" |
| isRead | Boolean | default false |
| createdAt | Date | auto |

## API Endpoints

All endpoints except auth return 401 if no valid JWT. JWT sent via `Authorization: Bearer <token>`.

### Auth (`/api/auth`)
| Method | Path | Body/Params | Response |
|--------|------|-------------|----------|
| POST | `/register` | { name, email, password } | { token, user } |
| POST | `/login` | { email, password } | { token, user } |
| GET | `/me` | - | { user } |
| PUT | `/profile` | { name?, avatar? } | { user } |

### Habits (`/api/habits`)
| Method | Path | Body/Params | Response |
|--------|------|-------------|----------|
| GET | `/` | ?active=true (default) | [habits] |
| POST | `/` | { name, icon, color, frequency, target, description? } | { habit } |
| PUT | `/:id` | { name?, icon?, color?, frequency?, target?, description? } | { habit } |
| DELETE | `/:id` | - | sets isActive: false |

### Completions (`/api/completions`)
| Method | Path | Body/Params | Response |
|--------|------|-------------|----------|
| POST | `/` | { habitId, date, value?, note? } | { completion } |
| DELETE | `/:id` | - | 204 |
| GET | `/` | ?date=YYYY-MM-DD | [completions] for that day |
| GET | `/` | ?from=...&to=... | [completions] for date range |

### Analytics (`/api/analytics`)
| Method | Path | Params | Response |
|--------|------|--------|----------|
| GET | `/weekly` | - | { score, completedCount, targetCount, streak, dayData[] } |
| GET | `/monthly` | ?month=10&year=2023 | { days: [{ date, completions[] }] } |
| GET | `/habits/:id` | - | { completionRate, recentCompletions[], streakDays } |

### Notifications (`/api/notifications`)
| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/` | - | [notifications] (unread first, limited to 50) |
| PUT | `/:id/read` | - | { notification } |
| PUT | `/read-all` | - | 204 |

## Frontend Pages & Components

### Pages
| Route | Page | Key Features |
|-------|------|-------------|
| `/login` | Login | Email/password form, link to register |
| `/register` | Register | Name/email/password form, link to login |
| `/` | Dashboard | Greeting, daily habits list with check buttons, weekly flow ring, streak/mindfulness stats, wellness card |
| `/calendar` | Calendar | Month grid with completion dots, day detail side panel, habit filter dropdown, month/week toggle |
| `/analytics` | Analytics | Weekly score card, consistency trend (Recharts line), completed vs target (bar), habit breakdown cards, zen tip |
| `/habits` | Habits | Habit card grid, create/edit modal (name, frequency, target slider), delete confirmation |

### Shared Components
| Component | Description |
|-----------|-------------|
| `TopNavBar` | Desktop: logo, nav links (Home/Calendar/Analytics/Habits), notification bell, settings, avatar |
| `BottomNavBar` | Mobile: 5-tab bar (Home, Calendar, Add, Analytics, Habits) with active indicator dot |
| `HabitCard` | Icon, name, progress bar, check/uncheck button. Used in Dashboard and Habits pages |
| `ProgressRing` | SVG circular progress (the "Zen Pulse" weekly flow ring) |
| `CalendarGrid` | 7-column CSS grid, colored dots per day for completed/missed habits |
| `DayDetailPanel` | Side panel showing completed/missed habits for a selected day |
| `HabitModal` | shadcn Dialog: name input, daily/weekly toggle, target slider, save/cancel |
| `StatCard` | Small metric card (streak count, mindfulness score) |
| `ChartBlock` | Recharts wrapper for line chart (consistency) and bar chart (completed vs target) |
| `NotificationDropdown` | Bell icon badge + shadcn DropdownMenu listing recent notifications |
| `FAB` | Floating action button (bottom-right) for quick habit add |

### State Management
- **AuthContext**: current user, JWT token, login/logout/register functions
- **TanStack Query**: all server data (habits, completions, analytics, notifications). Provides caching, background refetching, loading/error states
- No global state library (Redux) needed

## Design System

### Colors (Material Design 3 tokens from mockups)
| Token | Value | Usage |
|-------|-------|-------|
| primary | #005bc4 | Primary actions, active nav, links |
| primary-container | #4388fd | Gradients, chart fills |
| secondary | #006d4a | Completed states, success |
| secondary-container | #6ffbbe | Zen pulse glow, badges |
| tertiary | #bd0c3b | Missed states, warnings |
| tertiary-fixed-dim | #ea3858 | Missed dots on calendar |
| surface | #f7f9fb | Page background |
| surface-container-lowest | #ffffff | Card backgrounds |
| surface-container | #eaeff2 | Progress bar tracks |
| on-surface | #2c3437 | Primary text |
| on-surface-variant | #596064 | Secondary text |
| outline-variant | #acb3b7 | Borders, dividers |
| error | #a83836 | Error states |

### Typography
- **Headlines**: Plus Jakarta Sans (extrabold, bold, semibold)
- **Body/Labels**: Manrope (regular, medium, semibold, bold)

### Icons
- Google Material Symbols Outlined (variable weight/fill)

### Border Radius
- Cards: 1.5rem-2.5rem (rounded-3xl style from mockups)
- Buttons: 0.75rem (rounded-xl)
- Inputs: 1rem (rounded-2xl)
- Pills/badges: 9999px (full)

## Auth Flow

1. Register: POST `/api/auth/register` with name, email, password -> returns JWT + user
2. Login: POST `/api/auth/login` with email, password -> returns JWT + user
3. JWT stored in localStorage
4. Axios interceptor attaches `Authorization: Bearer <token>` to all requests
5. On app load, GET `/api/auth/me` validates stored token. If invalid -> redirect to `/login`
6. Axios interceptor catches 401 responses -> clears token, redirects to `/login`
7. Protected route wrapper redirects unauthenticated users to `/login`

## Error Handling

### Backend
- Central error middleware: all errors return `{ error: { message, code } }`
- Mongoose validation errors -> 400 with field-level messages
- JWT expired/invalid -> 401
- Resource not found -> 404
- Rate limiting on `/api/auth/login` and `/api/auth/register` (express-rate-limit, 10 req/min)

### Frontend
- Axios response interceptor: 401 -> clear auth, redirect to login
- TanStack Query `onError` callbacks -> toast notifications for failed operations
- Optimistic updates for habit completion toggling (immediate UI feedback, rollback on failure)
- Loading skeletons for initial data fetches

## Notifications (In-App Only)

- Notifications are created server-side on events: streak milestones, achievements, daily tips
- Frontend polls `GET /api/notifications` on page load and periodically (every 60s when tab is active)
- Bell icon shows unread count badge
- Dropdown lists recent notifications, click marks as read
- No browser push notifications or email

## Docker Compose Deployment

```yaml
services:
  client:
    build: ./packages/client
    ports: ["3000:80"]        # nginx serves built React app
    depends_on: [server]
  server:
    build: ./packages/server
    ports: ["5000:5000"]
    depends_on: [mongo]
    environment:
      - MONGO_URI=mongodb://mongo:27017/mindful-flow
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
  mongo:
    image: mongo:7
    volumes: [mongo-data:/data/db]
    ports: ["27017:27017"]

volumes:
  mongo-data:
```

- Client Dockerfile: multi-stage build (node for build, nginx for serve)
- Server Dockerfile: node image, copies built server code
- `.env` file for secrets (JWT_SECRET, etc.)

## Testing Strategy

| Layer | Tool | Focus |
|-------|------|-------|
| Backend API | Jest + Supertest | Endpoint tests: auth flow, CRUD operations, analytics calculations |
| Backend utils | Jest | Streak calculation, date normalization |
| Frontend components | Vitest + React Testing Library | Component rendering, user interactions |
| Frontend hooks | Vitest | Custom hook behavior (useAuth, useHabits) |
| Shared | Jest | Validation rules, constants |

## Computed Values (Not Stored)

These are calculated from Completions on-the-fly:
- **Daily progress**: count completions for today / count active daily habits
- **Weekly score**: completions this week / total targets this week * 100
- **Streak**: consecutive days with all daily habits completed
- **Habit completion rate**: completions in period / expected completions * 100
- **Calendar dots**: aggregate completions by date for the month
