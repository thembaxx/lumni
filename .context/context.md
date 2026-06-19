<!-- LAST_SYNC: 2026-06-18 -->
# Master Context — Lumni

## PROJECT_IDENTITY
AI-powered South African Matric (Grade 12) exam preparation platform. Offline-first architecture using Dexie (L1) and Appwrite (L2). Web-grounded AI via TinyFish RAG (solve + quiz). Design system is "Emerald Study Room" (Tailwind 4).

## CURRENT_FOCUS
All Batch 1-6 superpowers implemented. Data consolidation (DataAccess Phase 1-4) complete — all 38+ tables via typed interface. Knowledge graph, study guides, live sessions, share/public routes shipped. Theme chrome + navigation sidebar redesigned. Hardening sweep done. **React Doctor score 100/100** (194 issues fixed). Biome lint zero. **1264 tests pass, 0 fail.** **Premium gating removed (June 2026)** — all features free. ContentLock purged. Visual engine always fetches. Support page shows priority to all. Login banners on standalone auth-required pages. **Architectural deepening (Session 37)** — AI provider singleton collapsed, `GenerateResult` structured return, `CachedAIGenerator<T>` generic, 6 services extracted, ~200 lines dead code removed.

## KEY_CONSTRAINTS
- **AI Budget**: 2000 global calls/day. Strict per-user caps: 20 gen, 100 grade, 20 hint, 50 visual, 20 RAG fetch.
- **RAG Allowlist**: 24 subjects (STEM + humanities); off-grid subjects skip RAG entirely.
- **Offline-First**: Dexie is the source of truth for all client reads; all writes must be queued via `QueueCore`. All DB access via `DataAccess` interface.
- **Math**: Strictly use `$...$` for inline and `$$...$$` for display math (KaTeX).
- **Design**: No arbitrary pixels or magic z-index. Use semantic tokens.
- **DataAccess**: Never use `offlineDB` directly — always go through `DexieDataAccess` or `InMemoryDataAccess`.

## DEFINITIONS
- **QuestionEngine**: Single source of truth for all 11 question types. RAG-augmented via `PromptManager`. Returns `GenerateResult { questions, ragContext }`.
- **TinyFish RAG**: Web-grounded reference material injected into solve + quiz prompts. 7 modules in `src/lib/tinyfish/`.
- **FlashcardEngine**: Unified SR logic (SM-2/FSRS) + daily limits + leech detection.
- **Immersive Mode**: UI state that auto-hides core navigation for focus.
- **Quiz Pack**: AI-generated question sets for offline study.
- **Knowledge Graph**: AI-generated topic dependency graphs (prerequisites, core, advanced). Cached 7d in Dexie v29.
- **Study Guide**: AI-generated structured study guides with sections + summary. Cached 30d in Dexie v32.
- **Live Session**: Real-time collaborative study session via Appwrite, 15s polling.
- **SourceAttributionPill**: Inline non-collapsible pill on `QuestionCardFeedback` that surfaces per-question web sources.
- **DataAccess**: Typed interface over all 38+ Dexie tables; `DexieDataAccess` (production) and `InMemoryDataAccess` (tests).
- **Uniform AI Adapter**: Factory pattern for pluggable AI provider request normalizers and response parsers.
- **Theme Chrome**: Dynamic `theme-color` meta tag synced on theme switch; accent-tinted frosted glass on nav.
- **GenerateResult**: Structured return from `QuestionEngine.generate()` containing `{ questions, ragContext }` — replaces old sidecar pattern.
- **CachedAIGenerator<T>**: Generic fetch→cache→generate pattern for AI-backed resources (knowledge-graph, study-guide).
- **AnalyticsService**: Extracted domain logic for trends + comparative routes with `SessionStore` interface.
- **Service Extraction**: Route handlers reduced to 10-25 lines via service classes with constructor injection (ADR-0012).

