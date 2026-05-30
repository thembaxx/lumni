<!-- LAST_SYNC: 2026-05-30 -->
# Master Context — Lumni

## PROJECT_IDENTITY
Lumni is a mobile-first South African Matric prep platform featuring offline-first architecture, AI-powered educational engines, and "The Emerald Study Room" design system.

## CURRENT_FOCUS
Stabilization of B2B features (Parent/Teacher dashboards), refining immersive learning experiences (swipeable deck, full-screen mode), and hardening the offline-first sync layer.

## KEY_CONSTRAINTS
- **AI Budget**: 2000 global calls/day; per-user caps (20 gen, 100 grade, 20 hint, 50 visual).
- **Offline-First**: All reads must prioritize Dexie; all writes must be sync-queued via `QueueCore`.
- **Math Delimiters**: Strictly use `$...$` (inline) and `$$...$$` (display).
- **Appwrite Limits**: 50k document cap requires periodic cleanup of cached questions.
- **Design Tokens**: No hardcoded values; use OKLCH colors and semantic shadows/spacing/z-index.
- **SA Region**: Endpoint set to `jnb.cloud.appwrite.io`.

## DEFINITIONS
- **QuestionEngine**: Core module for question lifecycle (gen/grade/validate) at `src/lib/question-engine/`.
- **Emerald Design**: Aesthetic defined in `DESIGN.md` using `oklch` colors and Tailwind v4.
- **Quiz Packs**: Downloadable AI-generated question sets stored locally for offline practice.
- **QueueCore**: Persistent job queue processor for sync and background tasks.

## DECISION_LOG
- [D001] `LearningOrchestrator` composes `QuestionEngine` for clean separation.
- [D018] Flashcard engine consolidated into `src/lib/flashcard-engine/`.
- [D019] Route handler factory `createRouteHandler()` for declarative API logic.
- [D021] Playwright for E2E testing; Storybook for UI documentation.
- [D022] ImmersiveModeProvider for full-screen quiz/exam.
- [D023] SwipeableCardDeck with SM-2 quality picker.
- [D024] Mega-component breakdown sprint for maintainability.

## KNOWLEDGE_GRAPH
User -> [Zustand Store] -> [LearningOrchestrator] -> [QuestionEngine] -> [AI Providers]
Teacher -> [TeacherService] -> [teacher_assignments] -> Student -> [MyAssignments]
User -> [QuizPackService] -> [Offline Pack Management] -> [Dexie Storage]
RouteHandler -> [createRouteHandler] -> [Auth Guard + Validation + Budget + Exec]

## REUSABLE_SNIPPETS
- **Route Handler**: `export const POST = createRouteHandler({ auth: "required", schema: z.object({...}), async exec({ body, user }) {...} });`
- **Math**: `$E = mc^2$` for inline, `$$\sum_{i=1}^n i = \frac{n(n+1)}{2}$$` for display.
- **Service Result**: `if (!result.success) return failure(result.error); return success(result.data);`
- **Snap Answer**: `dispatchSnapAnswer(text);` and `useSnapAnswer((text) => setAnswer(text));`

## AVOID_LIST
- ❌ No arbitrary pixel values. Use design tokens (`--space-*`, `--fs-*`).
- ❌ No `space-y-*` for layout. Use `flex flex-col` + `gap-*`.
- ❌ No `\(...\)` delimiters — only dollar signs for KaTeX.
- ❌ No magic z-index numbers. Use semantic `--z-*` scale.
- ❌ No `lottie-react`. Use `@lottiefiles/dotlottie-react`.
- ❌ No `middleware.ts`. Use `src/proxy.ts` for auth/proxy logic.

## PROMPT_LOOKUP_TABLE
- Architecture -> `system-design.md`
- Code Signatures -> `code-signatures.json`
- History/Decisions -> `memory-index.md`
- Prompt Library -> `prompt-index.md`
- File Map -> `repo-index.md`
