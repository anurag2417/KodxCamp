# @kodxcamp/server

> **Secure Express & MongoDB backend API for the KodxCamp platform.**

The KodxCamp server provides REST endpoints for user authentication, course curriculum, coding problems, cohort management, live classes, media storage, payment processing, gamification, and automated AI code evaluation.

---

## Tech Stack & Architecture

- **Runtime & Framework**: Node.js (>=20), Express 4, TypeScript 5 (compiled to NodeNext ESM).
- **Database**: MongoDB with **Mongoose 8** schemas, indexing, and cascade delete handlers.
- **Validation**: **Zod** schema validation for request bodies, query parameters, and route parameters.
- **Authentication**: JWT stored in `httpOnly`, `sameSite`, and `secure` cookies with auth pepper hashing.
- **AI Evaluation**: Multi-modal evaluation pipeline powered by **Groq SDK** (Llama 3 code models and vision models).
- **Media Storage**: Abstract storage interface supporting **Cloudinary** (production) and local filesystem (development).
- **Payments**: **Razorpay** checkout order generation and raw HMAC webhook signature verification.
- **Email**: **Nodemailer** integration for OTP delivery and account verification.

---

## Directory Structure

```text
server/src/
├── config/               # Environment variable schemas (Zod) and MongoDB connection
│   ├── env.ts            # Validated environment configuration
│   └── db.ts             # Mongoose connection with retry logic
│
├── controllers/          # Request handlers and response mapping
│   ├── auth.controller.ts
│   ├── course.controller.ts
│   ├── problem.controller.ts
│   ├── project.controller.ts
│   ├── class.controller.ts
│   ├── aiEvaluation.controller.ts
│   ├── payment.controller.ts
│   ├── admin.*.controller.ts
│   └── instructor.*.controller.ts
│
├── middleware/           # Express middleware pipeline
│   ├── auth.middleware.ts       # JWT verification & session attachment
│   ├── requireAdmin.ts          # Admin role guard
│   ├── requireInstructor.ts     # Instructor role guard
│   ├── validate.middleware.ts   # Zod request validation
│   ├── rateLimit.middleware.ts  # Route-specific rate limiters
│   ├── csrf.middleware.ts       # Origin/Referer CSRF guard
│   ├── requestId.middleware.ts  # Unique request tracing headers
│   └── error.middleware.ts      # Global centralized error handler
│
├── models/               # Mongoose data models
│   ├── User.model.ts
│   ├── Course.model.ts
│   ├── Lesson.model.ts
│   ├── Problem.model.ts
│   ├── Project.model.ts
│   ├── ProjectSubmission.model.ts
│   ├── AIEvaluation.model.ts
│   ├── Class.model.ts
│   ├── Cohort.model.ts
│   ├── Payment.model.ts
│   └── Notification.model.ts
│
├── routes/               # Express route definitions
│   ├── index.ts          # Root API router (/api)
│   ├── auth.routes.ts
│   ├── course.routes.ts
│   ├── problem.routes.ts
│   ├── project.routes.ts
│   ├── class.routes.ts
│   ├── admin.routes.ts
│   ├── instructor.routes.ts
│   └── payment.routes.ts
│
├── services/             # Business logic layer
│   ├── aiEvaluation.service.ts
│   ├── course.service.ts
│   ├── payment.service.ts
│   ├── storage/          # Storage providers (Local & Cloudinary)
│   └── email.service.ts
│
├── scripts/              # Administrative & database migration CLI scripts
│   ├── seed.ts           # Database populator
│   ├── make-admin.ts     # Role elevation script
│   └── seed-data/        # Structured courses, problems, accounts, roadmaps
│
├── utils/                # Helper utilities (ApiError, ApiResponse, logger, asyncHandler)
├── app.ts                # Express app factory with middleware mounting
└── index.ts              # Server bootstrapper & listener
```

---

## Environment Variables (`server/.env`)

