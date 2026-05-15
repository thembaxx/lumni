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

**QuestionEngine** (`src/lib/question-engine/`):
Single deep module for all question operations — generate, grade, hint, validate. Used by `LearningOrchestrator` via composition, not duplication.

**LearningOrchestrator** (`src/lib/orchestrator/`):
Thin orchestration layer over `QuestionEngine`. Adds job-queue side effects (appwrite-sync, analytics, spaced-repetition, progress tracking) but does not duplicate question-generation logic. Visual pre-cache was removed — diagrams are generated on-demand only.

## Architecture conventions

- **Stores** live in `src/store/`. `src/lib/store.ts` and `src/lib/stores/` are deprecated — do not create new stores in lib.
- **Shared utilities** (cn, json, id, format, time, network, rate-limit) live in `src/lib/shared/`. Domain-specific utilities (animation, colors, gamification, storage, tts, etc.) remain in `src/lib/utils/`.
- **Sync queue** has one processor: `src/lib/sync-queue.ts`. Hooks that duplicate queue processing (`useAutoSync` from hooks, `useEnhancedSync`, `useSyncAll`, `useSyncSingleSubject`) have been removed. Use `src/lib/sync-queue.ts`'s `useSyncQueue` or `useAutoSync` instead.

## Token budget (`src/lib/ai/token-tracker.ts`)

**TokenTracker** enforces daily per-user + global AI call budgets to prevent exhausting free-tier API limits.

| Scope | Limit | Applies to |
|---|---|---|
| Per-user (per IP) | 20 generate/day, 100 grade/day, 20 hint/day, 50 visual/day | Each `POST /api/engine/*` route |
| Global | 2,000 total AI calls/day | All routes combined |

- **`/api/engine/visual`**, **`/api/solve`**, **`/api/curated-problems`**, **`/api/generate-element-fact`** all check budget before making AI calls.
- Routes return 429 with `X-Budget-Remaining-User`, `X-Budget-Remaining-Global`, `X-Budget-Reset` headers when budget is exceeded.
- **UX**: Soft block — cached content still accessible, budget resets at midnight.

## Local grading

Only 4 of 11 question types use AI for grading:

| Grading method | Question types |
|---|---|
| **Client-side (no AI)** | `multiple-choice` (option comparison), `matching` (pair comparison), `calculation` (numeric ± tolerance), `short-answer` (string match against `acceptableAnswers`, falls back to AI if no exact match) |
| **AI grading** | `long-answer`, `essay`, `diagram`, `programming`, `source-based`, `data-response`, `mixed` |

Short-answer grader (`src/lib/question-engine/processors/graders/short-answer.ts`) tries exact normalized string match before calling AI. This saves ~70% of grade AI calls.

## AI provider chain

- **Primary**: Gemini 2.0 Flash Lite
- **Fallback**: Groq Llama 3.3 70B
- **Removed**: DeepSeek Reasoner (too expensive for free-tier credits)

Provider order in `src/lib/ai/client.ts`: Gemini first, Groq second if Gemini fails. No DeepSeek.

## Auth rate limiting (`src/lib/auth/rate-limit.ts`)

- **Sign-in**: 3 failed attempts per email per 5-minute window. Resets on successful sign-in. User sees cooldown countdown.
- **Magic link**: 1 link per email per 5 minutes. Prevents email-spam.
- Both are client-side (in-memory Map), enforced in `AuthContext.signIn()` and `AuthContext.signInWithMagicLink()`.

## Appwrite TTL cleanup (`src/lib/db/cleanup.ts`)

- Cached questions older than 30 days are deleted from the Appwrite `questions` collection.
- Runs in batches of 100 documents. Called manually or via a scheduled job.
- Protects the 50k document limit on Appwrite Free tier.

## Flagged ambiguities

- "Auth" was used to mean both admin auth and student auth — resolved: these are separate systems with different flows and routes. Student auth uses anonymous → email/password conversion; admin auth uses server-side magic-link + OTP.
