<!-- LAST_SYNC: 2026-06-07 -->
# Memory Index — Lumni

## Heuristics & Conventions
- **Math Delimiters**: Strictly use `$...$` for inline and `$$...$$` for display math.
- **Design Tokens**: No arbitrary pixels. Use `--space-*`, `--fs-*`, `shadow-level-*`, `rounded-card-lg`.
- **Layout**: Use `<PageContainer>` for all standard pages. Avoid `space-y-*`, use `flex-col` + `gap-*`.
- **API Routes**: Always use `createRouteHandler` factory with Zod schemas and explicit auth guards.
- **Offline-First**: All reads hit Dexie L1 first; all writes queued via `QueueCore`. All DB access via `DataAccess` interface.
- **DI for testability**: Network/IO-touching functions accept a `deps?: { ... }` arg instead of relying on `Bun.mock.module`.
- **DOM API in tests**: Prefer `getElementsByTagName` / `getElementsByClassName` + `container.textContent` regex matching over `querySelector`.
- **DataAccess**: Never use `offlineDB` directly — inject `DexieDataAccess` (prod) or `InMemoryDataAccess` (test).
- **Rate limiting**: Use `new RateLimiter(new MapStore(), config)` for dev, `new RateLimiter(new RedisStore(redis), config)` for production.

## Architectural Decisions
- [2026-05-11] **Multi-Tier Caching**: Dexie L1 (Primary) → Appwrite L2 → AI/Wiki/TinyFish L3 (Fallback).
- [2026-05-13] **AI Provider Chain**: Gemini 2.0 Flash Lite → Nvidia NIM → Groq (DeepSeek removed).
- [2026-05-15] **Composition Rule**: `LearningOrchestrator` composes `QuestionEngine` for orchestration side effects.
- [2026-05-20] **Unified Competency**: `trackQuestionResult()` is the single source of truth for progress.
- [2026-05-24] **Flashcard Consolidation**: Unified `FlashcardEngine` in `src/lib/flashcard-engine/`.
- [2026-05-24] **Generic Routes**: `createRouteHandler` factory replaces boilerplate across API routes.
- [2026-05-26] **Offline Quiz Packs**: `QuizPackService` enables bulk generation and Dexie persistence.
- [2026-05-28] **Swipeable Cards**: Tinder-style flashcard deck with SM-2 quality picker.
- [2026-05-28] **Immersive Mode**: Full-screen focus mode for quiz/exams, auto-hiding navigation.
- [2026-06-02] **TinyFish RAG**: Web-grounded AI for `/api/solve` and `/api/engine/generate` via `src/lib/tinyfish/` (7 modules). XML-wrapped `<reference_material>` block in user prompt + `buildPromptInstruction()` framing in system prompt. Dexie v25 cache (14d TTL), in-flight dedup, 24-subject allowlist, 3s timeout fail-open, consent-gated.
- [2026-06-02] **Quiz results page RAG pill** (`2c16e85e`): `getLastRagContext()` pattern surfaces batch sources.
- [2026-06-02] **Per-question RAG source persistence** (`f769f322`): `Question.webSources` hybrid AI-cite + fallback.
- [2026-06-04] **Centralized logger**: `logError()` with context tag; dev console.error, prod Sentry captureException.
- [2026-06-04] **DataAccess Phase 1**: Typed `DataAccess` interface (14 tables). `CompetencyService` + `FlashcardEngine` migrated.
- [2026-06-04] **DataAccess Phase 2-4**: All 38+ tables migrated. AnalyticsEngine, QuizPackService, RetentionService, 20+ files. localStorage → Dexie migration (v31).
- [2026-06-04] **Knowledge Graph**: AI-generated topic dependency graphs; 7d Dexie v29 cache. `LearningMapCard` + `TopicGraph`.
- [2026-06-04] **Study Guide Generator**: AI-generated structured guides; 30d Dexie v32 cache. `/study-guide` page.
- [2026-06-04] **Live Study Sessions**: Appwrite-backed real-time collaborative sessions; `useLiveSession()` with 15s polling.
- [2026-06-07] **Theme Chrome**: Dynamic `theme-color` meta tag; accent-tinted frosted glass; SSR viewport.
- [2026-06-07] **Navigation Sidebar**: Categorized with search (Study, Practice, Tools, Social, Account). `SidebarStateProvider` context.
- [2026-06-07] **Uniform AI Adapter**: `createUniformProvider()` factory with pluggable request normalizers and response parsers.
- [2026-06-07] **RedisStore**: Production `RateLimitStore` via `@upstash/redis` alongside `MapStore`.
- [2026-06-07] **Wrong-answer re-encounter**: `retentionRecurrence` table; auto-insert 3 wrong answers into quiz with review badge.
- [2026-06-07] **Public share route**: `/q/[id]` with 5-star gated answer; ghost links (30d); assignment shares.
- [2026-06-07] **PWA offline**: `/offline` page; install tracking events; service worker.
- [2026-06-07] **Batch 6 hardening**: i18n round 2 (nav+consent af/zu), knip, Playwright visual tests, storybook 10 stories, a11y round 2.
- [2026-06-07] **Daily Bolt simplification**: Removed two-step; `BoltCelebration` with 800ms auto-advance.
- [2026-06-07] **Item-bank pruning**: `"prune-stale-questions"` job type; `pruned?: boolean` on Question.

## Past Bugs & Failures
- **Competency Field**: Mismatch between `proficiency` and `score` fields. Standardized on `score`.
- **Lottie Unpin**: `lottie-react` unpin issue resolved by migrating to `@lottiefiles/dotlottie-react`.
- **Next.js Worker**: Build fails with `bunx --bun next build`. Use `npx next build`.
- **TTS Leak**: Multi-subscriber callback bug in `TTSService` fixed by clearing subscribers on unmount.
- **Middleware Proxy**: Collision between `middleware.ts` and `proxy.ts` resolved by merging into `proxy.ts`.
- **TinyFish `buildGenerateKey`**: Dash-prefixed subjects caused cache key collisions. Fixed by lowercasing + trimming leading/trailing dashes.
- **Bun `mock.module` pollution**: `Bun.mock.module("@/lib/tinyfish")` polluted cross-test imports. Resolved by DI pattern (deps arg).
- **happy-dom `querySelector` SyntaxError**: `screen.getByText` throws `TypeError: undefined is not a constructor`. Workaround: use `getElementsByTagName` / `getElementsByClassName` + `container.textContent` regex matching.
- **In-memory-only RateLimiter**: Didn't survive server restarts. Fixed with `RedisStore` implementation.

## Contacts / Resources
- **Domain glossary**: `CONTEXT.md`
- **Design system**: `DESIGN.md`
- **Product context**: `PRODUCT.md`
- **National Exam Dates spec**: `SPEC.md`
- **TinyFish RAG spec**: `docs/adr/0010-tinyfish-rag-integration.md` (status: Implemented)
- **DataAccess spec**: `docs/adr/0011-data-access-seam.md` (status: Implemented Phase 1-4)
- **Theme Chrome spec**: `docs/superpowers/specs/2026-06-07-theme-chrome-takeover-design.md`
- **Navigation Sidebar spec**: `docs/superpowers/specs/2026-06-03-nav-sidebar-design.md`
- **UI/UX Audit**: `.agents/skills/impeccable/`
- **Batch design specs**: `docs/superpowers/specs/2026-06-04-*.md`, `2026-06-07-*.md`
