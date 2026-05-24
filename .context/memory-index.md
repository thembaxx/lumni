<!-- LAST_SYNC: 2026-05-24 -->
# Memory Index — Lumni

## Facts
- **Frameworks**: Uses Next.js 16.2.6 and React 19.2.6.
- **Architecture**: Offline-first using Dexie (IndexedDB) for L1 caching and Appwrite for remote synchronization.
- **AI Chain**: Primary provider is Gemini 2.0 Flash Lite, followed by Nvidia NIM, and Groq as the fallback.
- **Math**: Renders math using KaTeX with dollar-sign delimiters (`$...$` for inline, `$$...$$` for display).
- **Question Types**: Supports 11 types including MCQ, calculation, diagram, and programming.
- **Design**: Follows the "Emerald Study Room" aesthetic with Study Green accent and Apple-inspired glass effects.

## Decisions
- **Orchestration**: `LearningOrchestrator` composes `QuestionEngine` to handle side effects like sync and progress tracking (2026-05-15).
- **Caching**: 3-tier strategy: Dexie L1 -> Appwrite L2 -> AI/Wikimedia L3 (2026-05-11).
- **Grading**: Local grading for selected-response types; AI grading for constructed-response types (2026-05-11).
- **User Identity**: Anonymous users auto-upgraded to authenticated via `updateEmail` (2026-05-22).
- **AI Models**: Switched from DeepSeek to Gemini/Nvidia/Groq due to credit costs (2026-05-13).

## Patterns
- **Repository Pattern**: All database access is abstracted through typed repositories in `src/lib/db/repositories/`.
- **Zod Validation**: All API route bodies are validated using Zod schemas.
- **QueueCore**: Generic persistent job queue with exponential backoff for all background tasks.
- **Bloom's Taxonomy**: Questions and competencies are mapped to Bloom's levels (Remember, Understand, Apply, etc.).
- **Visual Pre-caching**: Diagrams are generated in the background during question generation to ensure they are ready for display.

## Contacts / Resources
- **Domain Glossary**: `CONTEXT.md` (shared vocabulary).
- **Design System**: `DESIGN.md` (colors, typography, components).
- **Exam Dates Tracker**: `SPEC.md` (national exam schedule integration).
- **Issue Tracker**: Tracked via GitHub issues and managed via `gh` CLI.
