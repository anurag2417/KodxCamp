# KodxCamp

> **Browser-first, learn-by-doing programming platform.**

KodxCamp is a modern TypeScript monorepo designed for interactive coding education, structured learning roadmaps, in-browser code execution, multi-file projects, live cohort classes, automated AI grading, and gamified progress tracking.

Unlike competitive programming platforms, KodxCamp emphasizes **active learning, real-world development, and immediate feedback**: untrusted student code executes safely inside isolated browser sandboxes (Web Workers, WebAssembly, and sandboxed iframes), eliminating server-side security overhead and cold starts while giving learners instant execution and testing.

---

## Key Features

### 1. In-Browser Multi-Language Execution
- **Zero Local Setup**: Run code directly in the browser with syntax highlighting, autocomplete, and diagnostics powered by Monaco Editor.
- **JavaScript & TypeScript**: Executed in dedicated isolated Web Workers.
- **Python**: Executed in-browser via **Pyodide** (WebAssembly CPython 3.12).
- **Ruby**: Executed via Web Worker ruby runtime.
- **Java**: In-browser execution powered by **CheerpJ** with Range-request chunk streaming.
- **SQL / Relational Databases**: In-browser query execution using **SQLite / sql.js** WebAssembly.
- **Frontend Live Previews**: Sandboxed iframe previews with live reload for HTML, CSS, JavaScript, React, and Tailwind CSS.

### 2. Curriculum & Interactive Tutorials
- **Courses & Modules**: Structured modules with video integration, step-by-step challenges, theory notes, and auto-graded test cases.
- **Practice Problems**: Categorized by difficulty (Easy, Medium, Hard) and topics (Arrays, Strings, Dynamic Programming, Two Pointers, Greedy, Math, Hash Maps).
- **Comprehensive Test Harness**: Public and hidden test cases with diffs and execution runtime metrics.

### 3. Career Roadmaps & Skill Trees
- Guided learning paths (Full-Stack Web Development, Data Structures & Algorithms, Python Backend, etc.) with milestone progress tracking.

### 4. Cohorts, Live Classes & Recordings
- **Live Classes**: Google Meet integration, calendar scheduling, attendance tracking, and cohort lifecycle states.
- **Cloudinary / Local Video Storage**: Streamed playback of class recordings, chapter markers, and watch progress.

### 5. Automated AI Evaluation Pipeline
- **Groq LLM Integration**: Multi-modal evaluation pipeline for project submissions.
- **Code Review Pass**: Structural and architectural code review evaluating adherence to project specifications.
- **Vision Pass**: Multi-modal screenshot analysis verifying desktop and mobile UI fidelity.

### 6. Gamification & Retention
- Daily streaks, weekly heatmaps, activity tracking, XP levels, and achievement badges.

### 7. Monetization & Payments
- Built-in **Razorpay** checkout integration with HMAC webhook signature verification for paid courses and cohort enrollments.

### 8. Role-Based Workflows
- **Student**: Learning dashboard, course workspaces, coding sandbox, achievements, and notifications.
- **Instructor**: Cohort management, student roster review, course builder, project submission grading, and class announcements.
- **Admin**: Platform metrics, user roles, catalog management, media management, AI status inspection, and bulk import.

---

## Monorepo Architecture

```text
kodxcamp/
├── client/       # React 18, Vite, Tailwind CSS, Monaco Editor, Zustand
├── server/       # Node.js, Express, TypeScript, MongoDB, Mongoose, Groq SDK
├── shared/       # Shared TypeScript types, interfaces, constants, and permissions
├── docs/         # Architecture notes and documentation
├── .github/      # CI/CD workflows (GitHub Actions)
├── package.json  # Root workspace configuration
└── package-lock.json
```

### Workspace Details

- **`@kodxcamp/shared`**: Shared domain contracts (`IUser`, `ICourse`, `IProblem`, `IProject`, etc.), permission enums, and constants.
- **`@kodxcamp/server`**: REST API backend built on Express, secured with JWT HTTP-only cookies, CSRF protection, rate limiting, and Zod request validation.
- **`@kodxcamp/client`**: Single-Page Application (SPA) built with React 18, React Router v6, Tailwind CSS, TanStack Query, Framer Motion, and Rollup chunk splitting.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 5, TypeScript 5, Tailwind CSS, Monaco Editor, Zustand, TanStack Query, Lucide Icons, Framer Motion |
| **In-Browser Runtimes** | Pyodide (Python), CheerpJ (Java), sql.js (SQLite), Isolated Web Workers (JS/Ruby) |
| **Backend** | Node.js (>=20), Express 4, TypeScript 5, Mongoose 8, Zod, Helmet, Morgan, Compression |
| **Database** | MongoDB (Local or MongoDB Atlas) |
| **Media & Storage** | Cloudinary (Production) / Local Disk (Development) |
| **Authentication** | JWT in HTTP-Only Cookies, bcryptjs with pepper, Firebase Admin (Google OAuth) |
| **Email** | Nodemailer (Gmail SMTP or transactional providers) |
| **Payments** | Razorpay Node SDK & Webhook verification |
| **AI Evaluation** | Groq SDK (Llama 3 & Vision models) |
| **Testing** | Vitest, React Testing Library, JSDOM |

