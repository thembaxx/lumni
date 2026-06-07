# Context Manifest — 2026-06-07

## Identity

Lumni is an offline-capable, mobile-first SA Matric exam prep platform using Next.js 16, Appwrite backend, and a Gemini→Nvidia→Groq AI chain for question generation + grading + visual diagram creation. The solve and quiz-generation flows are web-grounded via TinyFish (RAG injection of CAPS/DBE sources). This file is the compressed working memory for AI agents — paste it first to maximize relevance.

## Current Mission

All Batch 1-6 superpowers are implemented. Data consolidation (DataAccess Phase 1-4) complete — all 38+ tables accessed via typed interface. Knowledge graph, study guides, live sessions, and share/public routes shipped. Theme chrome and navigation sidebar redesigned. Hardening sweep (a11y, i18n, knip, visual tests) done. 1258 tests pass, 0 fail. Next: pick from TODO.md or new features.

## System at a Glance

```
Browser (React 19 + Next.js 16)
  ├── Dexie IndexedDB   ← L1 cache (v32, 38+ tables, 24h-30d expiry)
  │     ├── Questions, Visuals, QuizPacks, StudyGuides, KnowledgeGraph
  │     ├── tinyfishCache + tinyfishUsage (RAG cache + daily counter)
  │     ├── Flashcard SM-2 state + SR settings + sync state
  │     ├── Exam sessions + retention recurrence + shared questions
  │     ├── UserConsent (Appwrite + Dexie dual-write)
  │     ├── Analytics events, teacher observations, assignment messages
  │     ├── Study plans, onboarding state, flashcard sync budget
  │     ├── Knowledge graph, study guides (7d/30d TTL)
  │     └── Sync queue + job queue (QueueCore)
  ├── Zustand stores     ← client state (quiz, exam, sync, search, bookmarks, voice)
  └── React Query        ← server state cache (retry 3, offlineFirst)
        │
Next.js API Routes (~50 groups, most via createRouteHandler factory)
  ├── QuestionEngine     → Gemini → Nvidia NIM → Groq (AI chain)
  │     └── PromptManager injects TinyFish <reference_material> XML + sourceRefs appendix
  │     └── source-mapper: attachWebSources hybrid AI-cite + fallback
  ├── VisualEngine       → Konva (STEM) or Wikimedia (non-STEM)
  ├── KnowledgeGraph     → AI topic dependency graphs (Dexie 7d cache)
  ├── StudyGuide         → AI structured guides (Dexie 30d cache)
  ├── QuizPackService    → bulk generate → Dexie storage
  ├── LearningOrchestrator → composes Engine + queued side effects
  ├── TinyFish RAG       → searchWithRAG (3-source) + getSourceForQuestion (1-source)
  │     ├── Dexie v25 cache (tinyfishCache, 14d TTL)
  │     ├── In-flight dedup (in-memory Map<key, Promise>)
  │     ├── 24-subject allowlist + per-user daily limit
  │     ├── 3s Promise.race timeout + try/catch fail-open
  │     ├── Consent gated via getDataSharingConsent()
  │     ├── Per-question: source-mapper validates AI-cited sourceRefs, falls back to all 3 batch sources
  │     └── Surfaces on 4 UIs: solver-result-view, quiz-result, quiz-results-card, question-card-feedback
  ├── LiveSessionService → real-time study sessions via Appwrite (15s polling)
  ├── ShareService       → public shares, ghost links, assignment sharing
  ├── RetentionService   → wrong-answer re-encounter, next-best-action
  ├── QueueCore          → Dexie-backed job queue (retry + backoff)
  ├── RateLimiter+TokenTracker → auth limits + AI budget caps (MapStore or RedisStore)
  ├── UniformAIAdapter   → factory for pluggable provider normalizers
  └── createRouteHandler → generic factory (auth guard + body parse + validation + error wrap)
        │
Appwrite Cloud
  ├── Auth (anonymous → email/password)
  ├── DB (questions, visuals, exam_sessions, exam_papers, exam_dates, live_sessions, etc.)
  └── Storage (exam PDFs, avatars)
```

