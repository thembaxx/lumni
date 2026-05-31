# Context Manifest — 2026-05-29

## Identity

Lumni is an offline-capable, mobile-first SA Matric exam prep platform using Next.js 16, Appwrite backend, and a Gemini→Nvidia→Groq AI chain for question generation + grading + visual diagram creation. This file is the compressed working memory for AI agents — paste it first to maximize relevance.

## Current Mission

Feature completion and hardening: immersive quiz/exam mode shipped, swipeable Tinder-style flashcard deck shipped, full-screen mode with auto-nav-hiding shipped. Active: GDPR/POPIA legal compliance suite — consent management, cookie banner, account deletion, data export, TOS versioning, cookie policy.

## System at a Glance

```
Browser (React 19 + Next.js 16)
  ├── Dexie IndexedDB   ← L1 cache (questions 24h, visuals 7d, quizPacks 30d)
  │     ├── 24 tables (v24 schema)
  │     ├── QuizPacks + packQuestions (offline packs)
  │     ├── Flashcard SM-2 state + SR settings
  │     ├── Exam sessions (auto-save 30s intervals, 4hr stale expiry)
  │     ├── UserConsent (Appwrite + Dexie dual-write)
  │     └── Sync queue + job queue (QueueCore)
  ├── Zustand stores     ← client state (quiz, exam, sync, search, bookmarks, voice)
  └── React Query        ← server state cache (retry 3, offlineFirst)
        │
Next.js API Routes (~41 groups, most via createRouteHandler factory)
  ├── QuestionEngine     → Gemini → Nvidia NIM → Groq (AI chain)
  ├── VisualEngine       → Konva (STEM) or Wikimedia (non-STEM)
  ├── QuizPackService    → bulk generate → Dexie storage
  ├── LearningOrchestrator → composes Engine + queued side effects
  ├── QueueCore          → Dexie-backed job queue (retry + backoff)
  ├── RateLimiter+TokenTracker → auth limits + AI budget caps
  └── createRouteHandler → generic factory (auth guard + body parse + validation + error wrap)
        │
Appwrite Cloud
  ├── Auth (anonymous → email/password)
  ├── DB (questions, visuals, exam_sessions, exam_papers, exam_dates)
  └── Storage (exam PDFs, avatars)
```

## Key Constraints

1. **Free-tier budgets**: 2000 AI calls/day global; per-user: 20 gen, 100 grade, 20 hint, 50 visual. Soft block (429 with headers), resets midnight.
2. **50k Appwrite doc limit**: Cleanup cron deletes cached questions >30 days (batches of 100).
3. **Offline-first**: All reads hit Dexie first. Write queue flushes via sync-queue.ts on reconnect.
4. **Math delimiters**: `$...$` / `$$...$$` only (no `\(...\)`). KaTeX via `remark-math` + `rehype-katex`.
5. **Anonymous→authenticated**: Same userId preserved via `updateEmail()` + `updatePassword()`. Soft gating at component level, not route level.

## Active Surface

| File/Dir | What I'm touching |
|----------|-------------------|
| `src/types/user-consent.ts` | UserConsent type definition |
| `src/lib/db/schema.ts` | Dexie v24 migration (userConsents table) |
| `src/lib/db/client.ts` | Appwrite COLLECTIONS registry |
| `src/lib/db/ensure-schema.ts` | Appwrite user_consents collection schema |
| `src/lib/services/user-consent-service.ts` | Dual-write consent service |
| `src/lib/consent/consent-context.tsx` | ConsentProvider + useConsent hook |
| `src/app/api/user/consent/route.ts` | Consent CRUD API |
| `src/app/api/user/account/route.ts` | Account deletion API |
| `src/app/api/user/export/route.ts` | Data export API |
| `src/components/consent/cookie-banner.tsx` | Tiered cookie consent banner |
| `src/components/settings/tabs/privacy-tab.tsx` | Privacy settings tab |
| `src/components/consent/tos-banner.tsx` | TOS version change banner |
| `src/app/[locale]/cookie-policy/page.tsx` | Cookie policy page |
| `src/app/[locale]/privacy/page.tsx` | Updated privacy page |
| `src/app/[locale]/terms/page.tsx` | Updated terms page |
| `docs/adr/0009-consent-storage-strategy.md` | ADR for dual-write consent storage |

