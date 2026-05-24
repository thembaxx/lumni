# Repo Index — Lumni

**Generated:** 2026-05-24  
**Last synced with:** HEAD~0 (session-8)

---

## Tree (Depth 4, Grouped by Domain)

```
lumni/
├── src/
│   ├── app/                         # Next.js App Router (pages + API)
│   │   ├── (pages)/                 # dashboard, quiz, exam, flashcards, chat, settings, admin, etc.
│   │   ├── api/                     # Route handlers (~30 groups)
│   │   │   ├── engine/              # QuestionEngine (generate, grade, hint, visual, test)
│   │   │   ├── auth/                # Auth (callback, verify, rate-limit, forgot-password)
│   │   │   ├── admin/               # Admin CRUD (users, content, exams, notifications, analytics)
│   │   │   ├── exam-papers/         # Past paper management
│   │   │   ├── exam-sessions/       # Exam session persistence
│   │   │   ├── premium/             # Premium checkout/cancel/verify
│   │   │   ├── sync/                # Offline sync endpoint
│   │   │   └── ...                  # chat, jobs, leaderboard, push, referral, seed, etc.
│   │   ├── layout.tsx               # Root layout
│   │   ├── error.tsx                # Error boundary
│   │   └── globals.css              # Tailwind v4 globals
│   ├── components/
│   │   ├── ui/                      # shadcn/ui primitives + custom (charts, headers, inputs)
│   │   ├── quiz/                    # Question cards, diagrams (Konva), hooks, parts
│   │   │   └── diagrams/            # geometry, chart, chemistry, graph Konva renderers
│   │   ├── dashboard/               # Analytics, layout, navigation, practice, search, drawers
│   │   ├── exam/                    # Exam session UI, results, paper viewer
│   │   ├── admin/                   # Admin panels (users, analytics, content, notifications, etc.)
│   │   ├── auth/                    # Sign-in, sign-up forms
│   │   ├── settings/tabs/           # Profile, preferences, data settings
│   │   ├── tools/                   # core/, communication/, math/, science/, scheduling/
│   │   ├── study-planner/           # Study plan generation + overview
│   │   ├── visual/                  # VisualContent, DiagramRenderer
│   │   ├── onboarding/              # 5-step wizard (Welcome/Subjects/Goals/Schedule/Notifications)
│   │   ├── gamification/            # Achievements, leaderboard, celebrations
│   │   ├── social/                  # Leaderboard card, social features
│   │   ├── providers/               # React context providers (premium, auth, theme)
│   │   └── ...                      # navigation, layout, loading, home, celebration, chat, etc.
│   ├── lib/
│   │   ├── ai/                      # AI client chain (Gemini -> Nvidia -> Groq), providers
│   │   ├── question-engine/         # Question generation, validation, grading, processors
│   │   │   ├── processors/          # Per-type question processors (11 types)
│   │   │   │   └── graders/         # AI-powered graders for constructed-response types
│   │   │   └── validators/          # Per-type validators (score 0-100)
│   │   ├── visual-engine/           # Diagram generation (Konva renders, Wikimedia fallback)
│   │   ├── competency-engine/       # Competency tracking, PathEngine, Bloom's taxonomy
│   │   ├── orchestrator/            # LearningOrchestrator (orchestrates engine + queue)
│   │   ├── queue/                   # QueueCore (persistent job queue with retry)
│   │   ├── db/                      # DB layer
│   │   │   ├── repositories/        # Repository pattern (typed DB access)
│   │   │   └── exams/               # Exam DB (sql.js / SQLite)
│   │   ├── auth/                    # Auth utilities, session management
│   │   ├── sync/                    # Offline sync (flushOfflineData, conflict resolution)
│   │   ├── server/                  # Server actions (exam-paper-actions, quiz-actions)
│   │   ├── services/                # Business services barrel (all 10 services + ServiceResult<T>)
│   │   ├── study-planner/           # StudyPlannerService (algorithmic scheduling)
│   │   ├── rate-limiter/            # Token budget, rate limiting
│   │   ├── quiz-session/            # Quiz session state machine
│   │   ├── premium/                 # Premium gating logic
│   │   ├── referral/                # Referral program
│   │   ├── shared/                  # Shared utilities (backoff, etc.)
│   │   ├── flashcard-engine/        # Unified SR: FlashcardEngine, types, barrel
│   │   ├── api/                     # createRouteHandler generic factory (HttpError, AuthMode)
│   │   ├── spaced-repetition/       # Legacy re-export barrel (delegates to flashcard-engine)
│   │   ├── flashcard-repository/    # Legacy re-export barrel (delegates to flashcard-engine)
│   │   └── utils/                   # General utilities (flashcard-import-export, colors, etc.)
│   ├── hooks/                       # React hooks (use-question-engine, use-visual-engine, use-premium, etc.)
│   ├── store/                       # Zustand stores (quiz, exam, sync, search, etc.)
│   ├── types/                       # TypeScript types
│   ├── data/                        # Static data (subjects, exams)
│   ├── curriculum/                  # Curriculum definitions / index
│   └── assets/                      # Animations (Lottie, etc.)
├── docs/
│   ├── adr/                         # ADR: 0001-question-engine-composition
│   ├── agents/                      # Agent docs (issue-tracker, triage-labels, domain)
│   ├── superpowers/specs/           # Feature specs (May 2026)
│   ├── roadmap.md                   # Product roadmap
│   └── visual-engine-plan.md        # Visual Engine architecture doc
├── .agents/skills/impeccable/       # UI/UX design audit skill (34 ref files)
├── .kilo/plans/                     # Agent implementation plans (temp)
├── .jules/sentinel.md               # Security hardening notes
├── CONTEXT.md                       # Domain glossary (for AI agents)
├── AGENTS.md                        # Agent instructions (math, engines, session history)
├── MEMORY.md                        # Session memory (exam dates tracker)
├── DESIGN.md                        # "The Emerald Study Room" design system
├── SPEC.md                          # National Exam Dates Tracker spec
├── PRODUCT.md                       # Product context (matric students in SA)
├── implementation-notes.md           # Implementation records (anonymous gating, exam dates tracker)
├── TODO.md                          # Outstanding tasks
└── *config files                    # next.config.ts, biome.json, tsconfig.json, etc.
```

