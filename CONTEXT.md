# Context Manifest — 2026-06-21

## Identity

Lumni is an offline-capable, mobile-first SA Matric exam prep platform using Next.js 16, Appwrite backend, and a Gemini→Nvidia→Groq AI chain for question generation + grading + visual diagram creation. The solve and quiz-generation flows are web-grounded via TinyFish (RAG injection of CAPS/DBE sources). This file is the compressed working memory for AI agents — paste it first to maximize relevance.

## Current Mission

All Batch 1-6 superpowers implemented. DataAccess Phase 1-4 complete + pagination support. DataAccess split into 10 domain sub-interfaces (33 accessors, 11 dead removed). 19 consumers narrowed from `DataAccess` to sub-interfaces. Teacher localStorage bugs fixed (ghost links→Appwrite, observations→Dexie, messages→Dexie). Weekly digest cron endpoint, daily digest notifications, teacher report fixed. Quality dashboard rating chart. 18 Storybook stories. **React Doctor score 100/100** (194 issues fixed). Biome lint zero. **1326 tests pass, 0 failures.**

**Premium gating removed (June 2026)** — all features are free. ContentLock wrappers purged from analytics, study-plan, scheduler, visual-content, offline-packs. Visual engine always fetches (no premium check). Support page shows priority to all. Auth-required standalone pages (problems) show login banner for unauthenticated users. View transitions consolidated in `useNavigationDirection` — removed `experimental.viewTransition: true` from next.config to eliminate double-wrap conflict.

**Architectural deepening (June 2026)** — 8 candidates implemented:

- **Session 37**: AI provider singleton collapsed (AIClient threaded through processors), lastRagContext sidecar replaced with structured `GenerateResult`, `CachedAIGenerator<T>` generic, analytics domain logic extracted into `AnalyticsService`, dead code removed (~200 lines), retention DI leak fixed. 6 service extractions: `DigestService`, `PlatformAnalyticsService`, `ExamDownloadService`, `ExamUploadService`, `SubmissionService`, `AuthRateLimitService`. ADR-0012 documented.
- **Session 38**: QuizResultProcessor (discriminated union, 4 sources), enrichment pipeline (3 ports: CurriculumSource/EmbeddingSource/PastPaperSource), TinyFish barrel separation (withRagGuards HOF), PushDeliveryService (lazy VAPID, consolidated web-push), StudyPlannerService (state/sync/mutations, event emission), GamificationService (state/persist/sync, mutation results), DataAccess bypass sealing (5 files), flashcard/exam/dashboard consumers updated.
- **Session 39**: Hook factory abstractions (`createApiQuery` + `createInvalidatingMutation`), 8 hooks refactored. Large component extractions: `smart-scheduler.tsx` (405→167L), `QuestionCardInput.tsx` (440→224L), `snap-fab.tsx` (467→380L), `study-set-editor.tsx` (467→383L). Pre-existing `quiz-result.test.tsx` failure fixed (next-intl module resolution). New files: `snap-dialog.tsx`, `schedule-generator.ts`, `schedule-view.tsx`, `item-picker-dialog.tsx`, `tag-chips.tsx`, `mcq-options.tsx`, `diagram-input.tsx`. `use-question-engine.ts` simplified (removed redundant `generatedQuestions` state). **1326 tests pass, 0 failures.**
- **Session 39**: React Doctor 100/100 — resolved remaining 16 issues (6 bugs, 9 perf, 1 maintainability) across 10 files. Parallelized independent awaits (quiz-actions, domain, push-delivery), combined chained iterations (classify/route, quiz-actions), replaced Array.includes in loops with Set.has, replaced array.find in loop with Map.get, merged dual useState into useReducer (recent-questions-card), removed redundant useEffect state reset (immersive-mode), moved static array to module scope (messages/route), captured refs in cleanup effects (admin-dashboard, getting-started-card), combined string .includes() into single regex test (ai/client). 12 files changed, +96/−65 lines. Commit `a1bd5de4`.

## System at a Glance

