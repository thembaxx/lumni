<!-- LAST_SYNC: 2025-01-24 -->
# Memory Index — Lumni

## Heuristics & Conventions
- **Math Delimiters**: Strictly use `$...$` for inline and `$$...$$` for display math (KaTeX).
- **Design Tokens**: No arbitrary pixels. Use `--space-*`, `--fs-*`, `shadow-level-*`, `rounded-card-lg` (40px), `rounded-lg` (20px).
- **Layout**: Use `<PageContainer>` for all standard pages. Avoid `space-y-*`, use `flex-col` + `gap-*`.
- **API Routes**: Always use `createRouteHandler` factory with Zod schemas and explicit auth guards.
- **Offline-First**: All reads hit Dexie L1 first; all writes queued via `QueueCore`.
- **Accessibility**: All interactive elements must have `focus-visible` rings; icon-only buttons must have `aria-label`.

## Architectural Decisions
- [2026-05-11] **Multi-Tier Caching**: Dexie L1 (Primary) → Appwrite L2 → AI/Wiki L3 (Fallback).
- [2026-05-13] **AI Provider Chain**: Gemini 2.0 Flash Lite → Nvidia NIM → Groq (DeepSeek removed).
- [2026-05-15] **Composition Rule**: `LearningOrchestrator` composes `QuestionEngine` for orchestration side effects.
- [2026-05-20] **Unified Competency**: `trackQuestionResult()` is the single source of truth for progress.
- [2026-05-24] **Flashcard Consolidation**: Unified `FlashcardEngine` in `src/lib/flashcard-engine/`.
- [2026-05-24] **Generic Routes**: `createRouteHandler` factory replaces boilerplate across API routes.
- [2026-05-26] **Offline Quiz Packs**: `QuizPackService` enables bulk generation and Dexie persistence.
- [2026-05-28] **Swipeable Cards**: Tinder-style flashcard deck with SM-2 quality picker.
- [2026-05-28] **Immersive Mode**: Full-screen focus mode for quiz/exams, auto-hiding navigation.
- [2026-06-05] **B2B2C Dashboards**: Teacher/Parent portals wired with role-based gating and consent infrastructure.
- [2026-06-10] **WCAG Hardening**: Codebase-wide accessibility audit and critical fixes applied.

## Past Bugs & Failures
- **Competency Field**: Mismatch between `proficiency` and `score` fields. Standardized on `score`.
- **Lottie Unpin**: `lottie-react` unpin issue resolved by migrating to `@lottiefiles/dotlottie-react`.
- **Next.js Worker**: Build fails with `bunx --bun next build`. Use `npx next build`.
- **TTS Leak**: Multi-subscriber callback bug in `TTSService` fixed by clearing subscribers on unmount.
- **Middleware Proxy**: Collision between `middleware.ts` and `proxy.ts` resolved by merging into `proxy.ts`.
- **Study Planner Mock**: Missing exports in tests fixed by updating mocks in `setup.ts`.
- **Visual Engine Premium**: Premium gating in `useVisualEngine` caused silent test failures; fixed with proper mocks.

## Contacts / Resources
- **Domain glossary**: `CONTEXT.md`
- **Design system**: `DESIGN.md`
- **Product context**: `PRODUCT.md`
- **National Exam Dates spec**: `SPEC.md`
- **UI/UX Audit**: `.agents/skills/impeccable/`