---

## Entry Points

| What | Path | Purpose |
|------|------|---------|
| **Dashboard** | `src/app/page.tsx` | Main user landing page after login |
| **API routes** | `src/app/api/` | ~30 route groups: engine, auth, exams, sync, admin, chat, etc. |
| **Agent entry** | `CONTEXT.md` | Domain glossary prepended to AI agent prompts |
| **Agent instructions** | `AGENTS.md` | Math conventions, engine architecture, session history |
| **Web vitals** | `src/app/layout.tsx` | `web-vitals` integration |
| **Offline page** | `src/app/_offline/` | Offline fallback UI |
| **Sentry config** | `sentry.client.config.ts` | Client-side error tracking |
| **Service worker** | `public/sw.js` (implied) | PWA service worker |
| **Python server** | `server.py` | AI/utility server (runs alongside Next.js) |
| **DB seed** | `src/lib/seed.ts` | Seeds Appwrite + Dexie with initial data |

---

## Data Flow

1. **Question Generation**: User selects subject/topic -> `POST /api/engine/generate` -> `QuestionEngine` builds prompt -> AI provider chain (Gemini -> Nvidia NIM -> Groq) -> response parsed into `Question` -> validated per-type (score 0-100) -> cached Dexie (24h) -> Appwrite (cross-session) -> returned via `useQuestionEngine` hook. Background visual generation fires automatically for each new question.

