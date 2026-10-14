# LifeOS — Personal Operating System & Performance Workspace

An offline-first personal growth and life management operating system built with Apple Human Interface Guidelines aesthetics, vanilla web standards, and hybrid Supabase cloud synchronization.

Designed for founders, students, and engineers balancing business outreach, university coursework, technical projects, and personal routines without friction.

---

## Highlights

- **Apple HIG Design Aesthetics:** Clean typography (Inter & JetBrains Mono), glassmorphic backdrops, refined border tokens, and smooth light/dark mode transitions.
- **Hybrid Offline-First Architecture:** Operates with 0ms local latency using browser storage, paired with debounced background sync and real-time WebSocket replication via Supabase Postgres.
- **Academic & Senior Year Tracker:** Tailored Lebanese University Computer Science management module (today's class schedule, lab assignments, capstone milestones, study days).
- **Multi-Currency Finance Engine:** Track expenses and income sources with dual-currency support (USD & Lebanese Lira LBP), category breakdowns, and proactive budget threshold warnings.
- **Cross-Platform Progressive Web App (PWA):** Installable on iOS (Safari Add to Home Screen), Android (Chrome PWA), macOS, and Windows with offline service worker caching.
- **System Notifications:** Web Notification API integration with scheduled routine alerts and daily focus reminders.
- **Row-Level Security (RLS):** End-to-end database isolation ensuring user data is accessible only by the authenticated owner.

---

## Feature Modules

### 1. Today Command Center
- **Dynamic Morning & Evening Routines:** Quick-toggle daily checklists to build compounding consistency.
- **Daily Focus & Timeline:** Chronological view of meetings, classes, outreach blocks, and deep work sessions.
- **Active Projects & University Snapshot:** Real-time visibility into high-priority deliverables and lecture halls.
- **Universal Quick Capture (`Q`):** Rapid dialog to record expenses, tasks, schedule events, or reflections in seconds.

### 2. Growth, Routines & Pillars
- **Life Pillars:** Core tracking for high-ticket sales, agency growth, senior university graduation, and SWE/AI skills.
- **Curated Playbook Catalog:** Built-in actionable takeaways from top sales, engineering, and psychology frameworks (Fanatical Prospecting, Clean Code, Deep Work).
- **Interactive Notes & Reflections:** Searchable markdown-friendly knowledge base for strategy notes and retrospectives.

### 3. Tasks & Habit Streaks
- **Category Filtering:** Filter tasks across Sales, University, Agency, Personal, and Coding.
- **Recurring Habits:** Track streaks and completion momentum with clean visual feedback.
- **Priority Indicators:** High, medium, and low urgency tags with deadline counters.

### 4. Schedule & University
- **Dynamic Day Modes:** Toggle between `Classes Day`, `Study Day`, `Exam Prep`, and `Day Off`.
- **Course & Lab Schedule:** Manage class times, room numbers, and attendance tracking.
- **Project Milestones:** Progress tracking with due dates for senior capstone and systems programming assignments.

### 5. Finances & Cashflow
- **Expense & Income Logging:** Categorize clinic software payouts, agency retainers, university commute, and food.
- **Live Net Balance & Pacing:** Real-time calculations of total income, expenses, and remaining budget.
- **Flexible Currency:** Switch between USD ($) and Lebanese Lira (LBP) dynamically across all calculations.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Core** | Vanilla JavaScript (ES Modules), HTML5 Semantic Structure |
| **Styling** | Modern Vanilla CSS (Design Tokens, CSS Variables, Responsive Grid/Flexbox) |
| **Build Tooling** | [Vite](https://vitejs.dev/) |
| **Cloud Backend** | [Supabase](https://supabase.com/) (PostgreSQL + Realtime WebSockets + GoTrue Auth) |
| **Offline Storage** | Persistent Browser `localStorage` + Service Worker Cache |
| **Micro-Interactions** | Canvas Confetti, Web Notifications API |
| **Deployment** | [Vercel](https://vercel.com/) (PWA-ready with `vercel.json` rewrites) |

---

## Quick Start (Local Setup)

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- npm or pnpm

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/life-os.git
   cd life-os
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

4. **Build for production:**
   ```bash
   npm run build
   ```

---

## Supabase Cloud Sync Setup (Optional, Free)

To enable automatic real-time sync between your phone and laptop:

1. Create a free project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase project dashboard.
3. Paste and run the queries inside [`supabase_setup.sql`](./supabase_setup.sql) to create the `lifeos_userdata` table with Row-Level Security.
4. Copy your **Project URL** and **Anon Public Key** from **Project Settings** -> **API**.
5. In LifeOS:
   - Click the user card in the sidebar or press `Q` -> **Settings**.
   - Click **Configure Project Keys**, paste your URL and Key, and click **Save Keys**.
   - Enter your email and password, then click **Sign Up** or **Sign In**.
6. That's it! Any updates made on your mobile device will now reflect on your laptop in real-time.

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| <kbd>Q</kbd> | Open Universal Quick Capture Modal |
| <kbd>1</kbd> | Switch to Today Command Center |
| <kbd>2</kbd> | Switch to Routines & Goals View |
| <kbd>3</kbd> | Switch to Tasks & Habits View |
| <kbd>4</kbd> | Switch to Schedule & University View |
| <kbd>5</kbd> | Switch to Finances View |
| <kbd>D</kbd> | Toggle Light / Dark Theme |

---

## Deployment to Vercel

This repository includes a ready-to-use [`vercel.json`](./vercel.json) configuration for instant deployment:

```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Deploy directly
vercel
```

Follow the prompts and accept defaults to get an HTTPS production URL instantly.

---

## License

MIT License. Created by [Hussein](https://github.com/).
