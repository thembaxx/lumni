# Lumni

SA Matric exam prep platform — mobile-first, offline-capable, with anonymous-to-authenticated user progression and AI-generated questions/visuals.

## Language

**Anonymous User**:
A user who has not yet signed up. They have an Appwrite anonymous session and their data lives in Dexie (IndexedDB) + Appwrite (anonymous user context). On sign-up, their anonymous account is upgraded to a full email/password account and data is synced.
_Avoid_: Guest, visitor, unregistered user

**Authenticated User**:
A user who has completed sign-up with email + password. Their Appwrite session persists across visits. They have profile fields (display name, avatar, school, grade, province, subjects) and can sign in via email/password or magic link.

**Top Nav**:
An iOS-style navigation bar at the top of the main content area. Left-aligned screen title, right-aligned sign-in button (unauthenticated) or avatar with dropdown menu (authenticated). Does not appear above the desktop sidebar — only above the main content column.

**Clean Layout**:
A full-screen layout used for auth pages (`/auth/*`). No sidebar, no bottom nav — just a centered form card. Used to keep focus on sign-in/sign-up without app chrome.

**Sync Queue**:
A Dexie-backed queue of offline mutations that are flushed to Appwrite when the user is online. On sign-up, the queue is processed immediately to transfer anonymous data to the authenticated user context.

**Magic Link**:
Appwrite's email-based sign-in flow (`createMagicURLToken`). Available only for sign-in (not sign-up). Sends a one-time link to the user's email; clicking it creates a session. Sign-up always uses email + password to preserve the anonymous user's ID.

**Profile Fields**:
Editable user attributes in Settings > Profile: display name, email (read-only + verify button), password (change form), avatar (UploadThing), and optional fields (school, grade, province, subjects).

## Relationships

- An **Anonymous User** upgrades to an **Authenticated User** on sign-up via `account.updateEmail()` + `account.updatePassword()` (same userId preserved).
- The **Top Nav** reflects user state: unauthenticated → Sign In button, authenticated → Avatar + DropdownMenu.
- **Auth pages** use the **Clean Layout**; all other pages use the app layout (sidebar + bottom nav + top nav).
- **Admin auth** (magic-link/OTP for `/admin/*`) is separate from student auth and unchanged by this system.
- On sign-up, the **Sync Queue** is flushed to move Dexie data to Appwrite.

## Key modules

**QueueCore** (`src/lib/queue/core.ts`):
Generic queue class used by both `SyncQueue` (adapter in `sync-queue.ts`) and `JobQueue` (adapter in `orchestrator/job-queue.ts`). Provides Dexie-backed enqueue/process/retry lifecycle with exponential backoff and concurrency guard. Two adapters — two real adapters = real seam:
- `src/lib/sync-queue.ts` — client-side action queue for offline mutations
- `src/lib/orchestrator/job-queue.ts` — typed background job queue for orchestration side effects

**RateLimiter** (`src/lib/rate-limiter/core.ts`):
Single in-memory rate limiter class used by auth, API, and token-budget subsystems. Three domain-specific configs:
- Auth sign-in (3 attempts/5min), magic link (1/5min)
- API routes (10 req/min)
- AI token budgets (daily per-user + global caps)
See `src/lib/auth/rate-limit.ts`, `src/lib/shared/rate-limit.ts`, `src/lib/ai/token-tracker.ts`.

**QuestionEngine** (`src/lib/question-engine/`):
Single deep module for all question operations — generate, grade, hint, validate, listTypes. Composed directly by route handlers (hint, test health-check) and by `LearningOrchestrator` for orchestrated paths.

**LearningOrchestrator** (`src/lib/orchestrator/`):
Composition root over `QuestionEngine` with exactly two methods: `generateQuestionSet` and `gradeAndTrack`. Adds job-queue side effects (appwrite-sync, analytics, spaced-repetition, progress tracking) but does not duplicate question-generation logic. Pure pass-through methods (`generate`, `grade`, `generateHint`, `validate`, `listTypes`) were removed — callers that need those use `QuestionEngine` directly.

