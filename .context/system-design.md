<!-- LAST_SYNC: 2026-06-08 -->
# System Design — Lumni

## Overview & Goals
Lumni is a mobile-first South African Matric exam prep platform. It provides offline-capable practice, AI-powered grading, algorithmic study planning, and web-grounded RAG injection for both solve and quiz generation (via TinyFish). The platform prioritizes offline availability through local AI generation (Quiz Packs), on-device caching (Dexie), and immersive focus modes.

## Architecture Diagram
```mermaid
graph TD
    Client[Browser: Next.js/React]
    Dexie[(Dexie L1 Cache<br/>v32, 35+ tables)]
    Appwrite[(Appwrite L2 Storage)]
    API[Next.js API Routes]
    Engine[Question Engine]
    Visual[Visual Engine]
    KG[Knowledge Graph<br/>AI topic deps, 7d TTL]
    SG[Study Guide<br/>AI guides, 30d TTL]
    Pack[Quiz Pack Service]
    AI[AI: Gemini/Nvidia/Groq]
    Wiki[Wikimedia Commons]
    RAG[TinyFish RAG<br/>search + fetch]
    Queue[QueueCore Job Queue]
    Auth[Appwrite Auth / Anon Gating]
    Stripe[Stripe/Payfast Payments]
    Redis[Upstash Redis<br/>Rate Limiter]
    Live[Live Session Service]
    Share[Share Service<br/>public + ghost]
    Digest[Weekly Digest<br/>cron push]
    Report[Student Report API]

    Client <--> Dexie
    Client <--> Auth
    Client <--> API
    API <--> Appwrite
    API <--> Engine
    API <--> Visual
    API <--> KG
    API <--> SG
    API <--> Pack
    API <--> Stripe
    API <--> Live
    API <--> Share
    API --> RAG
    API --> Redis
    API --> Digest
    API --> Report
    Engine <--> AI
    Engine --> RAG
    Visual <--> AI
    Visual <--> Wiki
    Pack <--> Engine
    Queue <--> Dexie
    Queue <--> Appwrite
```

## Data Flow
1. **Multi-Tier Caching**: User requests content. L1 (Dexie) is primary; L2 (Appwrite) is secondary; L3 (AI/Wiki/TinyFish) is fallback. All DB access via `DataAccess` interface (10 domain sub-interfaces, 33 accessors).
2. **Web-Grounded AI (RAG)**: `/api/solve` and `/api/engine/generate` call `src/lib/tinyfish/` to inject live CAPS/DBE sources into the AI prompt. Cached for 14d (quiz) or 24h (solve). In-flight dedup + 3s timeout fail-open. 24-subject allowlist + per-user daily cap.
3. **Offline Practice**: `QuizPackService` enables bulk generation and storage in `quizPacks`/`packQuestions` Dexie tables for offline-first access.
4. **Question Processing**: Grading (local/AI) is orchestrated by `LearningOrchestrator`, which enqueues sync and progress jobs via `QueueCore`. Source attribution via `source-mapper.ts`.
5. **Competency tracking**: Progress is assessed via `trackQuestionResult()`, updating the local `competency` table and syncing to Appwrite `competencies` collection. Per-paper (P1/P2) split supported.
6. **Knowledge Graph**: AI generates topic dependency graphs (prerequisites/core/advanced). Cached 7d in Dexie v29. Two UIs: `LearningMapCard` (dashboard) + `TopicGraph` (per-question).
7. **Study Guides**: AI generates structured guides with sections + summary. Cached 30d in Dexie v32. `/study-guide` page with subject/topic input.
8. **Live Sessions**: Real-time collaborative study sessions via Appwrite. `useLiveSession()` hook with 15s polling.
9. **Monetization**: `PremiumProvider` gates features (offline packs, advanced analytics) based on Appwrite `premium_subscriptions`.
10. **B2B2C Flows**: Teachers manage assignments via `teacher_assignments`; parents monitor progress via `ParentShell`. Ghost links (Appwrite-backed) for anonymous B2B2C access. Observations + assignment messages stored in Dexie.
11. **Observability**: `latency-tracker` monitors AI performance; `events.ts` tracks usage events. Centralized `logger.ts` with Sentry production integration.
12. **Retention Loop**: Wrong-answer re-encounter via `retentionRecurrence` table. Auto-insert 3 wrong answers into next eligible quiz. Next-best-action dashboard card.
13. **Weekly/Daily Digest**: `POST /api/cron/weekly-digest` sends web push to all subscribers with weekly stats. `scheduleDailyDigest()` sends local notification each day.

## Tech Stack
- **Frontend**: Next.js 16.2.7, React 19.2.7, Tailwind CSS 4, Framer Motion 12.
- **Persistence**: Dexie 4 (IndexedDB, v32 schema — 35+ tables), Appwrite Cloud, sql.js (SQLite).
- **AI/ML**: Gemini 2.0 Flash Lite (Primary), Nvidia NIM (Fallback), Groq Cloud (Last resort). TinyFish (RAG) for web-grounded solve + quiz. Uniform AI adapter for pluggable provider normalizers.
- **Visualization**: Konva (STEM diagrams), Mermaid.js, Recharts 3.
- **Rate Limiting**: MapStore (in-memory) + RedisStore (Upstash Redis for production).
- **Verification**: Playwright (E2E + visual tests), Storybook (UI, 18 stories), Bun (1258 tests), Knip (dead code detection).
- **Monitoring**: Sentry (error tracking), centralized logger, observability events.