```
Browser (React 19 + Next.js 16)
  ├── Dexie IndexedDB   ← L1 cache (v32, 35+ tables, 24h-30d expiry)
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
  │     ├── AIClient threaded through processors (singleton collapsed)
  │     ├── GenerateResult { questions, ragContext } (structured return)
  │     ├── PromptManager injects TinyFish <reference_material> XML + sourceRefs appendix
  │     └── source-mapper: attachWebSources hybrid AI-cite + fallback
  ├── VisualEngine       → Konva (STEM) or Wikimedia (non-STEM)
  ├── CachedAIGenerator<T> → Dexie lookup → stale? → AI generate → cache → return
  ├── KnowledgeGraph     → AI topic dependency graphs (Dexie 7d cache)
  ├── StudyGuide         → AI structured guides (Dexie 30d cache)
  ├── QuizPackService    → bulk generate → Dexie storage
  ├── QuizResultProcessor → discriminated union (bolt|quiz|exam|flashcard), single orchestration point
  ├── EnrichmentPipeline → 3 ports (Curriculum/Embedding/PastPaper), DI via EnrichmentDeps
  ├── PushDeliveryService → lazy VAPID init, sendToUser/sendToAll, consolidated web-push
  ├── StudyPlannerService → state/sync/mutations, event emission, generatePlan
  ├── GamificationService → state/persist/sync, mutation results (XpResult/AchievementResult/ChestResult)
  ├── LearningOrchestrator → composes Engine + reads ragContext from GenerateResult + DI db for dedup
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
  ├── AnalyticsService   → trends + comparative routes (SessionStore interface)
  ├── QueueCore          → Dexie-backed job queue (retry + backoff)
  ├── RateLimiter+TokenTracker → auth limits + AI budget caps (MapStore or RedisStore)
  ├── UniformAIAdapter   → factory for pluggable provider normalizers
  ├── WeeklyDigest       → POST /api/cron/weekly-digest (admin push to all subscribers)
  ├── DailyDigest        → scheduleDailyDigest() in notification-service (per-day local notification)
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

| File/Dir                                             | What I'm touching                                             |
| ---------------------------------------------------- | ------------------------------------------------------------- |
| `src/lib/services/quiz-result-processor.ts`          | New — quiz completion orchestration (4 sources)               |
| `src/lib/question-engine/enrichment-pipeline.ts`     | New — 3-port enrichment (Curriculum/Embedding/PastPaper)      |
| `src/lib/tinyfish/rag-pipeline.ts`                   | New — withRagGuards HOF, barrel separation                    |
| `src/lib/services/push-delivery.ts`                  | New — PushDeliveryService (lazy VAPID, consolidated web-push) |
| `src/lib/services/study-planner-service.ts`          | New — StudyPlannerService (state/sync/mutations)              |
| `src/lib/gamification-engine/service.ts`             | New — GamificationService (state/persist/sync)                |
| `src/lib/ai/cached-ai-generator.ts`                  | Generic CachedAIGenerator<T>                                  |
| `src/lib/question-engine/`                           | GenerateResult structured return, AIClient threading          |
| `src/lib/analytics/analytics-service.ts`             | SessionStore interface, extracted from routes                 |
| `src/lib/assignments/submission-service.ts`          | Uses PushDeliveryService                                      |
| `src/lib/digest/digest-service.ts`                   | Uses PushDeliveryService                                      |
| `src/lib/integration/service.ts`                     | DataAccess seam sealed (\_deps pattern)                       |
| `src/lib/orchestrator/learning-orchestrator.ts`      | DI db for dedup, constructor injection                        |
| `src/lib/orchestrator/handlers/domain.ts`            | DomainDb type expanded, generateEmbedding sealed              |
| `src/app/api/exam-papers/classify/route.ts`          | Factory DI (createClassifyHandler)                            |
| `src/app/api/exam-papers/[id]/extract/route.ts`      | \_deps pattern for Dexie access                               |
| `src/components/dashboard/dashboard-client.tsx`      | Uses QuizResultProcessor                                      |
| `src/app/[locale]/exam/[id]/exam-session-client.tsx` | Uses QuizResultProcessor                                      |
| `src/app/[locale]/flashcards/flashcards-client.tsx`  | Uses QuizResultProcessor                                      |
| `src/hooks/use-gamification.ts`                      | Thin subscriber to GamificationService                        |
| `src/hooks/use-study-planner.ts`                     | Thin subscriber to StudyPlannerService                        |
| `system-design.md`                                   | Updated for Session 38                                        |
| `CONTEXT.md`                                         | Updated for Session 38                                        |

## Background Knowledge

- **Question types (11)**: multiple-choice, matching, short-answer, long-answer, essay, calculation, diagram, programming, source-based, data-response, mixed. Local grade for 4 types, AI grade for 7 types.
- **Flashcard engine**: `src/lib/flashcard-engine/` — single `FlashcardEngine` class wrapping DataAccess + SM-2/FSRS + daily limits + learning steps + ease-hell + leech + settings.
- **Swipeable flashcard deck**: `SwipeableCardDeck` (3-card cascade, drag-to-swipe, tap-to-flip), `QualityPicker` (6-level SM-2), `useSwipeDeck` (state machine with undo stack).
- **Immersive mode**: `ImmersiveModeProvider` context — auto-hides nav during active quiz/exam. Floating exit pill.
- **Route handler factory**: `src/lib/api/create-route-handler.ts` — `createRouteHandler()` with `AuthMode`, `HttpError`, auto auth guard, body parsing, validation, error wrapping, optional rate limiting.
- **AI provider chain**: Gemini 2.0 Flash Lite (primary) → Nvidia NIM meta/llama-3.3-70b-instruct → Groq llama-3.3-70b-versatile. Defined in `src/lib/ai/client.ts`. `uniform-adapter.ts` provides pluggable normalizers. **Singleton collapsed (Session 37)**: `QuestionProcessor` and `Grader` accept `ai?: AIClient` in constructor; `QuestionEngine` creates AI client once, threads through `ProcessorRegistry`.
- **Competency levels**: novice→Easy/remember, developing→Medium/understand/apply, proficient→Medium/apply/analyze/evaluate, mastered→Hard/evaluate/create. Mapped in `src/lib/question-engine/competency-mapper.ts`. Supports per-paper (P1/P2) split.
- **Caching tiers**: Dexie L1 (fastest, per-device) → Appwrite L2 (cross-session) → AI/Wikimedia L3 (on-demand fallback). New `CachingStrategy` module for generic multi-tier caching.
- **CachedAIGenerator<T>** (Session 37): Generic fetch→cache→generate pattern at `src/lib/ai/cached-ai-generator.ts`. Dexie lookup → stale? → AI generate → cache → return. Config object with `buildCacheEntry`/`extractData` for heterogeneous Dexie entry shapes. Used by knowledge-graph and study-guide.
- **GenerateResult** (Session 37): `QuestionEngine.generate()` returns `GenerateResult { questions, ragContext }` instead of `Question[]`. Orchestrator reads `ragContext` from return value. `lastRagContext` kept during execution as side effect.
- **AnalyticsService** (Session 37): `src/lib/analytics/analytics-service.ts` with `SessionStore` interface. Trends and comparative routes reduced from ~50-90 lines to ~20 lines each.
- **Diagrams**: STEM subjects (30) → Konva renderers (geometry, chart, chemistry, graph, force-vector, circuit, wave, motion, node-flow, custom-svg). Non-STEM → Wikimedia. Fallback: Mermaid.
- **Knowledge graph**: `src/lib/knowledge-graph/` — AI generates `{ nodes, edges }` topic graphs. Cached 7d in Dexie v29. Two UIs: dashboard `LearningMapCard` + per-question `TopicGraph`.
- **Study guides**: `src/lib/study-guide/` — AI generates structured guides with sections + summary. Cached 30d in Dexie v32. `/study-guide` page with subject/topic input.
- **Live sessions**: `useLiveSession()` hook with 15s polling via React Query. Appwrite-backed with `LiveSession` + `LiveSessionParticipant` collections.
- **Dexie schema**: v32 — 38+ tables. v27 added `analyticsEvents`. v28 added `sharedQuestions`. v29 added `knowledgeGraph`. v30 added `teacherObservations` + `assignmentMessages`. v31 added `studyPlans` + `onboardingState` + `srDailyBudget` + `flashcardSyncState`. v32 added `studyGuides`.
- **DataAccess seam**: All 33 accessors via typed `DataAccess` interface (10 domain sub-interfaces: FlashcardDataAccess, CompetencyDataAccess, QuizDataAccess, ContentDataAccess, StudyDataAccess, SyncDataAccess, ObservabilityDataAccess, SocialDataAccess, CacheDataAccess, LegacyDataAccess). 11 dead accessors removed. Two implementations: `DexieDataAccess` (production) and `InMemoryDataAccess` (tests). `seed()` for test setup. 19 consumers narrowed from `DataAccess` to sub-interfaces. 7 cross-domain consumers kept on composite `DataAccess`. `Collection<T>` now supports `.offset(n)` for pagination. See ADR-0011.
- **E2E testing**: Playwright 1.60.0 — smoke tests + visual regression tests (homepage sections).
- **Storybook**: 10.4.1 with 18 stories (Button, Card, Switch, Checkbox, Progress, Skeleton, Avatar, Separator, ShareButton, Badge, Dialog, Input, Textarea, Select, Tabs, Popover, DropdownMenu, Toast).
- **TinyFish RAG**: `src/lib/tinyfish/` — 7 modules. Injects CAPS/DBE sources into solve + quiz prompts. XML `<reference_material>` block + `buildPromptInstruction()` framing. Dexie v25 cache (14d TTL), in-flight dedup, 24-subject allowlist, 20 fetches/day/user, 3s timeout fail-open. Consent-gated. DI pattern (`deps?` arg). `getLastRagContext()` surfaces batch RAG context. Per-question `Question.webSources` via hybrid AI-cite + fallback. See ADR-0010.
- **Exam_dates sync**: Background job `"appwrite-exam-dates-sync"` with `upsertDocument` handler.
- **Premium gating removed**: All features are free (June 2026). ContentLock component is dead — no `usePremium`, `isPremium`, or `isPriority` checks anywhere. Stripe/Payfast infra still exists for potential future monetization but no UI gating.
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
- ❌ Do NOT use ContentLock component or `usePremium` checks — premium gating was removed in June 2026; all features are free
- ❌ Do NOT use arbitrary pixel values — use design tokens (`--space-*`, `--fs-*`)
- ❌ Do NOT hardcode shadows — use `shadow-level-1/2/3`
- ❌ Do NOT use `space-y-*` or manual `mt-* mb-*` pairs — use `gap-*` on the parent container
- ❌ Do NOT write magic z-index numbers — use `--z-*` semantic tokens
- ❌ Do NOT declare `max-w-*` or `px-*` at the page level — wrap pages in `<PageContainer>`
- ❌ Do NOT bypass DataAccess interface — never use `offlineDB` directly; always go through `DexieDataAccess` or `InMemoryDataAccess`
- ❌ Do NOT use `Bun.mock.module` for tinyfish or cross-file mocks — use DI (`deps` arg) or shared mock modules
- ❌ Do NOT use `querySelector`/`querySelectorAll` in tests — happy-dom throws SyntaxError; use `getElementsByTagName`/`getElementsByClassName` + `container.textContent` regex

## Memory References

| File                | What's inside                                                                               | Priority  |
| ------------------- | ------------------------------------------------------------------------------------------- | --------- |
| `repo-index.md`     | Full directory tree, entry points, data flow, conventions, recent changes, TODOs            | Reference |
| `prompt-catalog.md` | Catalog of all discoverable prompt contexts                                                 | Reference |
| `memory.md`         | All decisions (ADR-lite), patterns, failures, open questions, resources                     | High      |
| `system-design.md`  | Mermaid architecture diagram, data model ERD, component dictionary, API list, NFRs, roadmap | High      |
| `AGENTS.md`         | Engine architecture, math conventions, session 1-37 history, Dexie schema progression       | High      |
| `CONTEXT.md`        | Domain glossary — prepend to any agent prompt                                               | High      |
| `DESIGN.md`         | "The Emerald Study Room" design system (342 lines)                                          | Medium    |
| `TODO.md`           | Outstanding tasks and completed work log                                                    | Medium    |
