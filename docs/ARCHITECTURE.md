# KodxCamp Architecture Guide

This document outlines the architecture, data flow, and design decisions across the KodxCamp platform.

---

## 1. Core Philosophy: Browser-First Execution

Most coding platforms execute student code in ephemeral server containers (e.g. Docker, Firecracker microVMs). While necessary for complex backend environments, this approach introduces:
- High server infrastructure costs.
- Cold-start delays and queueing latency for students.
- Complex attack surfaces (container escapes, fork-bombs, network exfiltration).

KodxCamp takes a **browser-first execution approach**:
- Untrusted student code runs **inside the student's browser sandbox** (WebAssembly, Web Workers, or sandboxed iframes).
- The server stores the submission results, progress, and certificates, but never executes untrusted student code directly.

```
┌────────────────────────────────────────────────────────┐
│                   Student Browser                      │
│                                                        │
│   ┌────────────────────────────────────────────────┐   │
│   │              Monaco Code Editor                │   │
│   └──────────────────────┬─────────────────────────┘   │
│                          │                             │
│        ┌─────────────────┼─────────────────┐           │
│        ▼                 ▼                 ▼           │
│  ┌───────────┐    ┌─────────────┐    ┌───────────┐     │
│  │JavaScript │    │   Python    │    │  Java /   │     │
│  │Web Worker │    │(Pyodide WASM)│    │CheerpJ JVM│    │
│  └─────┬─────┘    └──────┬──────┘    └─────┬─────┘     │
│        │                 │                 │           │
│        └─────────────────┼─────────────────┘           │
│                          ▼                             │
│   ┌────────────────────────────────────────────────┐   │
│   │       Test Harness & JSON Comparator           │   │
│   └──────────────────────┬─────────────────────────┘   │
│                          │                             │
│                          ▼ (Pass/Fail Results)         │
│                 REST API (/api/problems)               │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                  KodxCamp Express API                  │
│                                                        │
│  - Verifies auth cookie session                        │
│  - Persists solved state in MongoDB                    │
│  - Increments student XP, level, and daily streaks     │
└────────────────────────────────────────────────────────┘
```

---

## 2. Runtimes

| Language | Engine | Isolation Boundary |
|---|---|---|
| **JavaScript / TS** | Native Browser Engine | Dedicated `Worker` with timeout and captured `console` |
| **Python** | **Pyodide** (WebAssembly CPython 3.12) | Web Worker with isolated virtual filesystem (`/workspace`) |
| **Java** | **CheerpJ** | In-browser Java Virtual Machine streaming `.jar` files via HTTP Range requests |
| **Ruby** | Web Worker Ruby | In-browser interpreter |
| **SQL** | **sql.js** (SQLite compiled to WASM) | In-memory relational database instantiated per problem |
| **HTML / CSS / React** | Sandboxed `<iframe>` | `sandbox="allow-scripts allow-modals"` with message passing |

---

## 3. Authentication & Session Security

- **Session Transport**: Stored inside HTTP-only, secure, sameSite cookies to protect against XSS token theft.
- **CSRF Defense**: Origin-based and Referer verification on all mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`).
- **Cryptographic Pepper**: Passwords and OTP verification codes are hashed using `bcryptjs` mixed with a server-side `AUTH_PEPPER` from environment secrets. A database leak alone cannot be used to rainbow-table passwords without this secret.
- **Setup Tokens**: Short-lived (15 minute) signed tokens generated after OTP verification to ensure passwords are only established after email ownership is proven.

---

## 4. Multi-Modal AI Evaluation Pipeline

For multi-file projects (HTML/CSS/JS frontend apps), KodxCamp features an automated AI evaluation pipeline powered by the **Groq SDK**:

1. **Submission**:
   - The student submits their multi-file code workspace along with client-rendered desktop and mobile screenshot data (generated via `html2canvas`).
2. **Review Passes**:
   - **Code Evaluation Pass**: Evaluates the code against the project specifications, testing for code quality, responsiveness, semantic HTML, and correct state management.
   - **Vision Evaluation Pass**: Uses Groq vision models to evaluate screenshot fidelity against the reference design mockups.
3. **Idempotency & Versioning**:
   - Evaluated records are stored under `AIEvaluation` with unique indices on `(submissionId, kind, evaluatorVersion, promptVersion)`.
   - Old evaluations are preserved, allowing administrators to audit prompt improvements over time.

---

## 5. Storage Architecture

```
                  ┌──────────────────────┐
                  │ Storage Interface    │
                  └──────────┬───────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
┌──────────────────────┐           ┌──────────────────────┐
│ Local Disk Provider  │           │ Cloudinary Provider  │
│ (Development)        │           │ (Production)         │
│                      │           │                      │
│ - Stores to uploads/ │           │ - CDN streaming      │
│ - Express static map │           │ - Video optimization │
└──────────────────────┘           └──────────────────────┘
```

The server abstracts file storage through `StorageProvider`. In production (`NODE_ENV=production`), when `CLOUDINARY_*` keys are present, class recordings and media assets are uploaded directly to Cloudinary. In local development without Cloudinary credentials, the server falls back to local disk storage (`uploads/`).

