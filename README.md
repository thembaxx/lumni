# Lumni

**AI-powered South African Matric (Grade 12) exam preparation platform.**

Pass your Matric with confidence. Lumni is an offline-capable, mobile-first study companion for NSC exam candidates, featuring AI-generated questions, past paper practice, flashcards, gamification, and comprehensive progress tracking.

- **Website**: [lumni.ai](https://lumni.ai)
- **Contact**: hello@lumni.ai
- **Tech**: Next.js 16, React 19, TypeScript 6, Tailwind CSS 4, shadcn/ui

---

## Quick Start

```bash
npm install       # Install dependencies
npm run dev       # Start dev server at http://localhost:3000
npx tsc --noEmit  # Type-check
npx biome check . # Lint & format
npx next build    # Production build
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router), React 19 |
| Language | TypeScript 6 (strict mode) |
| Styling | Tailwind CSS 4, shadcn/ui, class-variance-authority |
| Animation | framer-motion 12, Three.js (onboarding), view-transitions |
| State | Zustand 5 (client), TanStack Query 5 (server) |
| Icons | HugeIcons |
| Charts | recharts 3 |
| Diagrams | Konva, Mermaid.js, React Flow |
| Math | KaTeX (remark-math, rehype-katex) |
| Offline DB | Dexie 4 (IndexedDB), sql.js (SQLite WASM) |
| Backend | Appwrite Cloud (auth, DB, storage, functions) |
| AI | Gemini 2.0 Flash Lite → Nvidia NIM → Groq (cascading) |
| Upload | UploadThing |
| Quality | Biome, eslint, bun test |
| Deployment | Vercel |

---

## Project Map

```
src/
├── app/                  # Next.js App Router pages & API routes
│   ├── (auth)/           # Sign-in, sign-up
│   ├── api/              # REST API (engine, auth, exams, analytics, cron, ...)
│   ├── dashboard/        # Main dashboard
│   ├── quiz/             # Quiz flow
│   ├── flashcards/       # SM-2 spaced repetition
│   ├── exam/[id]/        # Timed exam simulation
│   ├── past-papers/      # Past exam paper browser
│   ├── study-plan/       # Smart study planner
│   ├── admin/            # Admin dashboard & quality tools
│   ├── settings/         # User settings
│   ├── premium/          # Premium upgrade
│   ├── review/           # Review mistakes
│   ├── solve/            # AI problem solver
│   ├── bookmarks/        # Bookmarked questions
│   └── tools/            # APS calc, periodic table, calendar, ...
├── components/
│   ├── ui/               # 45+ shadcn-style primitives
│   ├── quiz/             # Question cards, quiz engine, diagrams
│   │   └── diagrams/     # Konva renderers (geometry, chart, chemistry, graph, circuit, ...)
│   ├── exam/             # Exam engine, timer, results
│   ├── dashboard/        # Stats, streaks, challenges, search, focus timer
│   ├── gamification/     # XP, levels, achievements, leaderboard
│   ├── visual/           # Diagram/image rendering
│   ├── onboarding/       # 5-step wizard with Three.js
│   ├── navigation/       # TopNav, BottomNav, DesktopSidebar
│   ├── providers/        # React context providers
│   └── ...               # Chat, settings, upload, celebration, social, tools
├── lib/
│   ├── question-engine/  # Question generation, grading, validation (11 types)
│   ├── visual-engine/    # Diagram generation (Konva/Wikimedia)
│   ├── competency-engine/# Bloom's taxonomy competency tracking
│   ├── quiz-session/     # Quiz state machine (start, recordAnswer, next)
│   ├── orchestrator/     # Composition root connecting engines + background jobs
│   ├── db/               # Dexie schema (v8), sync queue
│   ├── services/         # Analytics, progress, spaced-rep, search, leaderboard, notifications
│   ├── auth/             # Auth context, rate limiting
│   ├── ai/               # AI provider chain, token tracker, prompts
│   ├── shared/           # Backoff, queue, sync handlers
│   └── caching-strategy.ts # Tiered read-through cache
├── hooks/                # 33+ React hooks (useQuestionEngine, useVisualEngine, useAuth, ...)
├── store/                # Zustand stores (auth, flashcards, exam-session, ...)
├── types/                # TypeScript type definitions
└── curriculum/           # CAPS curriculum data
```

---

## Key Architecture

### Three-Tier Caching

Data flows through a greedy read-through cache:

```
Request → Dexie (IndexedDB, 24h) → Appwrite (Cloud) → AI Generation (fallback)
```

- **Dexie** (11 tables): questions, progress, quizAttempts, syncQueue, subjects, quizSessions, conflicts, jobs, competencies, visuals, wrongAnswers, questionRatings
- **Appwrite**: 10+ collections for cross-session persistence
- **AI**: On-demand generation when no cached data exists

### Engines

- **QuestionEngine**: Generates, grades, and validates 11 question types (MCQ, matching, short-answer, long-answer, essay, calculation, diagram, programming, source-based, data-response, mixed)
- **VisualEngine**: Generates diagrams via Konva renderers (STEM) or Wikimedia images (non-STEM)
- **CompetencyEngine**: Bloom's taxonomy tracking (novice→mastered, 4 levels)
- **LearningOrchestrator**: Orchestrates question generation + background job enqueueing

### AI Provider Chain

```
Gemini 2.0 Flash Lite → Nvidia NIM (Llama 3.3 70B) → Groq (Llama 3.3 70B)
```

Each call is subject to per-user and global token budgets (20 gen/day, 100 grade/day, 50 visual/day per user; 2000 total/day global).

### Auth Flow

```
Anonymous (Appwrite session + Dexie) → Email/Password upgrade (same userId)
```

Offline-first: all data writes to Dexie immediately, syncs to Appwrite via a priority-ordered sync queue with exponential backoff.

---

## Features

**Learning**: AI question generation, past exam papers, timed exam simulation, SM-2 flashcards, wrong answer journal, review mistakes, competency tracking, step-by-step solutions

**Gamification**: XP/levels (12 levels), 12 achievements, daily challenges, streaks, leaderboard

**Study Tools**: Smart study planner, focus timer (Pomodoro), APS calculator, scientific calculator, periodic table, exam calendar, AI chat, AI solver, notes, bookmarks, study sets

**Quality**: Content quality ratings (1-5 stars), question quality dashboard for admins, token budget monitoring

**Platform**: PWA offline, push notifications, light/dark themes, responsive mobile-first, view transitions

---

## Dependencies

- **Runtime**: `next`, `react`, `react-dom`, `@tanstack/react-query`, `zustand`, `dexie`, `framer-motion`, `katex`, `react-markdown`, `konva`, `mermaid`, `recharts`, `three`
- **UI**: `@hugeicons/react`, `class-variance-authority`, `clsx`, `tailwind-merge`, `cmdk`, `vaul`, `input-otp`, `react-day-picker`, `@base-ui/react`
- **Backend**: `appwrite`, `node-appwrite`, `uploadthing`
- **Dev**: `typescript`, `biome`, `eslint`, `bun`, `tailwindcss`, `postcss`

---

## Learning More

- `CONTEXT.md` — Architecture context and terminology
- `PRODUCT.md` — Brand and design guidelines
- `AGENTS.md` — Agent coding conventions
- `app.config.ts` — App configuration constants