**QuizSession** (`src/lib/quiz-session/`):
Deep module for quiz timer, scoring, navigation, and completion semantics. Hides `setInterval` lifecycle, current-index tracking, correct-answer accumulation, and max-time cutoff behind a seam with exactly three entry points: `start`, `recordAnswer`, and `next`. Questions are passed in by the caller (who owns the fetch via `useQuestionEngine`). Composed by two page components that previously duplicated the same logic (`quiz-view.tsx` and `quiz-engine.tsx`). New quiz variants (timed challenge, topic drill) get all behaviour for free.

## Architecture conventions

- **Stores** live in `src/store/`. `src/lib/store.ts` and `src/lib/stores/` are deprecated — do not create new stores in lib.
- **Shared utilities** (cn, json, id, format, time, network, rate-limit, question-type) live in `src/lib/shared/`. `serializeQuestionType` in `src/lib/shared/question-type.ts` normalizes `QuestionType | QuestionType[]` to a comma-separated string.
- **Competency engine** (`src/lib/competency-engine/`) contains `computeBloomWeight` in `types.ts` — computes score weight based on how far a question's bloom level exceeds the curriculum target.
- **Sync queue** has one processor: `src/lib/sync-queue.ts`. Hooks that duplicate queue processing (`useAutoSync` from hooks, `useEnhancedSync`, `useSyncAll`, `useSyncSingleSubject`) have been removed. Use `src/lib/sync-queue.ts`'s `useSyncQueue` or `useAutoSync` instead.

## Token budget (`src/lib/ai/token-tracker.ts`)

**TokenTracker** enforces daily per-user + global AI call budgets to prevent exhausting free-tier API limits.

| Scope | Limit | Applies to |
|---|---|---|---|
| Per-user (per IP) | 20 generate/day, 100 grade/day, 20 hint/day, 50 visual/day | Each `POST /api/engine/*` route |
| Global | 2,000 total AI calls/day | All routes combined |

- **`/api/engine/*`**, **`/api/solve`**, **`/api/curated-problems`**, **`/api/generate-element-fact`**, **`/api/chat`**, **`/api/chat/image`** all check budget before making AI calls.
- Routes return 429 with `X-Budget-Remaining-User`, `X-Budget-Remaining-Global`, `X-Budget-Reset` headers when budget is exceeded.
- **UX**: Soft block — cached content still accessible, budget resets at midnight.
- **Budget status** also exposed via `GET /api/engine/budget` for UI consumption.

## Local grading

Only 4 of 11 question types use AI for grading:

| Grading method | Question types |
|---|---|
| **Client-side (no AI)** | `multiple-choice` (option comparison), `matching` (pair comparison), `calculation` (numeric ± tolerance), `short-answer` (string match against `acceptableAnswers`, falls back to AI if no exact match) |
| **AI grading** | `long-answer`, `essay`, `diagram`, `programming`, `source-based`, `data-response`, `mixed` |

Short-answer grader (`src/lib/question-engine/processors/graders/short-answer.ts`) tries exact normalized string match before calling AI. This saves ~70% of grade AI calls.

## AI provider chain

- **Primary**: Gemini 2.0 Flash Lite
- **Fallback 1**: Nvidia NIM (meta/llama-3.3-70b-instruct)
- **Fallback 2**: Groq Llama 3.3 70B
- **Removed**: DeepSeek Reasoner (too expensive for free-tier credits)

Provider order in `src/lib/ai/client.ts`: Gemini → Nvidia → Groq.

## Auth rate limiting (`src/lib/auth/rate-limit.ts`)

- **Sign-in**: 3 failed attempts per email per 5-minute window. Resets on successful sign-in. User sees cooldown countdown.
- **Magic link**: 1 link per email per 5 minutes. Prevents email-spam.
- Both are client-side (in-memory Map), enforced in `AuthContext.signIn()` and `AuthContext.signInWithMagicLink()`.