| Variable | Required? | Description |
|---|:---:|---|
| `NODE_ENV` | Yes | `development`, `production`, or `test` |
| `PORT` | No | Server listening port (default: `5000`) |
| `MONGODB_URI` | Yes | MongoDB connection string (Local or MongoDB Atlas) |
| `JWT_SECRET` | Yes | Random secret key (>= 32 chars) for signing session JWTs |
| `JWT_EXPIRES_IN` | No | JWT lifespan (default: `7d`) |
| `CLIENT_URL` | Yes | Allowed frontend origin URL (e.g. `http://localhost:5173`) |
| `AUTH_PEPPER` | Yes | Random pepper (>= 32 chars) mixed into password and token hashes |
| `SETUP_TOKEN_SECRET` | Yes | Random secret (>= 32 chars) for account setup tokens |
| `CLOUDINARY_CLOUD_NAME` | Optional | Cloudinary cloud identifier (for production storage) |
| `CLOUDINARY_API_KEY` | Optional | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Optional | Cloudinary API secret |
| `SMTP_HOST` | Optional | Outgoing SMTP host (e.g. `smtp.gmail.com`) |
| `SMTP_PORT` | Optional | SMTP port (e.g. `587`) |
| `SMTP_USER` | Optional | SMTP account email |
| `SMTP_PASS` | Optional | SMTP app password |
| `EMAIL_FROM` | Optional | Display sender (e.g. `KodxCamp <hello@kodxcamp.com>`) |
| `EMAIL_ENABLED` | Optional | Set `true` to dispatch real emails; `false` logs to console |
| `FIREBASE_PROJECT_ID` | Optional | Firebase project ID for Google sign-in |
| `FIREBASE_CLIENT_EMAIL` | Optional | Firebase service account email |
| `FIREBASE_PRIVATE_KEY` | Optional | Firebase service account private key (with `\n` literals) |
| `RAZORPAY_KEY_ID` | Optional | Razorpay key ID for checkout |
| `RAZORPAY_KEY_SECRET` | Optional | Razorpay key secret for checkout |
| `RAZORPAY_WEBHOOK_SECRET` | Optional | Secret key to verify Razorpay webhook signatures |
| `GROQ_API_KEY` | Optional | API key for Groq AI project evaluations |
| `AI_TEXT_PROVIDER` | No | `groq` or `null` (default: `null`) |
| `AI_VISION_PROVIDER` | No | `groq` or `null` (default: `null`) |

---

## Administrative CLI Commands

Run these commands using `npm run <command> -w server` from the monorepo root:

### 1. Promote User to Admin
```powershell
npm run make-admin -w server user@example.com
```
Sets the user's role to `'admin'`, account status to `'active'`, verifies their email, and assigns all global permissions.

### 2. Seed Database
```powershell
# Populate database with seed catalog and default accounts
npm run seed -w server

# Wipe existing data and reseed completely (caution: drops collections)
npm run seed:force -w server

# Seed specific entities only
npm run seed:courses -w server
npm run seed:problems -w server
```

### 3. Migrations & Maintenance
```powershell
# Fix problem number uniqueness index
npm run fix:problem-number-index -w server

# Migrate cohort invitation roles
npm run migrate:invitation-roles -w server
```

---

## API Overview

### Public & Student Endpoints
- `POST /api/auth/register`: Initiate OTP signup.
- `POST /api/auth/verify-otp`: Verify 6-digit OTP code.
- `POST /api/auth/set-password`: Finalize password with setup token.
- `POST /api/auth/login`: Authenticate and receive `token` cookie.
- `POST /api/auth/google`: Firebase Google ID token exchange.
- `GET  /api/auth/me`: Get active session and permissions.
- `GET  /api/courses`: List published courses.
- `GET  /api/courses/:slug`: Full course curriculum and lessons.
- `GET  /api/problems`: Filterable list of coding challenges.
- `POST /api/projects/:slug/submit`: Submit multi-file code and screenshots.
- `GET  /api/health/keepalive`: Zero-overhead ping endpoint for uptime monitors.

### Staff & Protected Endpoints
- `GET  /api/admin/stats`: Platform user, course, and enrollment metrics.
- `POST /api/admin/courses`: Admin course builder with module ordering.
- `POST /api/admin/projects/submissions/:id/evaluate`: Trigger AI evaluation pass.
- `GET  /api/instructor/cohorts`: List and manage active student cohorts.
- `POST /api/payments/order`: Create Razorpay checkout order.
- `POST /api/payments/webhook`: Webhook handler with raw HMAC verification.

