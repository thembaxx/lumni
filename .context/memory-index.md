<!-- LAST_SYNC: 2026-05-29 -->
# Memory Index — Lumni

## Facts
- **Frameworks**: Next.js 16.2.6 (App Router), React 19.2.6, TypeScript 6.0.3.
- **Architecture**: Offline-first using Dexie 4 (L1 cache) and Appwrite (L2 remote storage).
- **AI Chain**: Gemini 2.0 Flash Lite (primary) -> Nvidia NIM (Llama 3.3 70B) -> Groq (Llama 3.3 70B).
- **Math Rendering**: KaTeX with dollar-sign delimiters (`$...$` for inline, `$$...$$` for display).
- **Design System**: "Emerald Study Room" with Study Green accent and Apple-inspired glass effects. Strict tokens for spacing, radius, and shadows.
- **Persistence**: Dexie schema v23 includes 30+ tables (questions, progress, quizPacks, flashcards, examDates, etc.).
- **Exam Schedules**: May/June and Oct/Nov 2026 national exam schedules integrated via seed data.

## Decisions
- **Orchestration**: `LearningOrchestrator` composes `QuestionEngine` for clean separation of generation/grading from side effects (sync, progress).
- **Anonymous Gating**: Soft gating for anonymous users; Sign In button in nav, referrals hidden, profile/dashboard stats replaced with upsell illustrations.
- **Flashcard Engine**: Unified into `src/lib/flashcard-engine/` wrapping SM-2/FSRS algorithms, daily limits, and leech detection.
- **Immersive Mode**: Auto-activates during quiz/exam sessions to hide navigation and focus on content.
- **Offline Packs**: `QuizPackService` enables bulk AI generation and local storage for offline practice.
- **Exam Dates Sync**: Server-side sync implemented for `exam_dates` collection to ensure global L2 availability.
- **Route Handlers**: `createRouteHandler` factory used for all new API routes to handle auth, Zod validation, and budget tracking.
- **Immersive UI**: Swipeable Tinder-style flashcards with quality-pick overlay for SM-2 fine-tuning.

## Patterns
- **Repository Pattern**: All DB access abstracted via repositories in `src/lib/db/repositories/`.
- **QueueCore**: Persistent job queue with exponential backoff for all background tasks (sync, visuals, progress).
- **ServiceResult**: Unified `{ success: true; data: T } | { success: false; error: string }` return type for all services.
- **Immersive Mode Context**: `ImmersiveModeProvider` manages global state for hiding navigation.
- **Atomic Components**: Split `src/components/tools/` into domain-specific subdirectories.
- **Zod for API**: All POST/PUT requests validated via Zod schemas in `createRouteHandler`.

## Failures & Lessons
- **PDF Extraction**: Official DBE PDFs are image-based; standard text extraction fails. Requires manual seed data or AI vision OCR.
- **AI Budget**: Strict per-user and global caps (2000 total calls/day) to prevent free-tier exhaustion.
- **Next.js Build**: Use `npx next build` instead of `bunx --bun` to avoid worker git-clone compatibility issues.
- **Competency Fields**: Resolved mismatch where job processor wrote `proficiency` but API read `score`. Use `score`.
- **Sync Duplication**: Consolidation of multiple sync hooks into `QueueCore` resolved redundant server writes.

## Contacts / Resources
- **Domain Glossary**: `CONTEXT.md`
- **Design System**: `DESIGN.md`
- **Exam Specs**: `SPEC.md`
- **Architecture**: `system-design.md`
- **History**: `MEMORY.md`, `implementation-notes.md`