## Background Knowledge

- **Question types (11)**: multiple-choice, matching, short-answer, long-answer, essay, calculation, diagram, programming, source-based, data-response, mixed. Local grade for 4 types (MC, matching, calculation, short-answer with exact-match fallback), AI grade for 7 types.
- **Flashcard engine**: `src/lib/flashcard-engine/` — single `FlashcardEngine` class wrapping DexieRepository + SM-2/FSRS + daily limits + learning steps + ease-hell + leech + settings. Used via `flashcardEngine` singleton.
- **Swipeable flashcard deck**: `SwipeableCardDeck` (3-card cascade, drag-to-swipe, tap-to-flip), `QualityPicker` (6-level SM-2), `useSwipeDeck` (state machine with undo stack). Replaces old `flashcards-active.tsx` and `sm2-study-session.tsx`.
- **Immersive mode**: `ImmersiveModeProvider` context — auto-hides `TopNav`/`BottomNav`/`DesktopSidebar` when quiz `phase="active"` or exam `phase="active"`. Floating exit pill button. Full-width layout via `max-w-2xl` centered.
- **Route handler factory**: `src/lib/api/create-route-handler.ts` — `createRouteHandler()` with `AuthMode`, `HttpError`, auto auth guard, body parsing, validation, error wrapping, optional rate limiting. 5 routes migrated.
- **AI provider chain**: Gemini 2.0 Flash Lite (primary) → Nvidia NIM meta/llama-3.3-70b-instruct → Groq llama-3.3-70b-versatile. Defined in `src/lib/ai/client.ts`. DeepSeek was removed.
- **Competency levels**: novice→Easy/remember, developing→Medium/understand/apply, proficient→Medium/apply/analyze/evaluate, mastered→Hard/evaluate/create. Mapped in `src/lib/question-engine/competency-mapper.ts`.
- **Caching tiers**: Dexie L1 (fastest, per-device) → Appwrite L2 (cross-session) → AI/Wikimedia L3 (on-demand fallback). Visual pre-caching fires on question generation automatically.
- **Diagrams**: STEM subjects (30) → Konva renderers (geometry, chart, chemistry, graph, force-vector, circuit, wave, motion, node-flow, custom-svg). Non-STEM → Wikimedia Commons images. Fallback: Mermaid.js.
- **Quiz packs**: `src/lib/quiz-packs/` — `QuizPackService`, Dexie v18 (`quizPacks` + `packQuestions` tables), `POST /api/quiz-packs/generate` (rate-limited), `useQuizPacks()` hook, `<OfflinePackManager>` with status badges (generating/ready/expired/failed).
- **Dexie schema**: v24 — 24 tables including `questions`, `visuals`, `examDates`, `questionRatings`, `wrongAnswers`, `flashcards`, `srsettings`, `quizPacks`, `packQuestions`, `jobs`, `syncQueue`, `competencies`, `userConsents`, etc.
- **E2E testing**: Playwright 1.60.0 configured with smoke tests for homepage, quiz, and exam-dates pages.
- **Storybook**: 10.4.1 with `@storybook/nextjs`, config in `main.ts` + `preview.ts`, initial stories for ShareButton and Badge.
- **Exam_dates sync**: Background job type `"appwrite-exam-dates-sync"` with `upsertDocument` handler; `syncExamDatesToAppwrite()` enqueues job; `syncExamDatesDirect()` for immediate writes.
- **Design**: "The Emerald Study Room" — Study Green accent (`oklch(52% 0.18 146)`), Warm Paper neutrals, Outfit 800 / Geist 400 fonts, 20px card radius, 44px touch targets, stacked lightness over shadows.
- **Auth**: Anonymous users auto-created; sign-up upgrades anonymous session. Admin uses separate magic-link + OTP. Rate limits: 3 sign-in/5min, 1 magic link/5min.
- **Onboarding**: 5-step wizard (Welcome→Subjects→Goals→Schedule→Notifications) with Three.js particle background + inline SVG illustrations. Fires once only. Re-enter via Settings > Data tab.

