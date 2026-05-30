<!-- LAST_SYNC: 2026-05-29 -->
# Master Context — Lumni

## PROJECT_IDENTITY
Lumni is a mobile-first South African Matric prep platform featuring offline-first architecture, AI-powered educational engines, and "The Emerald Study Room" design system.

## CURRENT_FOCUS
Stabilizing offline-first sync, expanding AI Quiz Packs for fully offline practice, and implementing national exam tracking and immersive study experiences.

## KEY_CONSTRAINTS
- **AI Budget**: 2000 global calls/day; strict user caps (20 gen, 100 grade, 20 hint, 50 visual).
- **Offline-First**: All reads must prioritize Dexie; all writes must be sync-queued via `QueueCore`.
- **Math Delimiters**: Strictly use `$...$` (inline) and `$$...$$` (display).
- **Design Tokens**: Strict enforcement of OKLCH colors, semantic shadows (`shadow-level-1/2/3`), and radius (`rounded-card-lg`).
- **Anonymous Gating**: Users are anonymous by default; soft gating redirects to sign-in for referrals/analytics/sync.

## DEFINITIONS
- **QuestionEngine**: Single source of truth for generation/grading at `src/lib/question-engine/`.
- **FlashcardEngine**: Unified engine for SR (SM-2/FSRS) at `src/lib/flashcard-engine/`.
- **Emerald Design**: Aesthetic defined in `DESIGN.md` using Tailwind v4 and semantic tokens.
- **Quiz Packs**: Downloadable AI question sets for offline use, managed by `QuizPackService`.
- **Immersive Mode**: nav-hiding UI state for focus, managed by `ImmersiveModeProvider`.

## DECISION_LOG
- [D024] `ImmersiveModeProvider` auto-hides navigation during active sessions.
- [D025] Swipeable Tinder-style flashcards with quality-pick overlay.
- [D026] Anonymous soft gating replaces profile/referrals with upsell illustrations.
- [D027] `ExamDatesService` uses seed data for 2026 with background sync to Appwrite.
- [D028] Playwright for E2E testing; Storybook for UI documentation.

## KNOWLEDGE_GRAPH
User -> [ImmersiveMode] -> [Quiz/Exam View] -> [QuestionEngine] -> [AI Providers]
User -> [QuizPackService] -> [Offline Packs] -> [Dexie Storage]
User -> [FlashcardEngine] -> [Swipeable Deck] -> [Dexie/Appwrite]
API -> [createRouteHandler] -> [Auth + Zod + Budget] -> [Service Logic]

## REUSABLE_SNIPPETS
- **Immersive Exit**: `<ExitImmersiveButton />` (appears only in immersive mode).
- **API Route**: `export const POST = createRouteHandler({ auth: "required", schema: z.object({...}), async exec({ body, user }) {...} });`
- **Math**: `$E = mc^2$` for inline, `$$\sum_{i=1}^n i = \frac{n(n+1)}{2}$$` for display.
- **Service Result**: `if (!result.success) return failure(result.error); return success(result.data);`

## AVOID_LIST
- ❌ No arbitrary pixel values or magic z-indices. Use design tokens.
- ❌ No `space-y-*` for layout. Use `flex flex-col` + `gap-*`.
- ❌ No `\(...\)` delimiters — only dollar signs for KaTeX.
- ❌ No arbitrary shadows — use `shadow-level-1/2/3`.
- ❌ No `bunx --bun next build` — use `npx next build`.

## PROMPT_LOOKUP_TABLE
- Architecture -> `system-design.md`
- Code Signatures -> `code-signatures.json`
- History/Decisions -> `memory-index.md`
- Prompt Library -> `prompt-index.md`
- File Map -> `repo-index.md`
- Exam Dates -> `SPEC.md`
