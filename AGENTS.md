# CDH Production — Agent Context

> Golden Rule: All existing functionality must remain intact. Restructuring only — every flow, view, and action must work exactly as before.

## Project Overview

Three packages in one repo:
- `backend/` — ElysiaTS + Prisma (PostgreSQL)
- `frontend/` — React + Vite + TailwindCSS (shadcn/ui)
- `mobile/` — Expo SDK 57 + React Native (Android-only)

**Stack:** React 19, Elysia 1.4, Prisma 5, TypeScript 6, Vite 8, Bun runtime.

## Quick Start

```bash
# 1. Database
docker-compose up -d                              # PostgreSQL on :6543

# 2. Backend (:3000)
cd backend
bun install
bunx prisma db push                               # Push schema + generate client
bunx prisma db seed                                # Creates admin + surveyor
bun run dev                                        # --watch mode, Swagger at /swagger

# 3. Frontend (:5173) — separate terminal
cd frontend
bun install
bun run dev
```

**Seed accounts:** `admin` / `admin123` (role 1), `encuestador_01` / `encuestador123` (role 3).

## Architecture — Backend

**Entry:** `src/index.ts` — Elysia groups all controllers under `/api`.

| Controller | Routes | Notes |
|---|---|---|
| `auth.ts` | `/api/auth/login` | JWT-based, returns Bearer token |
| `users.ts` | `/api/users` | CRUD + `/me` for profile |
| `forms.ts` | `/api/forms` | CRUD with full QuestionJSON payload |
| `assignments.ts` | `/api/assignments` | Survey→Surveyor mapping |
| `responses.ts` | `/api/responses` | Android app upload endpoint |
| `dashboard.ts` | `/api/dashboard/stats` | Live KPI aggregation |

**Auth middleware:** `middleware/auth.ts` — JWT via `.resolve()` pattern, decoded into `authUser` context. `onBeforeHandle` rejects 401 if missing/invalid.

**Passwords:** `utils/hash.ts` — supports legacy Werkzeug `pbkdf2:sha256` hashes (from old Flask system) + Bun native Argon2id.

**File uploads:** `staticPlugin` serves `uploads/` at `/uploads`. Profile pics, INEs, respondent media stored here.

**Env:** `.env` requires `DATABASE_URL` (PostgreSQL :6543) and `JWT_SECRET`.

## Architecture — Frontend

**Entry:** `src/main.tsx` — TanStack Query + ThemeProvider + App.

**Routes** (`App.tsx` — react-router-dom v7 nested under `/admin`):

| Route | Feature |
|---|---|
| `/login` | Login |
| `/admin` | DashboardPage |
| `/admin/users` | Users CRUD |
| `/admin/forms` | Survey list |
| `/admin/forms/create` | Survey builder (drag-and-drop) |
| `/admin/forms/:id/preview` | Survey preview |
| `/admin/forms/edit/:id` | Survey edit |
| `/admin/asignaciones` | Assignments |
| `/admin/results` | Results table |
| `/admin/results/:id` | Per-respondent answers |
| `/admin/account` | Profile (blocked for roleId 2) |

**Feature-slice pattern** (`src/features/{users,forms,responses,assignments,dashboard,account}/`):
- `api/` — TanStack Query hooks (`useQuery`, `useMutation`)
- `components/` — table, form, modal components
- `pages/` — route-level page components
- `types.ts` — local TypeScript interfaces

**State:** Zustand for auth (`useAuthStore`), TanStack Query for all remote data. No Redux.

**Permissions:** `<PermissionRoute permissionKey="...">` wraps admin routes. `roleId` 2 (Admin Temporal) is blocked from `/account` and some features. Sidebar items filter dynamically based on `User.permissions` JSON field. All sensitive endpoints validate against DB (403 on violation).

**UI conventions:**
- shadcn/ui with `@` path alias, CSS variables (never hardcoded colors)
- Server-side pagination: `skip`/`take` in Prisma, `PaginatedResponse<T>` response shape
- Debounced search (500ms) on text filters
- `sonner` toast (never `alert()`/`confirm()`)
- `AlertDialog` for destructive confirmations
- Lint: `oxlint` (not eslint) — `bun run lint` in frontend