## Glossary — Legal Compliance

- **User Consent**: User's explicit permission for data processing. Stored dual-write in Appwrite (`user_consents` collection) + Dexie (`userConsents` table). Four fields: `analytics`, `marketing`, `dataSharing`, plus `tosVersion`/`privacyVersion` tracking.
- **Analytics Consent**: Permission to collect telemetry (Sentry, Vercel Analytics). Default `false` (strict opt-in).
- **Data Sharing Consent**: Permission to send content to third-party AI providers (Gemini, Nvidia, Groq). When `false`, AI calls are blocked entirely — QuestionEngine and VisualEngine fall back to cached/local-only responses.
- **Marketing Consent**: Permission for promotional communications. Stored but no email system yet.
- **TOS Version**: Semver string in `app.config.ts` (`legal.tosVersion`). User's accepted version stored in `userConsent.tosVersion`. Re-acceptance banner shown on version mismatch.
- **Privacy Version**: Semver string in `app.config.ts` (`legal.privacyVersion`). User's acknowledged version stored in `userConsent.privacyVersion`.
- **Cookie Consent Banner**: Tiered UI (Essential / Analytics / All) on first visit. Opens granular settings modal. Consent persisted before any non-essential cookies set.
- **Privacy Settings Tab**: Dedicated settings tab (slot 5, ShieldCheck icon, between Notifications and Referrals). Contains: consent toggles, TOS version display, data export button, account deletion button.
- **Account Deletion**: `DELETE /api/user/account` — hard-deletes Appwrite user + all data from all collections. No anonymized retention.
- **Data Export**: `GET /api/user/export` — full GDPR-compliant JSON export: profile, quiz history, flashcard data, wrong answers, study plans, parent records, achievements.
- **Cookie Policy**: Dedicated `/cookie-policy` page listing all cookies by category, purpose, and duration. Referenced from cookie banner and privacy page.

## Avoid

- ❌ Do NOT use `\(...\)` or `\[...\]` for math — only `$...$` / `$$...$$`
- ❌ Do NOT create new stores in `src/lib/store.ts` or `src/lib/stores/` — use `src/store/`
- ❌ Do NOT duplicate QuestionEngine logic in LearningOrchestrator — compose, don't duplicate
- ❌ Do NOT use `lottie-react` — already migrated to `@lottiefiles/dotlottie-react`
- ❌ Do NOT add route-level auth guards — anonymous users exist at every route; use component-level `isAnonymous` checks
- ❌ Do NOT use arbitrary pixel values (`w-[200px]`, `text-[13px]`) — use design tokens (`--space-*`, `--fs-*`)
- ❌ Do NOT hardcode shadows (`shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]`) — use `shadow-level-1/2/3`
- ❌ Do NOT use `space-y-*` or manual `mt-* mb-*` pairs — use `gap-*` on the parent container
- ❌ Do NOT write magic z-index numbers (`z-50`, `z-[100]`) — use `--z-*` semantic tokens
- ❌ Do NOT declare `max-w-*` or `px-*` at the page level — wrap pages in `<PageContainer>`

## Memory References

| File | What's inside | Priority |
|------|---------------|----------|
| `repo-index.md` | Full directory tree, entry points, data flow, conventions, recent changes, TODOs | Reference |
| `prompt-catalog.md` | Catalog of all discoverable prompt contexts (agents, specs, plans) | Reference |
| `memory.md` | All decisions (ADR-lite), patterns, failures, open questions, resources | High |
| `system-design.md` | Mermaid architecture diagram, data model ERD, component dictionary, API list, NFRs, roadmap | High |
| `AGENTS.md` | Engine architecture, math conventions, session 1-14 history, AI provider chain | High |
| `CONTEXT.md` | Domain glossary — prepend to any agent prompt | High |
| `DESIGN.md` | "The Emerald Study Room" design system (342 lines) | Medium |
| `TODO.md` | Outstanding tasks: custom domain, test coverage, exam dates items | Medium |