## Appwrite TTL cleanup (`src/lib/db/cleanup.ts`)

- Cached questions older than 30 days are deleted from the Appwrite `questions` collection.
- Runs in batches of 100 documents. Called manually or via a scheduled job.
- Protects the 50k document limit on Appwrite Free tier.

## Onboarding

**Onboarding Trigger**:
Onboarding fires on first visit regardless of auth status (anonymous or authenticated). Once completed (`lumni_onboarding.isComplete === true`), it does not re-trigger. Sign-up later does not re-trigger it.

**Onboarding Wizard** (`src/components/onboarding/onboarding-wizard.tsx`):
5-step flow: Welcome → Subjects → Goals (APS target) → Schedule (daily minutes) → Notifications.

Copy:

| Step | Title | Body | CTA |
|------|-------|------|-----|
| Welcome | Welcome to Lumni | Your AI study buddy for Matric. Quizzes, flashcards, past papers — all in one place. Let's get you set up in under a minute. | Let's go |
| Subjects | Choose Your Subjects | Pick the subjects you're taking this year so we can tailor your practice. | Continue |
| Goals | Set Your Target | What APS are you working towards? Don't worry — this is just a starting point. | Continue |
| Schedule | Your Daily Study Time | How much time can you realistically commit each day? Even 10 minutes makes a difference. | Continue |
| Notifications | Stay on Track | Get gentle reminders so you never miss a study session. | Get Started |

"You can change everything later" reassurance on every step. Skip commits partial data with default values filling gaps.

Visual treatment: Three.js minimal particle field (~200 dots, 0.5 opacity) as fixed full-screen background behind all content, step-reactive (color/tempo changes per step), mouse-responsive. Uses `@react-three/fiber` lazy-loaded via `next/dynamic`. Unique abstract-geometric layered SVG illustration per step rendered as inline React `<svg>` components with 3 layers (background, midground, foreground) that stagger-in via framer-motion. Uses system CSS vars for automatic dark mode.

Transitions: Three.js color shift (800ms) + SVG crossfade (400ms) + staggered text entrance (50ms layer delay). Progress bar fill: 300ms. Initial entrance: no animation (content present immediately). Secondary entrance: 200ms fade. Progress shown via horizontal bars. Data stored in `lumni_onboarding` localStorage key.

Three.js particle color per step: Welcome = `--system-accent` (emerald), Subjects = `--chart-2` (success green), Goals = `--chart-3` (warm amber), Schedule = `--chart-4` (cool blue), Notifications = `--chart-5` (warm red).

**SVG illustrations per step**:

| Step | Foreground | Midground | Background |
|------|-----------|-----------|------------|
| Welcome | Graduation cap (geometric triangles + curves) | Orbiting rings / sparkle dots | Soft gradient wash |
| Subjects | Stacked books (rectilinear blocks, colored spines) | Floating page shapes | Accent halo |
| Goals | Target rings + centered arrow | Trajectory arc lines | Radial gradient |
| Schedule | Clock face with arc segments | Orbiting schedule dots | Circular time rings |
| Notifications | Bell shape with notification dot | Pulse rings expanding outward | Soft wave lines |

**Onboarding Re-entry**:
A "Guided Setup" ListCell in Settings > Profile > Study Goals section allows users to restart the onboarding wizard. Clicking shows a confirmation sheet ("This will update your subjects, study goals, and preferences. Ready to set them up again?" / Cancel + Let's do it). On confirm, resets `lumni_onboarding` data and wizard overlay appears over settings. Wizard requires explicit click — does not auto-show on settings page load.

## Flagged ambiguities

- "Auth" was used to mean both admin auth and student auth — resolved: these are separate systems with different flows and routes. Student auth uses anonymous → email/password conversion; admin auth uses server-side magic-link + OTP.
