# CDH Production — Plataforma de Encuestas

<p align="center">
  <img src="https://img.shields.io/badge/Bun-000?style=flat-square&logo=bun&logoColor=white" alt="Bun"/>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Elysia-1.4-3B82F6?style=flat-square" alt="ElysiaTS"/>
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white" alt="Prisma"/>
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React"/>
  <img src="https://img.shields.io/badge/Vite_8-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind"/>
  <img src="https://img.shields.io/badge/shadcn/ui-000?style=flat-square&logo=shadcnui&logoColor=white" alt="shadcn/ui"/>
  <img src="https://img.shields.io/badge/Zustand-443E38?style=flat-square&logo=zustand&logoColor=white" alt="Zustand"/>
  <img src="https://img.shields.io/badge/TanStack_Query-FF4154?style=flat-square&logo=reactquery&logoColor=white" alt="TanStack Query"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Expo_SDK_57-000020?style=flat-square&logo=expo&logoColor=white" alt="Expo"/>
  <img src="https://img.shields.io/badge/React_Native_0.86-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React Native"/>
  <img src="https://img.shields.io/badge/NativeWind_v4-0EA5E9?style=flat-square&logo=tailwindcss&logoColor=white" alt="NativeWind"/>
  <img src="https://img.shields.io/badge/WatermelonDB-4CAF50?style=flat-square" alt="WatermelonDB"/>
  <img src="https://img.shields.io/badge/VisionCamera-FF6F00?style=flat-square&logo=camera&logoColor=white" alt="VisionCamera"/>
</p>

<p align="center">
  <b>Runtime & Lenguaje</b> •
  <b>Frontend Web</b> (React 19 + Vite 8) •
  <b>App Móvil</b> (Expo SDK 57 + React Native) •
  <b>Backend</b> (ElysiaTS + Prisma + PostgreSQL)
</p>

---

## 📑 Índice