2. **Quiz / Exam Session**: User answers question -> `QuestionCardFeedback` captures response -> `QuizSession` state machine -> local grade (selected-response types) or AI grade (constructed-response: long-answer, essay, diagram, programming, source-based, data-response, mixed) -> `trackQuestionResult()` updates competency engine + wrong-answer journal -> SM-2 flashcard review for existing cards -> analytics-sync background job enqueued.

3. **Offline Sync**: User actions while offline -> queued in `SyncQueue` (Dexie) -> `flushOfflineData()` on reconnect -> Appwrite server reconciles -> confirmation stored locally. Supports flashcards, wrong answers, chat messages, and exam sessions.

4. **Study Planner**: `useStudyPlanner()` -> `StudyPlannerService.generateStudyPlan()` reads Dexie competencies -> inverse-competency-weighted round-robin scheduling -> `TopicPlan[]` converted to `StudySession[]` -> persisted to localStorage -> rendered via `StudyPlanOverview`.

---

## Dependencies (Key)

### Runtime
| Lib | Why |
|-----|-----|
| **Next.js 16.2.6** | React framework, App Router, RSC, API routes |
| **React 19.2** | UI framework (latest stable) |
| **Appwrite / node-appwrite** | Backend: auth, database, storage, realtime |
| **Dexie + dexie-react-hooks** | IndexedDB wrapper: offline-first caching layer |
| **Zustand** | Lightweight client state (no boilerplate) |
| **TanStack React Query** | Server state caching + background refetch |
| **Framer Motion** | Animations (enter/exit, layout, micro-interactions) |
| **Sentry** | Error tracking (client, server, edge) |
| **react-konva + konva** | Canvas-based AI diagram rendering |
| **Three.js** | 3D particle effects (onboarding) |
| **sql.js** | SQLite in browser (exam paper DB) |
| **recharts** | Dashboard charts (analytics, trends) |
| **KaTeX / rehype-katex / remark-math** | Math rendering (STEM subjects) |
| **Biome** | Linting + formatting (replaces ESLint + Prettier) |
| **shadcn/ui** | Component primitives (built on Radix) |
| **uploadthing** | File upload infrastructure |
| **Mermaid / @xyflow/react** | Diagram rendering (flowcharts, node graphs) |

### Data
- **Tailwind CSS v4** — styling (PostCSS, `@tailwindcss/postcss`)
- **TypeScript 6.0.3** — static typing
- **Husky** — pre-commit hooks (Bun type-check)
- **patch-package** — patches for next 16.2.6

---

## Conventions

| Area | Convention |
|------|-----------|
| **DB access** | Repository pattern in `src/lib/db/repositories/` — all DB reads/writes go through typed repositories |
| **State** | Zustand stores in `src/store/` |
| **Shared utilities** | `src/lib/shared/` |
| **Competency** | `src/lib/competency-engine/` |
| **AI providers** | Chain: Gemini 2.0 Flash Lite (primary) -> Nvidia NIM -> Groq (last resort); defined in `src/lib/ai/client.ts` |
| **Caching** | Dexie (L1, fastest) -> Appwrite (L2, cross-session) -> AI generation / Wikimedia (L3, on-demand fallback) |
| **Grading** | Local for 4 types (selected-response, matching, short-answer, calculation); AI for 7 types (long-answer, essay, diagram, programming, source-based, data-response, mixed) |
| **Math delimiters** | `$...$` inline, `$$...$$` display; no `\(...\)` |
| **Question types** | 11 types: selected-response (multiple-choice, matching), constructed-response (short-answer, long-answer, essay), STEM (calculation, diagram, programming), contextual (source-based, data-response, mixed) |
| **Visual classification** | STEM (30 subjects) -> AI-generated Konva diagrams; Non-STEM -> Wikimedia Commons image search |
| **Competency mapping** | Novice -> remember/understand/Easy; Developing -> understand/apply/Medium; Proficient -> apply/analyze/evaluate/Medium; Mastered -> evaluate/create/Hard |
| **Token budgets** | 20 gen/day/user, 100 grade/day/user, 20 hint/day/user, 50 visual/day/user; 2000 global AI calls/day |
| **Auth rate limits** | 3 sign-in attempts/5min, 1 magic link/5min |
| **Appwrite TTL** | 30-day cache expiry (cleanup cron) |
| **Onboarding** | 5-step wizard (Welcome/Subjects/Goals/Schedule/Notifications) |
| **Error handling** | `AppError` and `GlobalError` components; standardized in May 22 refactor |
| **Pre-commit** | `bun check` (Biome) + `bun tsc` (Bun for type checking) |