## Key Constraints

1. **Free-tier budgets**: 2000 AI calls/day global; per-user: 20 gen, 100 grade, 20 hint, 50 visual. Soft block (429 with headers), resets midnight.
2. **50k Appwrite doc limit**: Cleanup cron deletes cached questions >30 days (batches of 100).
3. **Offline-first**: All reads hit Dexie first. Write queue flushes via sync-queue.ts on reconnect. DataAccess seam abstracts all DB access.
4. **Math delimiters**: `$...$` / `$$...$$` only (no `\(...\)`). KaTeX via `remark-math` + `rehype-katex`.
5. **Anonymous→authenticated**: Same userId preserved via `updateEmail()` + `updatePassword()`. Soft gating at component level, not route level.

## Active Surface

| File/Dir | What I'm touching |
|----------|-------------------|
| `src/lib/db/data-access.ts` | DataAccess interface (38+ tables) |
| `src/lib/db/dexie-data-access.ts` | Production implementation |
| `src/lib/db/in-memory-data-access.ts` | Test implementation |
| `src/lib/db/schema.ts` | Dexie v32 schema |
| `src/lib/knowledge-graph/` | AI topic dependency graphs |
| `src/lib/study-guide/` | AI study guide generator |
| `src/lib/quiz/` | High-level quiz hook (useQuiz) |
| `src/lib/ai/uniform-adapter.ts` | Pluggable AI provider adapter |
| `src/lib/rate-limiter/redis-store.ts` | Redis-backed rate limiting |
| `src/lib/caching-strategy/` | Generic multi-tier caching |
| `src/lib/share/share-service.ts` | Public share + ghost links |
| `src/lib/study-groups/live-session-service.ts` | Real-time study sessions |
| `src/lib/retention-loop/` | Wrong-answer re-encounter + next-action |
| `src/lib/flashcard-engine/deck-types.ts` | Flashcard deck interfaces |
| `src/lib/navigation/config.ts` | Sidebar navigation config |
| `src/components/theme/theme-provider.tsx` | Dynamic theme-color sync |
| `docs/superpowers/specs/2026-06-07-*.md` | Latest design specs |

## Background Knowledge