## DECISION_LOG
- [D030] **Mega-component breakdown**: Overgrown files split into co-located subdirs.
- [D031] **Unified SR**: SM-2/FSRS logic unified into `src/lib/flashcard-engine/`.
- [D032] **Generic API**: Migrated routes to `createRouteHandler` factory.
- [D033] **Swipeable Deck**: Tinder-style interaction for flashcards with quality fine-tuning.
- [D034] **GDPR Consent**: Dual-write (Dexie + Appwrite) with ai-gate/sentry-gate blocking.
- [D035] **WCAG 2.2 AA**: 30+ components audited; 19 critical/high fixes applied.
- [D036] **TinyFish RAG foundation**: 7-module `src/lib/tinyfish/` with 24-subject allowlist, 14d Dexie cache, in-flight dedup, 3s timeout fail-open.
- [D037] **DI over `Bun.mock.module`**: Network/IO-touching functions accept a `deps` arg.
- [D038] **RAG fetch once per batch**: `QuestionEngine.lastRagContext` shared across processors.
- [D039] **Quiz results page RAG sources**: `getLastRagContext()` pattern for sidecar context.
- [D040] **Per-question RAG source persistence**: `Question.webSources` via hybrid AI-cite + fallback; `SourceAttributionPill` on QuestionCardFeedback.
- [D041] **Centralized logger**: `logError()` with context tag; dev console.error, prod Sentry captureException.
- [D042] **DataAccess seam**: Typed `DataAccess` interface with `DexieDataAccess` + `InMemoryDataAccess` implementations. All 38+ tables. Phase 1-4 complete.
- [D043] **Knowledge graph**: AI-generated topic dependency graphs; 7d Dexie cache. `LearningMapCard` + `TopicGraph` UIs.
- [D044] **Study guide generator**: AI-generated structured guides; 30d Dexie cache. `/study-guide` page.
- [D045] **Live study sessions**: Appwrite-backed with `useLiveSession()` hook (15s polling).
- [D046] **Uniform AI adapter**: `createUniformProvider()` factory with pluggable normalizers.
- [D047] **RedisStore rate limiter**: `RedisStore` via `@upstash/redis` alongside existing `MapStore`.
- [D048] **Wrong-answer re-encounter**: `retentionRecurrence` table; auto-insert 3 wrong answers into quiz.
- [D049] **Public share routes**: `/q/[id]` star-gated answer; ghost links (30d); assignment sharing.
- [D050] **Theme chrome takeover**: Dynamic `theme-color` meta tag; SSR viewport; accent-tinted nav glass.
- [D051] **Navigation sidebar**: Categorized (Study, Practice, Tools, Social, Account); search/filter; `SidebarStateProvider`.
- [D052] **PWA offline polish**: `/offline` page; install tracking events; service worker preload.
- [D053] **Item-bank pruning**: `"prune-stale-questions"` job type from `/api/engine/generate`.
- [D054] **React Doctor score 100/100**: 194 issues fixed (5 errors, 189 warnings). Removed 114 unused exports, 250+ lines dead code. `useMutation+useEffect` → `useQuery` for knowledge-graph consumers. Added `GET /api/engine/knowledge-graph` route. Biome lint zero across 1260 files.
- [D055] **Premium gating removed**: All ContentLock wrappers purged. `usePremium` removed from visual-engine and support page. Visual engine always fetches. Support shows priority to all. Auth-required standalone pages get login banners. `experimental.viewTransition: true` removed — `useNavigationDirection` owns the full view transition lifecycle. `NavigationPointerOff01Icon` → `Cancel01Icon` (icon didn't exist).
- [D056] **AI provider singleton collapsed**: `QuestionProcessor` and `Grader` accept `ai?: AIClient` in constructor. `QuestionEngine` creates AI client once, threads through `ProcessorRegistry`. 10 files changed.
- [D057] **GenerateResult structured return**: `QuestionEngine.generate()` returns `{ questions, ragContext }` instead of `Question[]`. Orchestrator reads `ragContext` from return value. `lastRagContext` kept during execution as side effect.
- [D058] **CachedAIGenerator<T>**: Generic fetch→cache→generate pattern at `src/lib/ai/cached-ai-generator.ts`. Dexie lookup → stale? → AI generate → cache → return. Used by knowledge-graph and study-guide.
- [D059] **AnalyticsService extraction**: `SessionStore` interface. Trends/comparative routes reduced from ~50-90 lines to ~20 lines.
- [D060] **Service extraction (ADR-0012)**: 6 services extracted: `DigestService`, `PlatformAnalyticsService`, `ExamDownloadService`, `ExamUploadService`, `SubmissionService`, `AuthRateLimitService`. Route handlers reduced to 10-25 lines.

## KNOWLEDGE_GRAPH
- `LearningOrchestrator` → `QuestionEngine` → `AI Providers` (Gemini/Nvidia/Groq)
- `LearningOrchestrator` → `QuestionEngine.generate()` → `GenerateResult { questions, ragContext }`
- `LearningOrchestrator` → `QuestionEngine` → `TinyFish RAG` (3s timeout, 14d cache)
- `LearningOrchestrator` → `QuestionEngine` → `PromptManager` (injects `<reference_material>` XML + sourceRefs appendix)
- `LearningOrchestrator.reads.ragContext` → `QuizResult` + `QuizResultsCard`
- `QuestionEngine.generateInternal` → `source-mapper.attachWebSources()` → `Question.webSources` → `QuestionCardFeedback`
- `aiSolver.execute` → `TinyFish RAG` (1-source, 24h cache) → system+user prompt injection
- `FlashcardEngine` → `DataAccess` → `QueueCore` → `Appwrite`
- `QuizPackService` → `QuestionEngine` → `DataAccess` (Dexie)
- `UserConsentService` → `DataAccess` → `QueueCore` → `Appwrite` (dual-write)
- `CachedAIGenerator<T>` → `DataAccess` → `AI generate` → `DataAccess` (cache)
- `KnowledgeGraph` → `CachedAIGenerator` → `DataAccess` (v29, 7d TTL) → `LearningMapCard` + `TopicGraph`
- `StudyGuide` → `CachedAIGenerator` → `DataAccess` (v32, 30d TTL) → `/study-guide` page
- `LiveSessionService` → `Appwrite` → `useLiveSession()` (15s polling) → `LiveSessionBar`
- `ShareService` → `DataAccess` (sharedQuestions) → `/q/[id]` public page
- `RetentionService` → `DataAccess` (retentionRecurrence) → next-best-action card
- `AnalyticsService` → `SessionStore` → trends/comparative routes (~20 lines each)
- `ThemeProvider` → `theme-color` meta tag → Browser chrome
- `SidebarNav` → `SidebarStateProvider` → categorized navigation with search
- `RateLimiter` → `MapStore | RedisStore` → API routes
- `aiClient` → `UniformAdapter` (openaiNormalizer/geminiNormalizer) → provider chain

## REUSABLE_SNIPPETS
- **API Route**: `export const POST = createRouteHandler({ auth: 'required', schema: z.object({...}), handler: async (data, ctx) => {...} });`
- **Math Rendering**: `<MarkdownRenderer content="$E=mc^2$" subject="physical-sciences" />`
- **Competency Tracking**: `await trackQuestionResult(questionId, score, subject, topic);`
- **RAG Fetch (quiz)**: `const ctx = await fetchRagContext(subject, topic, userId);` → `PromptManager.getPrompt(type, params, ctx)`
- **RAG Fetch (solve)**: `const ctx = await getSourceForQuestion(question, userId);` → inject into prompt
- **Quiz results pill**: `<VerifiedByPill sources={sources ?? []} />`
- **Question feedback pill**: `<SourceAttributionPill sources={question.webSources} />`
- **GenerateResult**: `const { questions, ragContext } = await engine.generate(params);` → orchestrator reads `ragContext`
- **Hybrid AI-cite + fallback**: prompt `sourceRefs: number[]`; validate; fall back to all sources; strip before persist
- **CachedAIGenerator**: `const generator = new CachedAIGenerator({ buildCacheEntry, extractData, ttlMs });` → Dexie lookup → AI fallback
- **Service extraction**: `class ExamDownloadService { constructor(private deps: { db, config }) {} }` → route handler calls `service.execute()`
- **DataAccess DI**: `class Service { constructor(private data: DataAccess) {} }` — inject `dexieDataAccess` (prod) or `InMemoryDataAccess` (test)
- **Rate limiter**: `new RateLimiter(new MapStore(), config)` or `new RateLimiter(new RedisStore(redis), config)`
- **Uniform provider**: `createUniformProvider({ name: 'gemini', model: 'gemini-2.0-flash-lite', normalizeRequest: geminiNormalizer, parseResponse: geminiResponseParser })`
- **Live session**: `const { session, participants, isLoading } = useLiveSession(groupId);`
- **Knowledge graph**: `const { data: graph, isPending } = useQuery({ queryKey: ['knowledge-graph', subject, topic], queryFn: () => fetch(`/api/engine/knowledge-graph?subject=${subject}&topic=${topic}`).then(r => r.json()), enabled: !!subject && !!topic });`
- **Study guide**: `const { data: guide } = useMutation({ mutationFn: ({ subject, topic }) => generateGuide(subject, topic) });`

## AVOID_LIST
- **Space-y**: Avoid `space-y-*`, use `flex-col` + `gap-*`.
- **Arbitrary Values**: Prohibited `w-[200px]`, `z-50`, `rounded-[2.5rem]`.
- **Direct Appwrite Writes**: Use `QueueCore` for sync consistency.
- **Direct offlineDB access**: Always use `DataAccess` interface.
- **DeepSeek**: Removed from AI chain due to cost.
- **`Bun.mock.module` for tinyfish**: Use DI (`deps` arg) instead — `mock.module` is process-wide.
- **`querySelector` / `querySelectorAll` in tests**: happy-dom `SelectorParser` throws `TypeError`. Use DOM API + textContent regex.
- **`lottie-react`**: Already migrated to `@lottiefiles/dotlottie-react`.

## PROMPT_LOOKUP_TABLE
- If working on **Engines**, check `prompt-index.md` > `agent-engine-architecture`.
- If working on **UI/Design**, check `prompt-index.md` > `design-system-emerald`.
- If performing a **UI Audit**, check `prompt-index.md` > `impeccable-ui-audit`.
- If working on **RAG**, check `docs/adr/0010-tinyfish-rag-integration.md`.
- If working on **DataAccess**, check `docs/adr/0011-data-access-seam.md`.
- If working on **Service Extraction**, check `docs/adr/0012-service-extraction-pattern.md`.
- If working on **Theme/Nav**, check `docs/superpowers/specs/2026-06-07-theme-chrome-takeover-design.md` and `2026-06-03-nav-sidebar-design.md`.