- [Stack Tecnológico](#stack-tecnológico)
- [Estructura del Repositorio](#estructura-del-repositorio)
- [Backend](#backend)
- [API Endpoints](#api-endpoints)
  - [Auth](#auth)
  - [Usuarios](#usuarios)
  - [Encuestas (Forms)](#encuestas-forms)
  - [Asignaciones](#asignaciones)
  - [Respuestas](#respuestas)
  - [Dashboard](#dashboard)
- [Base de Datos](#base-de-datos)
  - [Diagrama de Relaciones](#diagrama-de-relaciones)
  - [Modelos](#modelos)
- [Frontend Web](#frontend-web)
  - [Rutas](#rutas)
  - [Estado Global](#estado-global)
  - [UI / Convenciones Visuales](#ui--convenciones-visuales)
  - [Tokens de Diseño](#tokens-de-diseño)
- [App Móvil](#app-móvil)
  - [Paradigma Offline-First](#paradigma-offline-first)
  - [Librerías Nativas](#librerías-nativas)
  - [Convenciones Mobile](#convenciones-mobile)
  - [Dispositivo Objetivo](#dispositivo-objetivo)
- [Flujo de Datos](#flujo-de-datos)
- [Sistema de Permisos](#sistema-de-permisos)
  - [Roles](#roles)
  - [Permisos Granulares](#permisos-granulares)
  - [Validación](#validación)
- [Convenciones de Código](#convenciones-de-código)
- [Guía de Inicio Rápido](#guía-de-inicio-rápido)
  - [1. Base de Datos](#1-base-de-datos)
  - [2. Backend](#2-backend)
  - [3. Frontend](#3-frontend-terminal-separada)
  - [4. Móvil](#4-móvil-android)
- [Variables de Entorno](#variables-de-entorno)
- [Cuentas de Prueba](#cuentas-de-prueba-seed)
- [Licencia](#licencia)

---

Sistema completo de captura de datos para encuestas de campo con panel web administrativo y aplicación móvil Android offline-first para encuestadores.

```mermaid
graph TB
    subgraph Web
        FE["Frontend React + Vite :5173"]
    end
    subgraph Server
        BE["Backend Elysia + Bun :3000"]
        DB[("PostgreSQL 16 :6543")]
    end
    subgraph Mobile
        ME["App Expo SDK 57<br/>WatermelonDB local"]
    end
    FE -->|HTTP| BE
    ME -->|HTTP| BE
    BE -->|Prisma ORM| DB
```

---

## Stack Tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| **Runtime** | [Bun](https://bun.sh) | 1.x |
| **Lenguaje** | TypeScript | ~6.0 |
| **Backend** | [ElysiaTS](https://elysiajs.com) + [Prisma](https://prisma.io) | 1.4 / 5 |
| **Base de datos** | PostgreSQL 16 Alpine (Docker) | 16 |
| **Frontend web** | React + Vite + [shadcn/ui](https://ui.shadcn.com) | 19 / 8 / tailwindcss 3 |
| **App móvil** | [Expo](https://expo.dev) SDK 57 + React Native + [NativeWind](https://nativewind.dev) v4 | RN 0.86 |
| **Infra** | Docker Compose, JWT, Swagger | — |

---

## Estructura del Repositorio

```
cdh-restructured/
├── docker-compose.yml          # PostgreSQL 16 en puerto 6543
├── AGENTS.md                   # Contexto para asistentes IA
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # 8 modelos: User, Survey, Question, Option, SubOption, Assignment, Respondent, Answer
│   │   ├── seed.ts             # Admin + Encuestador
│   │   └── seed-mock.ts        # Datos mock (300 respondentes, 3 encuestas, 10 encuestadores)
│   └── src/
│       ├── index.ts            # Entry point Elysia (puerto 3000)
│       ├── db.ts               # PrismaClient singleton
│       ├── middleware/auth.ts  # JWT resolve + onBeforeHandle 401
│       ├── utils/
│       │   ├── hash.ts         # Werkzeug legacy + Argon2id
│       │   └── upload.ts       # File upload helper
│       ├── services/excelService.ts  # Export Excel con exceljs
│       └── controllers/
│           ├── auth.ts         # POST /api/auth/login
│           ├── users.ts        # CRUD /api/users + /me
│           ├── forms.ts        # CRUD /api/forms + QuestionJSON
│           ├── assignments.ts  # /api/assignments (survey→surveyor)
│           ├── responses.ts    # /api/responses (upload + export)
│           └── dashboard.ts    # GET /api/dashboard/stats
├── frontend/
│   └── src/
│       ├── main.tsx            # TanStack Query + ThemeProvider + App
│       ├── App.tsx             # react-router-dom v7 (10 rutas admin)
│       ├── store/authStore.ts  # Zustand auth persistido en localStorage
│       ├── lib/utils.ts        # cn() helper
│       ├── components/
│       │   ├── layout/         # DashboardLayout, Sidebar, Header, PermissionRoute
│       │   ├── ui/             # shadcn/ui components (button, dialog, table, etc.)
│       │   ├── theme-provider.tsx
│       │   └── mode-toggle.tsx
│       └── features/
│           ├── users/          # CRUD de usuarios
│           ├── forms/          # Builder drag-and-drop + preview
│           ├── responses/      # Resultados + detalle por respondente
│           ├── assignments/    # Asignaciones encuesta→encuestador
│           ├── dashboard/      # KPIs y progreso
│           └── account/        # Perfil de usuario
└── mobile/
    ├── app.json                # Expo config + permisos Android
    ├── babel.config.js         # Decorators + class-properties + Reanimated
    ├── patches/                # patch-package (Event.js writable fix)
    └── src/
        ├── api/client.ts       # Axios con JWT interceptor + SecureStore
        ├── database/
        │   ├── schema.ts       # WatermelonDB schema (espeja Prisma)
        │   ├── index.ts        # Inicialización DB
        │   └── models/         # Survey, Question, Option, SubOption, Respondent, Answer
        ├── services/
        │   ├── SyncService.ts      # Download assignment + templates
        │   ├── UploadService.ts    # Batch upload multipart
        │   └── AudioRecorderService.ts  # NitroSound + Notifee FG
        ├── features/
        │   ├── auth/           # Login + SecureStore + Zustand
        │   ├── dashboard/      # Main screen + EmergencyPanel
        │   ├── survey/         # SurveyContainer, QuestionView, RespondentForm, FinalCamera
        │   └── permissions/    # Permisos Android runtime
        └── components/ui/      # CustomModal, CircularProgress
```

---

## Backend

### Entry Point

`backend/src/index.ts` configura Elysia con:
- CORS habilitado
- Servicio estático para `uploads/` en `/uploads`
- Swagger en `/swagger`
- JWT con `JWT_SECRET`
- 6 controladores agrupados bajo `/api`

### Middleware de Autenticación

`middleware/auth.ts` — JWT mediante patrón `.resolve()` que decodifica el token en `authUser` dentro del contexto. `onBeforeHandle` rechaza con 401 si no hay token válido.

### Manejo de Contraseñas

`utils/hash.ts` soporta:
- **Hashes legacy** del antiguo sistema Flask (`pbkdf2:sha256` de Werkzeug)
- **Argon2id** nativo de Bun para contraseñas nuevas
- Actualización transparente al hacer login (si el hash es legacy, se reemplaza por Argon2id)

---

## API Endpoints

### Auth

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/api/auth/login` | No | Inicio de sesión, devuelve JWT |

### Usuarios

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/users` | Sí | Listar usuarios (paginated) |
| `GET` | `/api/users/me` | Sí | Perfil del usuario autenticado |
| `GET` | `/api/users/:id` | Sí | Detalle de usuario |
| `POST` | `/api/users` | Sí | Crear usuario |
| `PUT` | `/api/users/:id` | Sí | Actualizar usuario |
| `DELETE` | `/api/users/:id` | Sí | Eliminar usuario |

### Encuestas (Forms)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/forms` | Sí | Listar encuestas |
| `GET` | `/api/forms/:id` | Sí | Detalle con preguntas |
| `POST` | `/api/forms` | Sí | Crear encuesta con QuestionJSON |
| `PUT` | `/api/forms/:id` | Sí | Actualizar encuesta |
| `DELETE` | `/api/forms/:id` | Sí | Eliminar encuesta |

### Asignaciones

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/assignments` | Sí | Listar asignaciones |
| `POST` | `/api/assignments` | Sí | Asignar encuesta a encuestador |
| `DELETE` | `/api/assignments/:id` | Sí | Eliminar asignación |

### Respuestas

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/api/responses` | Sí | Upload desde app móvil (multipart, archivos en Base64) |
| `GET` | `/api/responses` | Sí | Listar resultados (paginated) |
| `GET` | `/api/responses/:id` | Sí | Detalle de respuestas por respondente |
| `GET` | `/api/responses/export` | Sí | Exportar a Excel |

### Dashboard

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/dashboard/stats` | Sí | KPIs: total encuestas, encuestadores, respondentes, progreso |

---

## Base de Datos

### Diagrama de Relaciones

```
erDiagram
    %% Relaciones principales de Asignación y Respuesta
    USER ||--o{ ASSIGNMENT : "tiene"
    SURVEY ||--o{ ASSIGNMENT : "pertenece a"
    
    USER ||--o{ RESPONDENT : "actúa como"
    SURVEY ||--o{ RESPONDENT : "es respondida por"
    
    %% Relaciones de las Respuestas
    RESPONDENT ||--o{ ANSWER : "genera"
    QUESTION ||--o{ ANSWER : "recibe"
    
    %% Opciones seleccionadas (Los (?) indican que es opcional 0..1)
    ANSWER }o--o| OPTION : "selecciona (opcional)"
    ANSWER }o--o| SUBOPTION : "selecciona (opcional)"
    
    %% Estructura de la Encuesta / Formulario
    SURVEY ||--o{ QUESTION : "contiene"
    
    %% Diccionario de Opciones compartidas
    OPTION ||--o{ QUESTION : "asignada a"
    SUBOPTION ||--o{ QUESTION : "asignada a"
```

### Modelos

| Modelo | Campos clave | Notas |
|---|---|---|
| **User** | id, roleId, username (unique), password, name, frontId, backId, profilePic, birthDate, permissions (Json?) | roleId: 1=Admin, 2=Admin Temporal, 3=Encuestador |
| **Survey** | id, title, description, location, status | status 1=activo |
| **Question** | id, surveyId, text, typeId | typeId: 1=abierta, 2=única, 3=múltiple, 4=matriz_single, 5=matriz_multiple |
| **Option** | id, questionId, text, image | Opciones de pregunta cerrada |
| **SubOption** | id, questionId, text | Sub-opciones para preguntas matriz |
| **Assignment** | id, surveyId, userId, womenCount, menCount | Metas de cuota por género |
| **Respondent** | id, surveyorId, surveyId, age, gender, schooling, latitude, longitude, imagePath, audioPath, isCancelled | Datos demográficos + media |
| **Answer** | id, respondentId, questionId, optionId?, subOptionId?, openText? | Respuesta individual |

---

## Frontend Web

### Rutas

| Ruta | Página | Descripción |
|---|---|---|
| `/login` | LoginPage | Inicio de sesión |
| `/admin` | DashboardPage | KPIs y progreso de encuestas |
| `/admin/users` | UsersPage | CRUD de usuarios |
| `/admin/forms` | FormsPage | Listado de encuestas |
| `/admin/forms/create` | FormBuilderPage | Constructor drag-and-drop |
| `/admin/forms/:id/preview` | FormPreviewPage | Vista previa |
| `/admin/forms/edit/:id` | FormBuilderPage | Editar encuesta |
| `/admin/asignaciones` | AssignmentsPage | Mapa encuesta→encuestador |
| `/admin/results` | ResultsPage | Tabla de resultados |
| `/admin/results/:id` | ResponseDetailsPage | Respuestas por respondente |
| `/admin/account` | AccountPage | Perfil (bloqueado para roleId 2) |

### Estado Global

- **Zustand** para auth (`useAuthStore`) con persistencia en `localStorage`
- **TanStack Query** para todos los datos remotos (cache, refetch, mutations)
- No hay Redux

### UI / Convenciones Visuales

- **shadcn/ui** con path alias `@/`
- **CSS variables** — nunca colores hardcodeados
- **Paginación server-side** con `skip`/`take` y `PaginatedResponse<T>`
- **Búsqueda debounced** (500ms) en filtros de texto
- **sonner** para toasts (nunca `alert()`/`confirm()`)
- **AlertDialog** para confirmaciones destructivas
- **Linting:** oxlint (`bun run lint` en frontend)

### Tokens de Diseño

| Token | HSL | Hex |
|---|---|---|
| `--primary` | `207 72% 25%` | `#12446E` |
| `--accent` | `22 74% 45%` | `#CA5D1E` |
| `--background` | `210 20% 96%` | `#F4F6F8` |
| `--card` | `0 0% 100%` | `#FFFFFF` |
| `--foreground` | `217 33% 17%` | `#1E293B` |
| `--muted-foreground` | `215 16% 47%` | `#64748B` |
| `--destructive` | `348 83% 60%` | `#EF4444` |

---

## App Móvil

### Paradigma Offline-First

```
Con red:    Login JWT → Download assignment + survey template
            ↓
Sin red:    Capturar N respondentes (foto, audio, geo, respuestas)
            ↓
Con red:    Batch upload (multipart/form-data con archivos en Base64) → HTTP 200 → Cleanup local
```

### Librerías Nativas

| Propósito | Librería | Notas |
|---|---|---|
| Cámara | `react-native-vision-camera` | JSI directo, output `.jpg` resolución controlada |
| Audio | `react-native-nitro-sound` | `.m4a` AAC, JSI-based, Foreground Service |
| Notificaciones FG | `@notifee/react-native` | Servicio en primer plano Android 14 |
| GPS | `expo-location` | Permisos + captura de coordenadas |
| Filesystem | `expo-file-system` | Almacenamiento local de media |
| DB local | `@nozbe/watermelondb` | SQLite espejando schema Prisma |
| UI | `lucide-react-native` | Solo este set de iconos (prohibido emojis) |
| Estilos | NativeWind v4 | Dark theme estricto |

### Convenciones Mobile

- **Dark theme only:** `bg-background: #020817`, `bg-card: #020817`, `bg-primary: #3B82F6`
- **Icon spacing:** `style={{ marginRight: 12 }}` — nunca `mr-2`/`ml-4`
- **Upload:** `multipart/form-data` con Base64
- **Post-upload:** Borrar registro local + archivos por cada HTTP 200
- **Cancelación:** Requiere foto de evidencia
- **Cuotas de género:** Progreso en tiempo real vs `womenCount`/`menCount`
- **Navegación forzada:** No se puede saltar preguntas, solo retroceder

### Dispositivo Objetivo

LENOVO Tab One, MediaTek Helio G85, 4GB RAM, Android 14.

---

## Flujo de Datos

```mermaid
sequenceDiagram
    participant Admin as Admin Web
    participant FE as Frontend
    participant BE as Backend
    participant DB as PostgreSQL
    participant App as App Móvil

    Admin->>FE: Crea encuesta
    FE->>BE: POST /api/forms
    BE->>DB: Guarda Survey + Questions + Options
    Admin->>FE: Asigna a encuestador
    FE->>BE: POST /api/assignments
    BE->>DB: Crea Assignment

    App->>BE: Login JWT
    App->>BE: GET /api/assignments (sync)
    BE->>App: Survey + preguntas + metas

    Note over App: OFFLINE: captura N respondentes

    App->>BE: POST /api/responses (multipart)
    BE->>DB: Guarda Respondent + Answers + media
    BE->>App: HTTP 200
    Note over App: Borra registro local + archivos

    Admin->>FE: Ve resultados
    FE->>BE: GET /api/responses
    BE->>FE: Datos paginados
```

---

## Sistema de Permisos

### Roles

| roleId | Nombre | Descripción |
|---|---|---|
| 1 | Admin | Acceso total al sistema |
| 2 | Admin Temporal | Acceso limitado por permisos granulares |
| 3 | Encuestador | Solo app móvil, login restringido en web |

### Permisos Granulares

El campo `User.permissions` (JSON) contiene flags como:
- `manageUsers` — Gestionar usuarios
- `createSurvey` — Crear encuestas
- `viewSurveys` — Ver listado de encuestas
- `viewResults` — Ver resultados
- `manageAssignments` — Gestionar asignaciones

### Validación

1. **Frontend:** `<PermissionRoute permissionKey="...">` envuelve rutas admin; sidebar filtra dinámicamente según `User.permissions`
2. **Backend:** Endpoints sensibles validan contra DB y devuelven `403 Forbidden` si se intenta evadir
3. **Admin Temporal:** No puede modificar su propia cuenta, no afecta admins principales, no accede a `/admin/account`

---

## Convenciones de Código

- **Linting:** oxlint en frontend (no eslint); ejecutar con `bun run lint`
- **UI:** shadcn/ui con CSS variables; nunca colores hardcodeados
- **Paginación:** server-side con `skip`/`take` en Prisma; respuesta con `PaginatedResponse<T>`
- **Búsqueda:** debounced (500ms) en filtros de texto
- **Toasts:** sonner (nunca `alert()`/`confirm()`)
- **Confirmaciones:** AlertDialog para acciones destructivas
- **Móvil:** Icon spacing con `style={{ marginRight: 12 }}`, nunca clases `mr-2`/`ml-4`
- **Iconos:** lucide-react / lucide-react-native únicamente; prohibido emojis en UI
- **CSS:** TailwindCSS v3 (web) / NativeWind v4 (mobile)
- **Patrón frontend:** Feature-slice (cada feature con `api/`, `components/`, `pages/`, `types.ts`)

---

## Guía de Inicio Rápido

### Requisitos Previos

- [Bun](https://bun.sh)
- [Docker](https://www.docker.com)

### 1. Base de Datos

```bash
docker-compose up -d
# PostgreSQL en :6543
```

### 2. Backend

```bash
cd backend
bun install
bunx prisma db push      # Push schema + generate client
bunx prisma db seed       # Crea admin + encuestador
bun run dev               # --watch, http://localhost:3000, Swagger en /swagger
```

### 3. Frontend (terminal separada)

```bash
cd frontend
bun install
bun run dev               # http://localhost:5173
```

### 4. Móvil (Android)

```bash
cd mobile
bun install
npx expo run:android      # Requiere Android Studio / dispositivo físico
```

> **Nota:** La app móvil apunta a `http://10.0.2.2:3000/api` por defecto (emulador). Para producción, cambiar `API_BASE_URL` en `mobile/.env`.

---

## Variables de Entorno

### `backend/.env`

| Variable | Descripción | Default |
|---|---|---|
| `DATABASE_URL` | Conexión PostgreSQL | `postgresql://postgres:postgres@localhost:6543/postgres?schema=public` |
| `JWT_SECRET` | Secreto para firmar JWTs | `super-secret-jwt-key-replace-in-prod` |

### `frontend/.env`

| Variable | Descripción | Default |
|---|---|---|
| `VITE_API_URL` | URL del backend | `http://localhost:3000` |

### `mobile/.env`

| Variable | Descripción | Default |
|---|---|---|
| `API_BASE_URL` | URL base del backend (10.0.2.2 = localhost desde emulador) | `http://10.0.2.2:3000/api` |
| `EMERGENCY_PASSWORD` | Contraseña para backup/recovery de emergencia | `cdh2026admin` |

---

## Cuentas de Prueba (Seed)

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `admin123` | Admin (roleId 1) |
| `encuestador_01` | `encuestador123` | Encuestador (roleId 3) |

> Admin Temporal (roleId 2) puede crearse desde el panel de gestión de usuarios con permisos granulares.

---

## Licencia

MIT &copy; 2026 — Ver archivo `mobile/LICENSE` para más detalles.
