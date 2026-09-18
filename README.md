# KodxCamp

> **Browser-first, learn-by-doing programming platform.**
> Interactive lessons, DSA practice, projects, and live classes — all in one calm, focused environment.

---

## ✨ Features

- **Interactive Lessons** — Read, then code, then run. Split-pane workspace with Monaco editor.
- **DSA Practice** — LeetCode-style problems with hidden test cases. Zero contests.
- **In-Browser Execution** — JavaScript (Web Worker), Python (Pyodide), SQL (SQL.js).
- **Projects** — Multi-file editor with live preview. HTML/CSS/JS and React.
- **Live Classes** — Google Meet integration, recordings, chapter navigation.
- **Progress & Streaks** — XP, levels, GitHub-style heatmap, 18 achievements.
- **Admin Panel** — Manage courses, problems, projects, classes, and users.

---

## 🛠 Tech Stack

**Frontend**
- React 18 + Vite + TypeScript
- Tailwind CSS + custom design tokens
- Zustand (state) · React Router (routing) · Monaco (editor)
- Pyodide + SQL.js (browser execution) · Web Workers (JS sandbox)

**Backend**
- Node 20 + Express + TypeScript
- MongoDB + Mongoose
- JWT auth · HMAC-signed test cases · Zod validation
- Multer (uploads) · Rate limiting · Helmet

---

## 🚀 Local Development

### Prerequisites
- Node 20+
- MongoDB (local or Atlas)
- npm 10+

### Setup

```bash
git clone https://github.com/your-username/kodxcamp.git
cd kodxcamp
npm install

# Server env
cp server/.env.example server/.env
# → edit server/.env with your MONGODB_URI and secrets

# Build shared package
npm run build -w shared

# Seed the database
npm run seed -w server

# Create an admin user (optional)
npm run make-admin -w server

# Start both client + server
npm run dev