- **Question types (11)**: multiple-choice, matching, short-answer, long-answer, essay, calculation, diagram, programming, source-based, data-response, mixed. Local grade for 4 types, AI grade for 7 types.
- **Flashcard engine**: `src/lib/flashcard-engine/` — single `FlashcardEngine` class wrapping DataAccess + SM-2/FSRS + daily limits + learning steps + ease-hell + leech + settings.
- **Swipeable flashcard deck**: `SwipeableCardDeck` (3-card cascade, drag-to-swipe, tap-to-flip), `QualityPicker` (6-level SM-2), `useSwipeDeck` (state machine with undo stack).
- **Immersive mode**: `ImmersiveModeProvider` context — auto-hides nav during active quiz/exam. Floating exit pill.
- **Route handler factory**: `src/lib/api/create-route-handler.ts` — `createRouteHandler()` with `AuthMode`, `HttpError`, auto auth guard, body parsing, validation, error wrapping, optional rate limiting.
- **AI provider chain**: Gemini 2.0 Flash Lite (primary) → Nvidia NIM meta/llama-3.3-70b-instruct → Groq llama-3.3-70b-versatile. Defined in `src/lib/ai/client.ts`. `uniform-adapter.ts` provides pluggable normalizers.
- **Competency levels**: novice→Easy/remember, developing→Medium/understand/apply, proficient→Medium/apply/analyze/evaluate, mastered→Hard/evaluate/create. Mapped in `src/lib/question-engine/competency-mapper.ts`. Supports per-paper (P1/P2) split.
- **Caching tiers**: Dexie L1 (fastest, per-device) → Appwrite L2 (cross-session) → AI/Wikimedia L3 (on-demand fallback). New `CachingStrategy` module for generic multi-tier caching.
- **Diagrams**: STEM subjects (30) → Konva renderers (geometry, chart, chemistry, graph, force-vector, circuit, wave, motion, node-flow, custom-svg). Non-STEM → Wikimedia. Fallback: Mermaid.
- **Knowledge graph**: `src/lib/knowledge-graph/` — AI generates `{ nodes, edges }` topic graphs. Cached 7d in Dexie v29. Two UIs: dashboard `LearningMapCard` + per-question `TopicGraph`.
- **Study guides**: `src/lib/study-guide/` — AI generates structured guides with sections + summary. Cached 30d in Dexie v32. `/study-guide` page with subject/topic input.
- **Live sessions**: `useLiveSession()` hook with 15s polling via React Query. Appwrite-backed with `LiveSession` + `LiveSessionParticipant` collections.
- **Dexie schema**: v32 — 38+ tables. v27 added `analyticsEvents`. v28 added `sharedQuestions`. v29 added `knowledgeGraph`. v30 added `teacherObservations` + `assignmentMessages`. v31 added `studyPlans` + `onboardingState` + `srDailyBudget` + `flashcardSyncState`. v32 added `studyGuides`.
- **DataAccess seam**: All 38+ tables accessed via typed `DataAccess` interface. Two implementations: `DexieDataAccess` (production) and `InMemoryDataAccess` (tests). `seed()` for test setup. See ADR-0011.
- **E2E testing**: Playwright 1.60.0 — smoke tests + visual regression tests (homepage sections).
- **Storybook**: 10.4.1 with 10 stories (Button, Card, Switch, Checkbox, Progress, Skeleton, Avatar, Separator, ShareButton, Badge).
- **TinyFish RAG**: `src/lib/tinyfish/` — 7 modules. Injects CAPS/DBE sources into solve + quiz prompts. XML `<reference_material>` block + `buildPromptInstruction()` framing. Dexie v25 cache (14d TTL), in-flight dedup, 24-subject allowlist, 20 fetches/day/user, 3s timeout fail-open. Consent-gated. DI pattern (`deps?` arg). `getLastRagContext()` surfaces batch RAG context. Per-question `Question.webSources` via hybrid AI-cite + fallback. See ADR-0010.
- **Exam_dates sync**: Background job `"appwrite-exam-dates-sync"` with `upsertDocument` handler.
- **Design**: "The Emerald Study Room" — Study Green accent (`oklch(52% 0.18 146)`), Warm Paper neutrals, Outfit 800 / Geist 400 fonts, 20px card radius, 44px touch targets, stacked lightness over shadows.
- **Auth**: Anonymous users auto-created; sign-up upgrades anonymous session. Admin uses separate magic-link + OTP. Rate limits: 3 sign-in/5min, 1 magic link/5min.
- **Onboarding**: 5-step wizard (Welcome→Subjects→Goals→Schedule→Notifications). Migrated to Dexie v31.
- **Centralized logger**: `src/lib/shared/logger.ts` — `logError()` with context tag. Dev: console.error. Prod: Sentry.captureException() via withScope().
- **Uniform AI adapter**: `createUniformProvider()` factory with `openaiNormalizer`/`geminiNormalizer` request normalizers and response parsers. Used by `src/lib/ai/client.ts`.
- **Navigation sidebar**: Categorized (Study, Practice, Tools, Social, Account). Page search/filter input. `SidebarStateProvider` context. Accent-tinted frosted glass. Config in `src/lib/navigation/config.ts`.
- **Theme chrome**: Dynamic `theme-color` meta tag synced on theme switch. SSR viewport with light/dark media query values. See `docs/superpowers/specs/2026-06-07-theme-chrome-takeover-design.md`.
- **Rate limiting**: `MapStore` (in-memory for auth/AI) + `RedisStore` (Upstash for multi-instance). See `src/lib/rate-limiter/` and `redis-store.ts`.
- **Item-bank pruning**: Job type `"prune-stale-questions"` enqueued from `/api/engine/generate`. `pruned?: boolean` field on `Question`.

## Glossary — Theming

