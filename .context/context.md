<!-- LAST_SYNC: 2026-05-25 -->
# Master Context — Lumni

## PROJECT_IDENTITY
Lumni is a mobile-first South African Matric prep platform featuring offline-first architecture, AI-powered educational engines, and "The Emerald Study Room" design system.

## CURRENT_FOCUS
Testing and verification: prioritizing E2E (Playwright) and component test coverage. Stabilizing the `flashcard-engine` unification and ensuring the Appwrite write path for `exam_dates` is implemented.

## KEY_CONSTRAINTS
- **AI Budget**: 2000 global calls/day; per-user caps (20 gen, 100 grade, 20 hint, 50 visual).
- **Offline-First**: All reads must prioritize Dexie; all writes must be sync-queued via `QueueCore`.
- **Math Delimiters**: Strictly use `$...$` (inline) and `$$...$$` (display).
- **Appwrite Limits**: 50k document cap requires periodic cleanup of cached questions.
- **Design Tokens**: No hardcoded values; use OKLCH colors and semantic shadows/spacing.

## DEFINITIONS
- **QuestionEngine**: Core module for question lifecycle (gen/grade/validate) at `src/lib/question-engine/`.
- **Emerald Design**: Aesthetic defined in `DESIGN.md` using `oklch` colors and Tailwind v4.
- **Competency Level**: Scale (Novice, Developing, Proficient, Mastered) mapping to Bloom's Taxonomy.
- **QueueCore**: Persistent job queue processor for sync and background tasks.

## DECISION_LOG
- [D001] `LearningOrchestrator` composes `QuestionEngine` for clean separation.
- [D002] 3-tier caching: Dexie L1 -> Appwrite L2 -> AI/Wikimedia L3.
- [D003] AI chain: Gemini 2.0 Flash Lite -> Nvidia NIM -> Groq fallback.
- [D004] Local grading for 4 types, AI for 7.
- [D011] Inverse-competency round-robin study scheduling.
- [D017] Flashcard engine consolidated into `src/lib/flashcard-engine/`.
- [D018] Route handler factory `createRouteHandler()` for declarative API logic.
- [D019] Services barrel `src/lib/services/index.ts` exports all 10 services.
- [D020] Tools directory split into domain subdirs: core, communication, math, science, scheduling.

## KNOWLEDGE_GRAPH
User -> [Zustand Store] -> [LearningOrchestrator] -> [QuestionEngine] -> [AI Providers]
User -> [QueueCore] -> [Appwrite] -> [Analytics/Progress]
RouteHandler -> [createRouteHandler] -> [Auth Guard + Validation + Exec]
FlashcardEngine -> [DexieRepository + SM-2/FSRS + DailyLimits]
Services -> [ServiceResult<T>] -> [Analytics, Competency, Progress, Notification, ...]

## REUSABLE_SNIPPETS
- **Route Handler**: `export const POST = createRouteHandler({ auth: "required", schema: z.object({...}), async exec({ body, user }) {...} });`
- **Math**: `$E = mc^2$` for inline, `$$\sum_{i=1}^n i = \frac{n(n+1)}{2}$$` for display.
- **Service Result**: `if (!result.success) return failure(result.error); return success(result.data);`

## AVOID_LIST
- ❌ No arbitrary pixel values. Use design tokens.
- ❌ No `space-y-*` for layout. Use `flex flex-col` + `gap-*`.
- ❌ No `\(...\)` delimiters — only dollar signs for KaTeX.
- ❌ No magic z-index numbers. Use semantic `--z-*` scale.
- ❌ No `lottie-react`. Use `@lottiefiles/dotlottie-react`.

## PROMPT_LOOKUP_TABLE
- Architecture -> `system-design.md`
- Code Signatures -> `code-signatures.json`
- History/Decisions -> `memory-index.md`
- Prompt Library -> `prompt-index.md`
- File Map -> `repo-index.md`
