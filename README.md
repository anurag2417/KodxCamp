# KodxCamp

> Browser-first, learn-by-doing programming platform.

KodxCamp is a TypeScript monorepo for interactive coding lessons, programming
practice, browser-based code execution, multi-file projects, live classes,
recordings, progress tracking, and administration.

KodxCamp is intentionally not a competitive programming platform: it has no
contests, timed rounds, or competitive leaderboard. Problem code runs in the
browser; the server records submission results and does not execute untrusted
student code.

## Features

- **Authentication** — registration, login, logout, JWT HTTP-only cookies, and
  Origin-based CSRF protection.
- **Roles and permissions** — student, instructor, and admin roles, plus
  per-course team roles (`lead`, `author`, `reviewer`, `ta`, `viewer`).
- **Courses and lessons** — course catalog, interactive Monaco lessons,
  completion tracking, progress, and lesson XP.
- **Problem practice** — difficulty/topic filters, JavaScript/Python editor,
  browser test harness, submissions, solved state, and difficulty-based XP.
- **Browser execution** — JavaScript Web Workers, Python/Pyodide, SQL.js, and
  sandboxed frontend previews.
- **Projects** — multi-file workspace, tabs, live preview, save/load, project
  categories, and project XP.
- **Live classes** — scheduling, Google Meet links, enrollment, lifecycle
  transitions, recording uploads, chapters, playback progress, and catch-up
  recordings.
- **Progress** — XP, levels, streaks, activity history, weekly data,
  difficulty breakdown, heatmap data, and achievements.
- **Admin panel** — users, problems, projects, classes, statistics, and bulk
  import.
- **Instructor tools** — course editing, publishing, course teams, and
  permission-aware team management.
- **Shared UI** — responsive navigation, light/dark themes, toasts, loading
  states, error boundary, SEO support, and reusable UI components.

## Technology

### Frontend

- React 18, Vite, and TypeScript
- Tailwind CSS and custom design tokens
- React Router v6
- Zustand and TanStack Query
- Monaco Editor
- Axios and Lucide React
- Vitest and React Testing Library

### Backend

- Node.js and Express 4
- TypeScript
- MongoDB and Mongoose
- JWT authentication and `bcryptjs`
- Zod validation
- Helmet, CORS, rate limiting, request IDs, and CSRF Origin checks
- Multer for recording uploads

### Browser execution

- JavaScript isolated Web Worker
- Python Web Worker with Pyodide
- SQL.js
- Sandboxed iframe for HTML/CSS/frontend previews

## Repository Structure

```text
kodxcamp/
├── client/       # React/Vite frontend
├── server/       # Express/MongoDB backend
├── shared/       # Shared TypeScript package
├── .github/      # CI workflow
├── docs/         # Project documentation
├── package.json
└── package-lock.json
```

### Frontend

```text
client/src/
├── app/
│   ├── App.tsx
│   ├── providers.tsx
│   ├── router.tsx
│   └── pages/NotFound.tsx
├── features/
│   ├── admin/
│   ├── auth/
│   ├── classes/
│   ├── courses/
│   ├── dashboard/
│   ├── instructor/
│   ├── marketing/
│   ├── playground/
│   ├── problems/
│   ├── progress/
│   └── projects/
├── shared/
│   ├── components/
│   │   ├── editor/
│   │   ├── layout/
│   │   ├── seo/
│   │   └── ui/
│   ├── hooks/
│   ├── lib/
│   ├── runner/
│   └── store/
├── styles/index.css
├── test/setup.ts
└── main.tsx
```

Feature-specific pages, components, hooks, and API modules live under their
feature directory. Cross-cutting UI, runners, stores, and utilities live under
`shared/`.

### Backend

```text
server/src/
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── services/
├── jobs/
├── scripts/
├── utils/
├── app.ts
└── index.ts
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- MongoDB locally or through MongoDB Atlas

### Install dependencies

```powershell
npm install
```

### Configure the server

Create `server/.env`:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/kodxcamp
JWT_SECRET=<strong-random-secret-at-least-32-characters>
JWT_EXPIRES_IN=7d
HMAC_SECRET=<different-strong-random-secret-at-least-32-characters>
CLIENT_URL=http://localhost:5173
LOG_LEVEL=info
PUBLIC_UPLOAD_BASE_URL=
```

`PUBLIC_UPLOAD_BASE_URL` is optional. It can provide an external public base
URL for uploaded recordings. Local development stores recordings on disk.

Generate a secret with:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Build the shared package

```powershell
npm run build:shared
```

### Seed development data

```powershell
npm run seed -w server
```

### Run the application

From the repository root:

```powershell
npm run dev
```

Default URLs:

```text
Frontend: http://localhost:5173
API:      http://localhost:5000
Health:   http://localhost:5000/api/health
```

The Vite development server proxies `/api` requests to the backend.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the client and server together |
| `npm run build` | Build shared, server, and client packages |
| `npm run build:shared` | Build the shared package |
| `npm run build:server` | Type-check/build the server |
| `npm run build:client` | Type-check/build the client |
| `npm run seed -w server` | Seed development database records |
| `npm test -w client` | Run client Vitest tests |

## Important Current Limitations

- Problem submissions are not securely judged on the server. The browser runs
  the tests and reports the result; a server-side isolated judge is future
  work.
- Pyodide has a first-use loading delay.
- Recordings use local disk by default; an external storage provider is not
  implemented.
- Google Meet links are entered manually; Google Calendar integration does not
  exist.
- The reviewer approval workflow is not implemented.
- The instructor Students page and instructor-wide course analytics are not
  implemented.
- Team invitations currently use user IDs rather than email invitations.
- Notifications and onboarding are not implemented.
- Production deployment and production smoke testing are not complete.
- Docker-based sandboxing and plagiarism detection are deliberately not
  implemented.

## Deployment

The repository contains:

- GitHub Actions workflow: `.github/workflows/ci.yml`
- Vercel client configuration: `client/vercel.json`

Production deployment is not complete. A production setup will require:

1. MongoDB Atlas configuration.
2. Server environment variables and secure secrets.
3. Production cookie/CORS configuration.
4. External recording storage.
5. A deployed Express API and client.
6. Production smoke testing.

## Verification

The current workspace passes:

```powershell
npm run build
```

This validates the shared package, server TypeScript build, client TypeScript
check, and client Vite production build.

Non-blocking Vite warnings remain for auth-store static/dynamic imports and a
large client bundle chunk.

## Quick Reference

| Task | Location |
| --- | --- |
| Add a frontend feature | `client/src/features/<feature>/` |
| Add a frontend route | `client/src/app/router.tsx` |
| Add shared UI | `client/src/shared/components/ui/` |
| Modify global styles | `client/src/styles/index.css` |
| Add a feature API | `client/src/features/<feature>/api.ts` |
| Add a feature hook | `client/src/features/<feature>/hooks/` |
| Add a code runner | `client/src/shared/runner/` |
| Modify auth state | `client/src/shared/store/auth.store.ts` |
| Add an API route | `server/src/routes/` |
| Add a controller | `server/src/controllers/` |
| Add a database model | `server/src/models/` |
| Add business logic | `server/src/services/` |
| Add seed data | `server/src/scripts/seed.ts` |

## Documentation

The full implementation brief is available at:

[`docs/KodxCamp-Project-Brief.docx`](docs/KodxCamp-Project-Brief.docx)
