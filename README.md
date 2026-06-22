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

| Layer              | Technology                                                       |
| ------------------ | ---------------------------------------------------------------- |
| Framework          | Next.js 16 (App Router), React 19                                |
| Language           | TypeScript 6 (strict mode)                                       |
| Styling            | Tailwind CSS 4, shadcn/ui, class-variance-authority              |
| Animation          | framer-motion 12, Three.js (onboarding), view-transitions        |
| State              | Zustand 5 (client), TanStack Query 5 (server)                    |
| Icons              | HugeIcons, Lucide                                                |
| Charts             | recharts 3                                                       |
| Diagrams           | Konva, Mermaid.js, React Flow (`@xyflow/react`)                  |
| Math               | KaTeX (remark-math, rehype-katex)                                |
| Offline DB         | Dexie 4 (IndexedDB, 23 tables, v18 schema), sql.js (SQLite WASM) |
| Backend            | Appwrite Cloud (auth, DB, storage, functions)                    |
| AI                 | Gemini 2.0 Flash Lite → Nvidia NIM → Groq (cascading)            |
| Upload             | UploadThing                                                      |
| Push Notifications | Web Push (`web-push`)                                            |
| Quality            | Biome, bun test                                                  |
| E2E Tests          | Playwright 1.60.0                                                |
| UI Docs            | Storybook 10.4.1                                                 |
| Deployment         | Vercel                                                           |

---

## Project Map

```
src/
├── app/                  # Next.js App Router pages & API routes
│   ├── (auth)/           # Sign-in, sign-up, forgot/reset password, verify email
│   ├── api/              # REST API (engine, auth, exams, analytics, cron, chat, quiz-packs...)
│   ├── dashboard/        # Main dashboard
│   ├── quiz/             # Quiz flow (immersive mode)
│   ├── flashcards/       # SM-2 spaced repetition (swipeable deck)
│   ├── exam/[id]/        # Timed exam simulation (immersive mode)
│   ├── past-papers/      # Past exam paper browser
│   ├── study-plan/       # Smart study planner
│   ├── admin/            # Admin dashboard & quality tools
│   ├── settings/         # User settings
│   ├── premium/          # Premium upgrade
│   ├── review/           # Review mistakes
│   ├── solve/            # AI problem solver
│   ├── bookmarks/        # Bookmarked questions
│   ├── chat/             # AI chat assistant
│   ├── problems/         # Curated problems
│   ├── search/           # Unified search page
│   ├── tools/            # APS calc, periodic table, flashcards, ...
│   ├── dev/              # Dev/testing pages (engine, visual, test-links)
│   ├── upload/           # Content upload
│   └── _offline/         # PWA offline fallback page
├── components/
│   ├── ui/               # 45+ shadcn-style primitives
│   ├── quiz/             # Question cards, quiz engine, diagrams
│   │   └── diagrams/     # Konva renderers (geometry, chart, chemistry, graph, circuit, wave, ...)
│   ├── exam/             # Exam engine, timer, results
│   ├── flashcard/        # SwipeableCardDeck, SwipeableCard, QualityPicker
│   ├── dashboard/        # Stats, streaks, challenges, search, focus timer, offline packs
│   ├── gamification/     # XP, levels, achievements, leaderboard
│   ├── visual/           # Diagram/image rendering
│   ├── onboarding/       # 5-step wizard with Three.js
│   ├── navigation/       # TopNav, BottomNav, DesktopSidebar (immersive-aware)
│   ├── shared/           # ImmersiveModeProvider, EmptyState, ErrorBoundary, RoleGate
│   ├── providers/        # React context providers
│   └── ...               # Chat, settings, upload, celebration, social, tools, premium
├── lib/
│   ├── question-engine/  # Question generation, grading, validation (11 types)
│   ├── visual-engine/    # Diagram generation (Konva/Wikimedia/Mermaid)
│   ├── competency-engine/# Bloom's taxonomy competency tracking + learning paths
│   ├── flashcard-engine/ # Unified SR: SM-2/FSRS + limits + leech detection
│   ├── quiz-packs/       # Offline AI quiz pack service + Dexie v18 migration
│   ├── quiz-session/     # Quiz state machine (start, recordAnswer, next)
│   ├── orchestrator/     # Composition root connecting engines + background job queue
│   ├── db/               # Dexie schema (v18, 23 tables), repositories
│   ├── services/         # Analytics, progress, spaced-rep, search, leaderboard, notifications
│   ├── auth/             # Auth context, rate limiting
│   ├── ai/               # AI provider chain (Gemini/Nvidia/Groq), token tracker, prompts
│   ├── shared/           # Backoff, format, rate-limit, time, utils
│   ├── queue/            # Core queue abstraction
│   ├── study-planner/    # Study planning algorithms
│   ├── exam-parser/      # Markdown exam parser
│   ├── exams/            # Marker client, sync
│   ├── premium/          # Premium context/provider
│   ├── server/           # Server actions (quiz, sync, exam, ...)
│   ├── sync/             # Sync handler
│   ├── data/             # Element categories, mock data
│   └── caching-strategy.ts # Tiered read-through cache
├── hooks/                # 35+ React hooks (useQuestionEngine, useVisualEngine, useSwipeDeck, useImmersiveMode...)
├── store/                # Zustand stores (auth, bookmarks, exam-session, flashcards, tools, voice-recorder)
├── types/                # TypeScript type definitions (exam, gamification, upload, ...)
└── curriculum/           # CAPS curriculum data
```