## Key Abstractions
- **QuestionEngine**: Single source of truth for generation/grading/validation of 11 question types. RAG-augmented via `PromptManager`.
- **FlashcardEngine**: Unified SM-2/FSRS engine wrapping DataAccess, limits, and recovery logic.
- **DataAccess**: Typed interface over 33 accessors via 10 domain sub-interfaces. `DexieDataAccess` (production) + `InMemoryDataAccess` (tests with `seed()`). `Collection.offset(n)` for pagination.
- **LearningOrchestrator**: Orchestrates engines and manages side effects (sync, analytics, jobs).
- **TinyFish RAG**: 7 modules — client, cache (Dexie 14d), in-flight dedup, 24-subject allowlist, XML wrap + prompt framing, types, index barrel.
- **KnowledgeGraph**: AI-generated topic dependency graphs with 7d cache.
- **StudyGuide**: AI-generated structured study guides with 30d cache.
- **LiveSessionService**: Appwrite-backed real-time study sessions with 15s polling.
- **UniformAIAdapter**: Factory for pluggable AI provider normalizers (`openaiNormalizer`, `geminiNormalizer`).
- **ShareService**: Public share links, ghost links (Appwrite), assignment sharing.
- **createRouteHandler**: Declarative factory for API routes with auth and Zod validation.
- **ImmersiveMode**: Context-driven UI state for focus (auto-hides nav bars).
- **SwipeableCardDeck**: Tinder-style interaction for spaced-repetition flashcards.
- **CachingStrategy**: Generic multi-tier caching framework.
- **WeeklyDigest**: `POST /api/cron/weekly-digest` admin push to all subscribers via web-push.

## External Integrations
- **Appwrite**: Authentication, Database, Storage, Live Sessions.
- **AI Providers**: Google Gemini, Nvidia NIM, Groq Cloud.
- **RAG**: TinyFish (search + fetch, free tier, consent-gated).
- **Payments**: Stripe, Payfast.
- **UploadThing**: Document and avatar storage.
- **Upstash Redis**: Production rate limiting.
- **Sentry**: Error tracking (client + server + edge).

## Current Limitations & TODOs
- **OCR text extraction**: Official PDF timetables require OCR for automated ingestion.
- **Comparative analytics**: Scaling depends on cross-user data aggregation in Appwrite.
- **PWA titlebar theming**: Gap 3 of Theme Chrome Takeover not yet implemented.
- **Keyboard-accessible flashcard deck**: Full ARIA widget semantics not yet complete.
- **Teacher report page**: Quiz history data is from `study_sessions` (not `quizAttempts`), may show different data shape.
- **WeeklyDigest cron**: No external cron service configured — relies on manual/admin triggering.

## Recent Changes Log (Last 7 Days)
- **React Doctor 100/100**: 194 issues fixed (5 errors, 189 warnings). 114 unused exports removed, 250+ lines dead code deleted. Knowledge-graph consumers converted from `useMutation+useEffect` → `useQuery`. Added `GET /api/engine/knowledge-graph` route. Biome zero errors across 1260 files.
- **DataAccess domain split**: 10 domain sub-interfaces (33 accessors, 11 dead removed). `Collection.offset(n)` pagination. 19 consumers narrowed from `DataAccess` to sub-interfaces. 7 cross-domain kept composite.
- **Practice More button**: Link-style CTA on `BoltCelebration` → `/quiz?subject=X` via `startViewTransition`.
- **Test fixes**: 8 RateLimiter async, 8 quiz-session repo, KaTeX CSS happy-dom patch, mock.module pollution.
- **Teacher localStorage fixes**: Ghost links → Appwrite `ghost_links`. Observations → Dexie `teacherObservations` (v30). Messages → Dexie `assignmentMessages` (v30). Shared assignments → Dexie `sharedQuestions`.
- **Weekly digest**: `POST /api/cron/weekly-digest` — admin push to all subscribers via web-push.
- **Daily digest**: `scheduleDailyDigest()` in notification-service — daily local notification.
- **Teacher report**: `GET /api/teacher/students/[studentId]/report` fetches from Appwrite instead of local Dexie.
- **Quality dashboard**: Rating distribution bar chart added to `QuestionRatingsDashboard` via recharts.
- **Storybook**: 10→18 stories (Dialog, Input, Textarea, Select, Tabs, Popover, DropdownMenu, Toast).
- **WeeklyReportPanel**: Replaced hash-based random mastery with subject-score-derived values.
- **DataAccess re-addition**: `teacherObservations` + `assignmentMessages` re-added to all DataAccess implementations (had real consumers now).
- **Konva renderer registry**: `switch` → `diagramRegistry` map in `diagram-renderer.tsx`.
- **ADR-0011**: Updated for 33 tables, 10 sub-interfaces, current API surface.
