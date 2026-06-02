<!-- LAST_SYNC: 2026-06-02 -->
# Master Context — Lumni

## PROJECT_IDENTITY
AI-powered South African Matric (Grade 12) exam preparation platform. Offline-first architecture using Dexie (L1) and Appwrite (L2). Web-grounded AI via TinyFish RAG (solve + quiz). Design system is "Emerald Study Room" (Tailwind 4).

## CURRENT_FOCUS
Web-grounded AI phase complete: TinyFish RAG shipped across 3 PRs (`f5313f32` foundation, `6c7c2ff1` solve, `dd3940c4` quiz generation) + Q7 follow-up (`2c16e85e` quiz results page surfaces RAG sources via `getLastRagContext()`). 1203 tests pass. Active: pick next P1 — Q4 per-question source persistence on `Question` type, or new features/bug fixes.

## KEY_CONSTRAINTS
- **AI Budget**: 2000 global calls/day. Strict per-user caps: 20 gen, 100 grade, 20 hint, 50 visual, 20 RAG fetch.
- **RAG Allowlist**: 24 subjects (STEM + humanities); off-grid subjects skip RAG entirely.
- **Offline-First**: Dexie is the source of truth for all client reads; all writes must be queued via `QueueCore`.
- **Math**: Strictly use `$...$` for inline and `$$...$$` for display math (KaTeX).
- **Design**: No arbitrary pixels or magic z-index. Use semantic tokens.

## DEFINITIONS
- **QuestionEngine**: Single source of truth for all 11 question types. RAG-augmented via `PromptManager`.
- **TinyFish RAG**: Web-grounded reference material injected into solve + quiz prompts. 7 modules in `src/lib/tinyfish/`.
- **FlashcardEngine**: Unified SR logic (SM-2/FSRS) + daily limits + leech detection.
- **Immersive Mode**: UI state that auto-hides core navigation for focus.
- **Quiz Pack**: AI-generated question sets for offline study.

## DECISION_LOG
- [D030] **Mega-component breakdown**: Overgrown files split into co-located subdirs.
- [D031] **Unified SR**: SM-2/FSRS logic unified into `src/lib/flashcard-engine/`.
- [D032] **Generic API**: Migrated routes to `createRouteHandler` factory.
- [D033] **Swipeable Deck**: Tinder-style interaction for flashcards with quality fine-tuning.
- [D034] **GDPR Consent**: Dual-write (Dexie + Appwrite) with ai-gate/sentry-gate blocking.
- [D035] **WCAG 2.2 AA**: 30+ components audited; 19 critical/high fixes applied (labels, focus-visible, aria-live, keyboard).
- [D036] **TinyFish RAG foundation**: 7-module `src/lib/tinyfish/` with 24-subject allowlist, 14d Dexie cache, in-flight dedup, 3s timeout fail-open.
- [D037] **DI over `Bun.mock.module`**: Network/IO-touching functions accept a `deps` arg to avoid process-wide test pollution.
- [D038] **RAG fetch once per batch**: `QuestionEngine.lastRagContext` shared across processors in a single `generateInternal` call.
- [D039] **Quiz results page RAG sources** (`2c16e85e`): `LearningOrchestrator.generateQuestionSet()` calls `engine.getLastRagContext()` and maps to `{ url, title }[]` for the API wire; both `QuizResult` and `QuizResultsCard` render `<VerifiedByPill>`. `getLastRagContext()` getter pattern is reusable for any future "sidecar context" surfaced by the engine without touching the `generate()` signature.

## KNOWLEDGE_GRAPH
- `LearningOrchestrator` → `QuestionEngine` → `AI Providers` (Gemini/Nvidia/Groq)
- `LearningOrchestrator` → `QuestionEngine` → `TinyFish RAG` (3s timeout, 14d cache)
- `LearningOrchestrator` → `QuestionEngine` → `PromptManager` (injects `<reference_material>` XML)
- `LearningOrchestrator.generateQuestionSet` → `engine.getLastRagContext()` → `QuizResult` + `QuizResultsCard` (Q7)
- `aiSolver.execute` → `TinyFish RAG` (1-source, 24h cache) → system+user prompt injection
- `FlashcardEngine` → `Dexie` → `QueueCore` → `Appwrite`
- `QuizPackService` → `QuestionEngine` → `Dexie` (v25)
- `UserConsentService` → `Dexie` → `QueueCore` → `Appwrite` (dual-write)

## REUSABLE_SNIPPETS
- **API Route**: `export const POST = createRouteHandler({ auth: 'required', schema: z.object({...}), handler: async (data, ctx) => {...} });`
- **Math Rendering**: `<MarkdownRenderer content="$E=mc^2$" subject="physical-sciences" />`
- **Competency Tracking**: `await trackQuestionResult(questionId, score, subject, topic);`
- **RAG Fetch (quiz)**: `const ctx = await fetchRagContext(subject, topic, userId);` → `PromptManager.getPrompt(type, params, ctx)`
- **RAG Fetch (solve)**: `const ctx = await getSourceForQuestion(question, userId);` → inject into prompt
- **Quiz results pill**: `<VerifiedByPill sources={sources ?? []} />` — wire `sources` from `useQuestionEngine()` (defaults to `[]`)
- **Engine sidecar context**: `const ctx = engine.getLastRagContext()` after `generate()`; map full schema down to wire shape — avoids touching `generate()` signature

## AVOID_LIST
- **Space-y**: Avoid `space-y-*`, use `flex-col` + `gap-*`.
- **Arbitrary Values**: Prohibited `w-[200px]`, `z-50`, `rounded-[2.5rem]`.
- **Direct Appwrite Writes**: Use `QueueCore` for sync consistency.
- **DeepSeek**: Removed from AI chain due to cost.
- **`Bun.mock.module` for tinyfish**: Use DI (`deps` arg) instead — `mock.module` is process-wide.

## PROMPT_LOOKUP_TABLE
- If working on **Engines**, check `prompt-index.md` > `agent-engine-architecture`.
- If working on **UI/Design**, check `prompt-index.md` > `design-system-emerald`.
- If performing a **UI Audit**, check `prompt-index.md` > `impeccable-ui-audit`.
- If working on **RAG**, check `docs/adr/0010-tinyfish-rag-integration.md`.
