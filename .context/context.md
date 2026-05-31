<!-- LAST_SYNC: 2026-06-01 -->
# Master Context — Lumni

## PROJECT_IDENTITY
AI-powered South African Matric (Grade 12) exam preparation platform. Offline-first architecture using Dexie (L1) and Appwrite (L2). Design system is "Emerald Study Room" (Tailwind 4).

## CURRENT_FOCUS
Polish & hardening phase complete: WCAG 2.2 AA audit done (19 critical/high fixes), test suite hardened (1109 pass), GDPR/POPIA consent suite fully implemented. Active: continued polish — keyboard accessibility, prefers-reduced-motion, quiz input labels.

## KEY_CONSTRAINTS
- **AI Budget**: 2000 global calls/day. Strict per-user caps: 20 gen, 100 grade, 20 hint, 50 visual.
- **Offline-First**: Dexie is the source of truth for all client reads; all writes must be queued via `QueueCore`.
- **Math**: Strictly use `$...$` for inline and `$$...$$` for display math (KaTeX).
- **Design**: No arbitrary pixels or magic z-index. Use semantic tokens.

## DEFINITIONS
- **QuestionEngine**: Single source of truth for all 11 question types.
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

## KNOWLEDGE_GRAPH
- `LearningOrchestrator` → `QuestionEngine` → `AI Providers` (Gemini/Nvidia/Groq)
- `FlashcardEngine` → `Dexie` → `QueueCore` → `Appwrite`
- `QuizPackService` → `QuestionEngine` → `Dexie` (v24)
- `UserConsentService` → `Dexie` → `QueueCore` → `Appwrite` (dual-write)

## REUSABLE_SNIPPETS
- **API Route**: `export const POST = createRouteHandler({ auth: 'required', schema: z.object({...}), handler: async (data, ctx) => {...} });`
- **Math Rendering**: `<MarkdownRenderer content="$E=mc^2$" subject="physical-sciences" />`
- **Competency Tracking**: `await trackQuestionResult(questionId, score, subject, topic);`

## AVOID_LIST
- **Space-y**: Avoid `space-y-*`, use `flex-col` + `gap-*`.
- **Arbitrary Values**: Prohibited `w-[200px]`, `z-50`, `rounded-[2.5rem]`.
- **Direct Appwrite Writes**: Use `QueueCore` for sync consistency.
- **DeepSeek**: Removed from AI chain due to cost.

## PROMPT_LOOKUP_TABLE
- If working on **Engines**, check `prompt-index.md` > `agent-engine-architecture`.
- If working on **UI/Design**, check `prompt-index.md` > `design-system-emerald`.
- If performing a **UI Audit**, check `prompt-index.md` > `impeccable-ui-audit`.