- **App chrome**: The app's own navigation shell — TopNav, BottomNav, SidebarNav. Currently uses accent-tinted frosted glass (`--system-accent-alpha-10` overlay on `bg-system-background/80 backdrop-blur-xl`).
- **Browser chrome**: The browser's native UI surrounding the web page — tab strip, URL bar, scrollbar, window buttons. Controlled via `theme-color` meta tag, `color-scheme` CSS property.
- **Accent-tinted glass**: A `--system-accent-alpha-10` overlay on frosted glass surfaces that gives the nav bars a subtle Emerald Green tint while maintaining the frosted backdrop-filter effect.
- **`theme-color`**: The `<meta name="theme-color">` tag that controls the browser chrome's accent color. Must dynamically update when the user switches light/dark theme.
- **`window-controls-overlay`**: A PWA `display_override` mode for rendering behind window control buttons on desktop installed PWAs.

## Glossary — Legal Compliance

- **User Consent**: Dual-write in Appwrite + Dexie. Four fields: `analytics`, `marketing`, `dataSharing`, plus `tosVersion`/`privacyVersion` tracking.
- **Analytics Consent**: Permission to collect telemetry. Default `false` (strict opt-in).
- **Data Sharing Consent**: Permission to send content to third-party AI providers. When `false`, AI calls blocked entirely.
- **Marketing Consent**: Permission for promotional communications. Stored but no email system yet.
- **TOS/Privacy Version**: Semver strings in `app.config.ts`. Re-acceptance banner on version mismatch.
- **Cookie Consent Banner**: Tiered UI (Essential / Analytics / All). Settings modal.
- **Account Deletion**: `DELETE /api/user/account` — hard-deletes Appwrite user + all data.
- **Data Export**: `GET /api/user/export` — full GDPR-compliant JSON export.

## Avoid

- ❌ Do NOT use `\(...\)` or `\[...\]` for math — only `$...$` / `$$...$$`
- ❌ Do NOT create new stores in `src/lib/store.ts` or `src/lib/stores/` — use `src/store/`
- ❌ Do NOT duplicate QuestionEngine logic in LearningOrchestrator — compose, don't duplicate
- ❌ Do NOT use `lottie-react` — already migrated to `@lottiefiles/dotlottie-react`
- ❌ Do NOT add route-level auth guards — anonymous users exist at every route; use component-level `isAnonymous` checks
- ❌ Do NOT use arbitrary pixel values — use design tokens (`--space-*`, `--fs-*`)
- ❌ Do NOT hardcode shadows — use `shadow-level-1/2/3`
- ❌ Do NOT use `space-y-*` or manual `mt-* mb-*` pairs — use `gap-*` on the parent container
- ❌ Do NOT write magic z-index numbers — use `--z-*` semantic tokens
- ❌ Do NOT declare `max-w-*` or `px-*` at the page level — wrap pages in `<PageContainer>`
- ❌ Do NOT bypass DataAccess interface — never use `offlineDB` directly; always go through `DexieDataAccess` or `InMemoryDataAccess`
- ❌ Do NOT use `Bun.mock.module` for tinyfish or cross-file mocks — use DI (`deps` arg) or shared mock modules
- ❌ Do NOT use `querySelector`/`querySelectorAll` in tests — happy-dom throws SyntaxError; use `getElementsByTagName`/`getElementsByClassName` + `container.textContent` regex

## Memory References

| File | What's inside | Priority |
|------|---------------|----------|
| `repo-index.md` | Full directory tree, entry points, data flow, conventions, recent changes, TODOs | Reference |
| `prompt-catalog.md` | Catalog of all discoverable prompt contexts | Reference |
| `memory.md` | All decisions (ADR-lite), patterns, failures, open questions, resources | High |
| `system-design.md` | Mermaid architecture diagram, data model ERD, component dictionary, API list, NFRs, roadmap | High |
| `AGENTS.md` | Engine architecture, math conventions, session 1-32 history, Dexie schema progression | High |
| `CONTEXT.md` | Domain glossary — prepend to any agent prompt | High |
| `DESIGN.md` | "The Emerald Study Room" design system (342 lines) | Medium |
| `TODO.md` | Outstanding tasks and completed work log | Medium |