---

## Key Architecture

### Three-Tier Caching

Data flows through a greedy read-through cache:

```
Request → Dexie (IndexedDB, 24h) → Appwrite (Cloud) → AI Generation (fallback)
```

- **Dexie** (23 tables, v18 schema): questions, visuals, quizPacks, packQuestions, flashcard SM-2 state, competencies, wrongAnswers, exam sessions, job queue, sync queue, chat messages, notes, study sessions, etc.
- **Appwrite**: 10+ collections for cross-session persistence
- **AI**: On-demand generation when no cached data exists

### Engines

- **QuestionEngine**: Generates, grades, and validates 11 question types (MCQ, matching, short-answer, long-answer, essay, calculation, diagram, programming, source-based, data-response, mixed)
- **VisualEngine**: Generates diagrams via Konva renderers (STEM) or Wikimedia images (non-STEM)
- **CompetencyEngine**: Bloom's taxonomy tracking (novice→mastered, 4 levels)
- **FlashcardEngine**: Unified SR engine — SM-2/FSRS + daily limits + learning steps + ease-hell + leech detection + settings
- **QuizPackService**: Offline AI quiz pack lifecycle (generate → persist → expire)
- **LearningOrchestrator**: Orchestrates question generation + background job enqueueing

### AI Provider Chain

```
Gemini 2.0 Flash Lite → Nvidia NIM (Llama 3.3 70B) → Groq (Llama 3.3 70B)
```

Each call is subject to per-user and global token budgets (20 gen/day, 100 grade/day, 50 visual/day per user; 2000 total/day global).

### Immersive Mode

Quiz and exam sessions auto-activate full-screen mode. `ImmersiveModeProvider` context hides `TopNav`, `BottomNav`, and `DesktopSidebar`. A floating pill button allows exiting. Layout switches to `max-w-2xl` centered with no decorative panels.

### Swipeable Flashcard Deck

`SwipeableCardDeck` provides a Tinder-style 3-card cascade with drag-to-swipe interaction. Tap to flip, drag with colored overlay feedback, exit animation on swipe. Supports `mode="simple"` (binary) and `mode="sm2"` (full 6-quality SM-2) with `QualityPicker` overlay.

### Offline Quiz Packs

AI-generated question sets downloadable for offline study. `QuizPackService` manages lifecycle: generation (rate-limited via `POST /api/quiz-packs/generate`), Dexie persistence (`quizPacks` + `packQuestions` tables), expiry-based eviction. `<OfflinePackManager>` component on dashboard shows storage progress and pack status badges.

### Auth Flow

```
Anonymous (Appwrite session + Dexie) → Email/Password upgrade (same userId)
```

Offline-first: all data writes to Dexie immediately, syncs to Appwrite via a priority-ordered sync queue with exponential backoff.

---

## Features

**Learning**: AI question generation, past exam papers, timed exam simulation, immersive quiz/exam mode, SM-2 flashcards with swipeable deck, wrong answer journal, review mistakes, competency tracking, step-by-step solutions

**Gamification**: XP/levels (12 levels), 12 achievements, daily challenges, streaks, leaderboard

**Study Tools**: Smart study planner, focus timer (Pomodoro), APS calculator, scientific calculator, periodic table, exam calendar, AI chat, AI solver, notes, bookmarks, study sets, offline quiz packs

**Quality**: Content quality ratings (1-5 stars), question quality dashboard for admins, token budget monitoring

**Platform**: PWA offline, push notifications, light/dark themes, responsive mobile-first, view transitions, E2E tests (Playwright), Storybook component docs

---

## Dependencies

- **Runtime**: `next`, `react`, `react-dom`, `@tanstack/react-query`, `zustand`, `dexie`, `framer-motion`, `katex`, `react-markdown`, `konva`, `mermaid`, `recharts`, `three`
- **UI**: `@hugeicons/react`, `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`, `cmdk`, `vaul`, `input-otp`, `react-day-picker`, `@base-ui/react`
- **Backend**: `appwrite`, `node-appwrite`, `uploadthing`, `web-push`
- **Diagrams**: `react-konva`, `@xyflow/react`
- **Dev**: `typescript`, `biome`, `bun`, `tailwindcss`, `postcss`, `@playwright/test`, `storybook`

---

## Learning More

- `CONTEXT.md` — Architecture context and terminology
- `PRODUCT.md` — Brand and design guidelines
- `AGENTS.md` — Agent coding conventions and session history
- `system-design.md` — Architecture diagram, data model, NFRs
- `app.config.ts` — App configuration constants