**Env:** `VITE_API_URL=http://localhost:3000` in `.env`.

## Architecture — Mobile

> **CRITICAL:** Read `mobile/REQUIREMENTS-APK.md` for full functional spec.
> **CRITICAL:** Expo SDK 57 — read versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

**Target device:** LENOVO Tab One, MediaTek Helio G85, 4GB RAM, Android 14.

**Paradigm:** Offline-first. One survey at a time. Download template → execute N respondent records → batch upload → cleanup.

### Library Reality vs. REQUIREMENTS-APK.md

| Requirement doc says | Actually used in code | Notes |
|---|---|---|
| `react-native-audio-recorder-player` | **`react-native-nitro-sound`** | Replaced — JSI-based, no JS Bridge |
| `react-native-fs` (or equiv) | **`expo-file-system`** | Already Expo-compatible |
| `react-native-geolocation-service` (or equiv) | **`expo-location`** | Permissions only; GPS capture stubbed to `null` (gap vs REQ-EXEC-03) |
| `react-native-vision-camera` | **`react-native-vision-camera`** | Matches |
| `@notifee/react-native` | **`@notifee/react-native`** | Matches (Foreground Service for Android 14) |
| — | **`react-native-nitro-image`** | In `package.json` but **never imported** (remove candidate) |
| — | **`react-native-reanimated`** | In `package.json` but not imported directly (NativeWind v4 peer dep) |

### Key implementation rules
- **Audio:** `.m4a` AAC via `react-native-nitro-sound` + `@notifee` Foreground Service notification
- **Camera:** `react-native-vision-camera` (JSI direct), output `.jpg` at controlled resolution
- **Upload:** Enviar `imageData` y `audioData` como `Base64` en el formData, la web está adaptada para recibirlos así. (No usar multipart crudo por problemas en Android).
- **Post-upload:** Delete local record + files from WatermelonDB per HTTP 200
- **Emergency:** JSON backup of full DB with special password; local recovery button
- **Forced navigation:** Cannot skip questions, only go back. Cancel requires evidence photo
- **Gender quotas:** Real-time progress vs `Assignment.womenCount`/`menCount`
- **NativeWind v4:** Icon spacing via `style={{ marginRight: 12 }}` — **never** `mr-2`/`ml-4`
- **Dark theme only:** `bg-background: #020817`, `bg-card: #020817`, `bg-primary: #3B82F6`
- **Icons:** `lucide-react-native` only — no emojis for actions/components

## Database — Prisma Schema

**Key models:** `User`, `Survey`, `Question`, `Option`, `SubOption`, `Assignment`, `Respondent`, `Answer`.

- `User.roleId`: 1=Admin, 2=Admin Temporal (limited perms), 3=Surveyor
- `User.permissions`: `Json?` field — granular flags (`manageUsers`, `createSurvey`, `viewSurveys`, etc.)
- `Question.typeId`: 1=open, 2=single, 3=multiple, 4=matrix_single, 5=matrix_multiple
- `Assignment` has `womenCount`/`menCount` quota targets
- `Respondent` stores geo (`latitude`, `longitude`), media paths (`imagePath`, `audioPath`), demographics

**Seed:** Run `bunx prisma db seed` after `bunx prisma db push`.

## Design — CSS Variable Tokens

Use shadcn/ui CSS variable classes only — never hardcoded color values.

| Token | HSL | Hex |
|---|---|---|
| `--primary` | `207 72% 25%` | `#12446E` |
| `--accent` | `22 74% 45%` | `#CA5D1E` |
| `--background` | `210 20% 96%` | `#F4F6F8` |
| `--card` | `0 0% 100%` | `#FFFFFF` |
| `--foreground` | `217 33% 17%` | `#1E293B` |
| `--muted-foreground` | `215 16% 47%` | `#64748B` |
| `--destructive` | `348 83% 60%` | `#EF4444` |