---

## Getting Started

### Prerequisites

- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017/kodxcamp`) or MongoDB Atlas URI

### 1. Clone & Install Dependencies

```powershell
git clone https://github.com/your-org/kodxcamp.git
cd kodxcamp

# Install monorepo dependencies across all workspaces
npm install
```

### 2. Configure Environment Variables

Create `server/.env` based on the configuration below:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/kodxcamp
JWT_SECRET=your_32_character_jwt_secret_here_random_hex
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
LOG_LEVEL=info

# ─── Auth Secrets ────────────────────────────────────────────────────────
AUTH_PEPPER=your_32_character_auth_pepper_secret_random_hex
SETUP_TOKEN_SECRET=your_32_character_setup_token_secret_random_hex

# ─── Media Storage (Cloudinary - Optional in Dev) ────────────────────────
# Leave blank in dev to store uploads locally under server/uploads/
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# ─── Email (SMTP - Optional in Dev) ──────────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=KodxCamp <hello@kodxcamp.com>
EMAIL_ENABLED=false

# ─── Firebase Google Sign-In (Optional) ──────────────────────────────────
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# ─── Payments (Razorpay - Optional in Dev) ───────────────────────────────
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
RAZORPAY_MODE=test

# ─── AI Evaluation (Groq - Optional) ────────────────────────────────────
GROQ_API_KEY=
AI_TEXT_PROVIDER=null
AI_VISION_PROVIDER=null
```

> [!TIP]
> Generate secure 64-character random hex keys for `JWT_SECRET`, `AUTH_PEPPER`, and `SETUP_TOKEN_SECRET`:
> ```powershell
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### 3. Build Shared Package

Before running or developing, compile the shared contracts:

```powershell
npm run build:shared
```

### 4. Seed Database with Courses & Problems

Populate the database with sample courses, coding problems, roadmaps, and admin accounts:

```powershell
# Seed catalog and accounts
npm run seed -w server

# Wipe and reseed cleanly (development only)
npm run seed:force -w server
```

### 5. Promote an Admin User

To give an account full administrative access:

```powershell
npm run make-admin -w server your-email@example.com
```

### 6. Start Development Servers

Run client and server concurrently from the monorepo root:

```powershell
npm run dev
```

- **Frontend App**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000/api`
- **Health Check**: `http://localhost:5000/api/health`

---

## Available NPM Scripts

| Command | Action |
|---|---|
| `npm run dev` | Builds shared and starts both server and client with hot-reload |
| `npm run build` | Full production build: compiles shared, server, and bundles client |
| `npm run build:shared` | Compiles TypeScript contracts in `@kodxcamp/shared` |
| `npm run build:server` | Compiles backend with `tsc` |
| `npm run build:client` | Type-checks (`tsc -b`) and bundles client with Vite Rollup |
| `npm test` | Runs Vitest suites across both server and client |
| `npm test:server` | Runs server unit tests |
| `npm test:client` | Runs client test harness and component tests |
| `npm run make-admin -w server <email>` | Grants admin role and global permissions to a user |
| `npm run seed -w server` | Populates database with starter courses, problems, and roadmaps |
| `npm run clean` | Deletes `node_modules` and `dist` build folders across the monorepo |

---

## Testing & Quality Assurance

KodxCamp includes automated tests for both workspaces:

```powershell
# Run all tests
npm test
```

- **Server Tests**: Schema validators, code judge contracts, and authentication token sanity (`server/src/services/__tests__/judgeSchemas.test.ts`).
- **Client Tests**: Multi-language test harness, JSON test case comparators, and routing error boundaries (`client/src/shared/runner/__tests__`).

---

## Deployment & Production

### Production Build
```powershell
npm run build
```

- **Client Bundle**: Optimized with Rollup manual chunking, isolating large dependencies (`monaco-editor`, `pyodide`, `three.js`, and `react-vendor`) to ensure fast page loads.
- **Server Serving**: When running `NODE_ENV=production`, the Express server automatically serves the compiled `client/dist` static assets with `no-cache` Cache-Control headers on `index.html` and immutable caching for hashed chunks.

### Health & Keepalive
The server includes a lightweight keepalive route at `GET /api/health/keepalive` (mounted before rate limiters) intended for external ping monitors (such as UptimeRobot or BetterStack) to avoid cold starts on platforms like Render.

---

## License

Private repository. Copyright © KodxCamp. All rights reserved.
