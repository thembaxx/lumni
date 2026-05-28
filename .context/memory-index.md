<!-- LAST_SYNC: 2026-05-28 -->
# Memory Index — Lumni

## Facts
- **Frameworks**: Uses Next.js 16.2.6 and React 19.2.6.
- **Architecture**: Offline-first using Dexie (IndexedDB) for L1 caching and Appwrite for remote synchronization.
- **AI Chain**: Primary provider is Gemini 2.0 Flash Lite, followed by Nvidia NIM, and Groq as the fallback.
- **Math**: Renders math using KaTeX with dollar-sign delimiters (`$...$` for inline, `$$...$$` for display).
- **Question Types**: Supports 11 types including MCQ, calculation, diagram, and programming.
- **Design**: Follows the "Emerald Study Room" aesthetic with Study Green accent and Apple-inspired glass effects.
- **Competency**: Mapped to Bloom's Taxonomy (Novice→Remember, Developing→Understand/Apply, Proficient→Apply/Analyze, Mastered→Evaluate/Create).
- **E2E Testing**: Uses Playwright for end-to-end verification.
- **UI Documentation**: Uses Storybook for component isolation and documentation.

## Decisions
- **Orchestration**: `LearningOrchestrator` composes `QuestionEngine` to handle side effects like sync and progress tracking (2026-05-15).
- **Caching**: 3-tier strategy: Dexie L1 -> Appwrite L2 -> AI/Wikimedia L3 (2026-05-11).
- **Grading**: Local grading for 4 types (MCQ, matching, calculation, short-answer fallback); AI grading for 7 types (2026-05-11).
- **User Identity**: Anonymous users auto-upgraded to authenticated via `updateEmail` (2026-05-22).
- **Flashcard Engine**: Unified into `src/lib/flashcard-engine/` wrapping repositories, SM-2/FSRS algorithms, and daily limits (2026-05-24).
- **Route Handlers**: Use `createRouteHandler` factory for declarative auth, validation, and error handling (2026-05-24).
- **Services**: Consolidated into `src/lib/services/index.ts` with `ServiceResult<T>` wrapper (2026-05-24).
- **Offline Packs**: Implemented `QuizPackService` to allow users to download AI-generated question sets for offline use (2026-05-28).
- **Exam Dates Sync**: Added server-side write path to Appwrite for national exam dates to ensure L2 cache availability (2026-05-28).

## Patterns
- **Repository Pattern**: All database access is abstracted through typed repositories in `src/lib/db/repositories/`.
- **Zod Validation**: All API route bodies are validated using Zod schemas via `createRouteHandler`.
- **QueueCore**: Generic persistent job queue with exponential backoff for all background tasks (sync, jobs).
- **Visual Pre-caching**: Diagrams are generated in the background during question generation to ensure they are ready for display.
- **Design Tokens**: Strict enforcement of OKLCH colors, semantic z-indices, and `gap-*` for spacing.
- **ServiceResult**: All business logic services return a unified `ServiceResult<T>` to simplify error handling in the UI and API.

## Failures & Lessons
- **PDF Extraction**: Official DBE PDFs are image-based; standard extraction fails. Requires manual entry or future AI vision OCR.
- **AI Provider Costs**: DeepSeek removed due to credit exhaustion; Gemini 2.0 Flash Lite is the new primary.
- **Sync Logic**: Consolidation of multiple sync hooks into a single `QueueCore` processor resolved duplication bugs.
- **Competency Fields**: Fixed mismatch between `proficiency` and `score` fields in sync/API paths.
- **Next.js Worker Clone**: `bunx --bun next build` fails in some environments due to git-clone worker issues; use `npx next build` for stability.

## Contacts / Resources
- **Domain Glossary**: `CONTEXT.md` (shared vocabulary).
- **Design System**: `DESIGN.md` (colors, typography, components).
- **Exam Dates Tracker**: `SPEC.md` (national exam schedule integration).
- **Issue Tracker**: Managed via GitHub issues and `gh` CLI.
- **Storybook**: Accessible via `npm run storybook` for component previews.
