<!-- LAST_SYNC: 2025-01-24 -->
# Master Context — Lumni

## PROJECT_IDENTITY
AI-powered South African Matric (Grade 12) exam preparation platform. Offline-first architecture using Dexie (L1) and Appwrite (L2). Design system is "Emerald Study Room" (Tailwind 4).

## CURRENT_FOCUS
Polish & hardening phase complete. Currently focusing on finalizing the Appwrite SA Region migration and unblocking external integrations (WhatsApp Business API). Preparing for next phase of feature development (Mock exam mode improvements, OCR integration).

## KEY_CONSTRAINTS
- **AI Budget**: 2000 global calls/day. Strict per-user caps: 20 gen, 100 grade, 20 hint, 50 visual.
- **Offline-First**: Dexie is the source of truth for all client reads; all writes must be queued via `QueueCore`.
- **Math**: Strictly use `$...$` for inline and `$$...$$` for display math (KaTeX).
- **Design**: No arbitrary pixels or magic z-index. Use semantic tokens.
- **Privacy**: Dual-write (Dexie + Appwrite) for consent with AI/Sentry gates.

## DEFINITIONS
- **QuestionEngine**: Single source of truth for all 11 question types.
- **FlashcardEngine**: Unified SR logic (SM-2/FSRS) + daily limits + leech detection.
- **Immersive Mode**: UI state that auto-hides core navigation for focus.
- **Quiz Pack**: AI-generated question sets for offline study.
- **QueueCore**: Background job queue for synchronization consistency.

## DECISION_LOG
- [D035] **WCAG 2.2 AA**: 30+ components audited; 19 critical/high fixes applied (labels, focus-visible, aria-live, keyboard).
- [D036] **Teacher/Parent Portals**: Fully wired dashboards with student linking and engagement stats.
- [D037] **Appwrite SA Region**: Endpoint migrated to `jnb.cloud.appwrite.io` across all configurations.
- [D038] **Snap-to-Answer**: Integrated Photo Math scanner with an event bus for auto-filling quiz inputs.
- [D039] **Monetization E2E**: Full Stripe/Payfast integration with webhook-driven subscription management.

## KNOWLEDGE_GRAPH
- `LearningOrchestrator` → `QuestionEngine` → `AI Providers` (Gemini/Nvidia/Groq)
- `FlashcardEngine` → `Dexie` → `QueueCore` → `Appwrite`
- `QuizPackService` → `QuestionEngine` → `Dexie` (v24)
- `TeacherService` → `Appwrite` (Assignments, Student Linking)
- `UserConsentService` → `Dexie` → `QueueCore` → `Appwrite` (dual-write)

## REUSABLE_SNIPPETS
- **API Route**: `export const POST = createRouteHandler({ auth: 'required', schema: z.object({...}), handler: async (data, ctx) => {...} });`
- **Math Rendering**: `<MarkdownRenderer content="$E=mc^2$" subject="physical-sciences" />`
- **Competency Tracking**: `await trackQuestionResult(questionId, score, subject, topic);`
- **Immersive Mode**: `const { setIsImmersive } = useImmersiveMode();`

## AVOID_LIST
- **Space-y**: Avoid `space-y-*`, use `flex-col` + `gap-*`.
- **Arbitrary Values**: Prohibited `w-[200px]`, `z-50`, `rounded-[2.5rem]`.
- **Direct Appwrite Writes**: Use `QueueCore` for sync consistency.
- **DeepSeek**: Removed from AI chain due to cost.

## PROMPT_LOOKUP_TABLE
- If working on **Engines**, check `prompt-index.md` > `agent-engine-architecture`.
- If working on **UI/Design**, check `prompt-index.md` > `design-system-emerald`.
- If performing a **UI Audit**, check `prompt-index.md` > `impeccable-ui-audit`.
