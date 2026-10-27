# @kodxcamp/client

> **Interactive, browser-first frontend for the KodxCamp learning platform.**

The KodxCamp client is a modern Single-Page Application (SPA) built with **React 18**, **TypeScript**, **Vite**, and **Tailwind CSS**. It provides an in-browser code editor, real-time code execution, learning roadmaps, course workspaces, project editors, and administrative consoles.

---

## Key Features

- **Monaco Editor Integration**: Visual Studio Code editor experience in the browser with syntax highlighting, autocomplete, and diagnostics.
- **In-Browser Multi-Language Runtimes**:
  - **JavaScript / TypeScript**: Isolated Web Workers with memory limits and execution timeout protection.
  - **Python**: **Pyodide** WebAssembly runtime running standard CPython 3.12.
  - **Ruby**: Web Worker ruby interpreter.
  - **Java**: **CheerpJ** execution engine with HTTP byte-range jar streaming.
  - **SQL**: In-memory **SQLite (sql.js)** WebAssembly execution for database queries.
  - **Web Previews**: Sandboxed iframes with live reloading for HTML, CSS, JavaScript, React, and Tailwind CSS.
- **Role-Based Guards**: Dynamic client-side routing guards for Students, Instructors (`InstructorGuard`), and Admins (`AdminGuard`).
- **State Management**:
  - **Zustand**: Fast, lightweight auth and session state (`useAuthStore`).
  - **TanStack Query (React Query)**: Server state caching, background refetching, and pagination.
- **Bundle Optimization**: Custom Rollup code-splitting separating heavy dependencies (`monaco-editor`, `pyodide`, `three.js`, and `react-vendor`) into on-demand chunks.

---

## Directory Structure

```text
client/src/
├── app/                  # Application root, providers, and router
│   ├── App.tsx           # Global shell & QueryClient provider
│   ├── router.tsx        # Route definitions & access guards
│   ├── providers.tsx     # Toast and context wrappers
│   └── pages/NotFound.tsx# 404 page
│
├── features/             # Domain modules
│   ├── admin/            # Admin console (Metrics, Courses, Problems, Projects, Classes, Users)
│   ├── auth/             # Login, Signup, OTP Verification, Password Reset, Invitations
│   ├── classes/          # Live class listings, detail, attendance, recordings playback
│   ├── courses/          # Course catalog, course detail, lesson steps, quizzes
│   ├── dashboard/        # Student learning overview (My Learning)
│   ├── instructor/       # Instructor portal (Cohorts, Course Builder, Submissions, Roster)
│   ├── legal/            # Privacy Policy and Terms of Service
│   ├── marketing/        # Landing page (Hero, FeatureGrid, HowItWorks, Testimonials, FAQ)
│   ├── media/            # Media asset management and uploads
│   ├── notifications/    # In-app notifications & delivery preferences
│   ├── playground/       # Standalone multi-language in-browser code sandbox
│   ├── problems/         # Practice problem catalog, editor, test harness
│   ├── progress/         # Achievements, streaks, level progression
│   ├── projects/         # Multi-file project workspace, live preview, submission
│   └── roadmaps/         # Career roadmaps, milestones, skill trees
│
├── shared/               # Cross-cutting reusable modules
│   ├── api.ts            # Axios client with 401 interceptor & token management
│   ├── components/       # Layouts (AppLayout, StaffLayout), SEO, UI primitives (Button, Modal, Card)
│   ├── hooks/            # Custom reusable React hooks
│   ├── lib/              # Utility helpers, analytics, date formatters
│   ├── runner/           # In-browser test harnesses, workers, and JSON comparators
│   └── store/            # Global Zustand stores (Auth, Editor settings)
│
├── styles/index.css      # Tailwind directives, CSS variables, and landing styles
└── main.tsx              # React DOM entry point
```

---

## Environment Variables

Configure these in `client/.env` or root `.env`:

```env
# URL of the backend API (defaults to /api if omitted, using Vite proxy in development)
VITE_API_URL=http://localhost:5000/api

# Optional: Firebase Web App credentials for Google Sign-In
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

---

## Development Scripts

Run these commands inside the `client` directory (or using `npm <script> -w client` from root):

```powershell
# Start Vite development server at http://localhost:5173
npm run dev

# Run TypeScript type check and production bundle
npm run build

# Preview the production build locally
npm run preview

# Run unit and component tests with Vitest
npm test

# Run tests in watch mode
npm run test:watch
```

---

## In-Browser Runner Details

The test runner system (`client/src/shared/runner/`) runs student solutions against test vectors:

1. **Test Harness (`testHarness.ts`)**: Prepares arguments, wraps execution in a timer, captures `stdout` / return value, and compares with expected output using `jsonCompare.ts`.
2. **CheerpJ Middleware**: Vite dev server is configured with custom `cheerpjRangeSupport` middleware to serve `.jar` dependencies using HTTP Range requests (`206 Partial Content`).
3. **Web Worker Sandboxing**: JavaScript and Ruby workers terminate after a fixed timeout (5s default) to prevent infinite loops from hanging the main UI thread.

---

## Testing

Client tests are powered by **Vitest** and **React Testing Library**:
- `testHarness.test.ts`: Verifies argument parsing, primitive and array return values.
- `jsonCompare.test.ts`: Verifies structural output equality, unordered set comparisons, and floating-point tolerances.
- `NotFound.test.tsx`: Verifies route fallback rendering.
