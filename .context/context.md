<!-- LAST_SYNC: 2026-05-24 -->
# Master Context — Lumni

## PROJECT_IDENTITY
Lumni is a mobile-first South African Matric prep platform. It features offline-first architecture, AI-powered educational engines, and "The Emerald Study Room" design system.

## CURRENT_FOCUS
Architecture consolidation: flashcard engine unified into `flashcard-engine/`, generic route handler factory (`create-route-handler.ts`), services barrel exporting all 10 services, tools directory reorganized into domain subdirs.

## KEY_CONSTRAINTS
- **AI Budget**: 2000 global calls/day; per-user caps (20 gen, 100 grade).
- **Offline-First**: All reads must prioritize Dexie; all writes must be sync-queued.
- **Math Delimiters**: Strictly use `$...$` (inline) and `$$...$$` (display).
- **Appwrite Limits**: 50k document cap requires periodic cleanup of cached questions.

## DEFINITIONS
- **QuestionEngine**: Core module at `src/lib/question-engine/`.
- **Emerald Design**: Aesthetic defined in `DESIGN.md` using `oklch` colors and Tailwind v4.
- **Competency Level**: Scale (Novice, Developing, Proficient, Mastered) mapping to difficulty and Bloom's Taxonomy.
- **QueueCore**: Persistent job queue processor in `src/lib/queue/core.ts`.

## DECISION_LOG
- [D001] `LearningOrchestrator` composes `QuestionEngine` for clean separation.
- [D002] 3-tier caching: Dexie L1 -> Appwrite L2 -> AI/Wikimedia L3.
- [D003] AI chain: Gemini 2.0 Flash Lite -> Nvidia NIM -> Groq fallback.
- [D004] Local grading for 4 types, AI for 7.
- [D005] Same `userId` preserved during anonymous-to-authenticated upgrade.
- [D006] Repository pattern for all DB access.
- [D007] Single `QueueCore` for sync and jobs.
- [D008] Unified `trackQuestionResult()` for competency.
- [D009] AI token budgets per user/day.
- [D011] Inverse-competency round-robin study scheduling.
- [D012] No `\(...\)` delimiters — only dollar signs for KaTeX.
- [D013] 30-day question cache TTL in Appwrite.
- [D016] Competency uses `score` field (not `proficiency`).
- [D017] Flashcard engine consolidated into `src/lib/flashcard-engine/` wrapping repo + algorithms + settings.
- [D018] Route handler factory `createRouteHandler()` replaces 49 copies of auth/try-catch boilerplate.
- [D019] Services barrel `src/lib/services/index.ts` exports all 10 services with `ServiceResult<T>`.
- [D020] Tools directory split into domain subdirs: core, communication, math, science, scheduling.

## KNOWLEDGE_GRAPH
User -> [Zustand Store] -> [QuestionEngine] -> [AI Providers]
User -> [Dexie SyncQueue] -> [Appwrite] -> [Analytics/Progress]
RouteHandler -> [createRouteHandler] -> [Auth Guard + Validation + Exec]
FlashcardEngine -> [DexieRepository + SM-2/FSRS + DailyLimits + LearningSteps + EaseHell + Leech]
Services -> [ServiceResult<T>] -> [Analytics, Competency, Progress, Flashcard, Notification, ...]
Tools -> [core/ | communication/ | math/ | science/ | scheduling/]

## AVOID_LIST
- ❌ No arbitrary pixel values (e.g., `w-[250px]`). Use design tokens.
- ❌ No hardcoded shadows. Use `shadow-level-1/2/3`.
- ❌ No `space-y-*` for layout. Use `flex flex-col` + `gap-*`.
- ❌ No magic z-index numbers. Use semantic `--z-*` scale.
- ❌ No `lottie-react`. Use `@lottiefiles/dotlottie-react`.

## PROMPT_LOOKUP_TABLE
- Architecture -> `system-design.md`
- Code Signatures -> `code-signatures.json`
- History/Decisions -> `memory-index.md`
- Prompt Library -> `prompt-index.md`
- File Map -> `repo-index.md`
