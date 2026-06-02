<!-- LAST_SYNC: 2026-06-02 -->
# Memory Index — Lumni

## Heuristics & Conventions
- **Math Delimiters**: Strictly use `$...$` for inline and `$$...$$` for display math.
- **Design Tokens**: No arbitrary pixels. Use `--space-*`, `--fs-*`, `shadow-level-*`, `rounded-card-lg`.
- **Layout**: Use `<PageContainer>` for all standard pages. Avoid `space-y-*`, use `flex-col` + `gap-*`.
- **API Routes**: Always use `createRouteHandler` factory with Zod schemas and explicit auth guards.
- **Offline-First**: All reads hit Dexie L1 first; all writes queued via `QueueCore`.
- **DI for testability**: Network/IO-touching functions accept a `deps?: { ... }` arg instead of relying on `Bun.mock.module` (avoids process-wide specifier collisions in test runs).

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
- [2026-06-02] **TinyFish RAG**: Web-grounded AI for `/api/solve` and `/api/engine/generate` via `src/lib/tinyfish/` (7 modules). XML-wrapped `<reference_material>` block in user prompt + `buildPromptInstruction()` framing in system prompt. Dexie v25 cache (14d TTL), in-flight dedup, 24-subject allowlist, 3s timeout fail-open, consent-gated. RAG fetched once per batch via `QuestionEngine.lastRagContext`.

## Past Bugs & Failures
- **Competency Field**: Mismatch between `proficiency` and `score` fields. Standardized on `score`.
- **Lottie Unpin**: `lottie-react` unpin issue resolved by migrating to `@lottiefiles/dotlottie-react`.
- **Next.js Worker**: Build fails with `bunx --bun next build`. Use `npx next build`.
- **TTS Leak**: Multi-subscriber callback bug in `TTSService` fixed by clearing subscribers on unmount.
- **Middleware Proxy**: Collision between `middleware.ts` and `proxy.ts` resolved by merging into `proxy.ts`.
- **TinyFish `buildGenerateKey`**: Dash-prefixed subjects caused cache key collisions. Fixed by lowercasing + trimming leading/trailing dashes.
- **Bun `mock.module` pollution (PR 2)**: `Bun.mock.module("@/lib/tinyfish")` polluted cross-test imports. Resolved by switching to DI pattern (deps arg).

## Contacts / Resources
- **Domain glossary**: `CONTEXT.md`
- **Design system**: `DESIGN.md`
- **Product context**: `PRODUCT.md`
- **National Exam Dates spec**: `SPEC.md`
- **TinyFish RAG spec**: `docs/adr/0010-tinyfish-rag-integration.md` (status: Implemented)
- **UI/UX Audit**: `.agents/skills/impeccable/`