---

## Recent Changes (May 20-24, 2026)

| Commit | When | What |
|--------|------|------|
| `bf36441` | May 22 21:47 | Updated package.json deps + formatting |
| `0f9386b` | May 22 21:34 | Feature X (performance/user experience) |
| `a969feb` | May 22 21:33 | Postinstall script for patch-package + next 16.2.6 patch |
| `5a9b539` | May 22 20:34 | Fixed responsive height class names + gradient bg in GlobalError |
| `d6aa525` | May 22 20:33 | Standardized error handling (AppError/GlobalError) |
| `c22416e` | May 22 19:51 | Added exam slots for May/June 2026 + related services |
| `56abca0` | May 22 18:58 | Local data notice for anonymous users + anonymous state UI |
| `f05abc9` | May 22 18:24 | Enhanced date formatting in admin ContentClient/UsersClient; refactored auth usage |
| `6330292` | May 22 17:35 | Replaced tsc with Bun for pre-commit type checking |
| `e20058c` | May 20 23:46 | Study reminders + notifications + Bloom's Taxonomy widget + flashcard sync |
| `788bb8f` | May 20 23:34 | Exam session resume + auto-save + PDF caching |
| `b9efab4` | May 20 23:27 | Sync for flashcards, wrong answers, chat messages |
| `8a53881` | May 20 23:20 | Sentry config + GamificationCelebration + ExamsBrowse |

### Session 8 — Architecture consolidation (May 24, 2026)
- **Flashcard engine**: Created `src/lib/flashcard-engine/` — unified `FlashcardEngine` class wrapping DexieRepository + SM-2/FSRS + daily limits + learning steps + ease-hell + leech + settings. Old barrels re-export for backward compat.
- **Route handler factory**: `src/lib/api/create-route-handler.ts` — generic `createRouteHandler()` with `AuthMode`, `HttpError`, auto auth guard, body parsing, Zod validation, error wrapping. 5 routes migrated: analytics/comparative, analytics/trends, admin/exams, exam-sessions, jobs/process.
- **Services barrel**: `src/lib/services/index.ts` now exports all 10 services + `ServiceResult<T>` + `success()`/`failure()` helpers.
- **Tools reorganization**: `src/components/tools/` split into `core/`, `communication/`, `math/`, `science/`, `scheduling/` — 11 components moved, all import chains updated.

---

## TODOs / FIXMEs

| File | Line | Severity | Content |
|------|------|----------|---------|
| `src/components/study/study-topic-card.tsx` | 143 | LOW | `TODO: Implement word-index tracking for MarkdownRenderer highlighting` |

No `FIXME`, `HACK`, or `XXX` annotations found anywhere in `src/`. Codebase is clean.

---

## Architecture Debt (Low)

- No dedicated `prompts/` or `memory/` directories — prompt engineering is scattered across `AGENTS.md`, `CONTEXT.md`, agent skill files, and `.kilo/plans/`
- AGENTS.md doubles as both dev instructions AND session history — consider splitting
- `MEMORY.md` only tracks exam dates; no centralized architecture decision log beyond `docs/adr/` (only 1 ADR exists)
- `.kilo/plans/` contain disposable agent plans that should be cleaned up after execution
