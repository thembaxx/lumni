---
title: Memory Index
last_sync: 2026-05-31
tags: [architecture, decisions, heuristics]
---

# Memory Index — Lumni

## Heuristics & Conventions
- **Math Delimiters**: Strictly use `$...$` (inline) and `$$...$$` (display).
- **Design Tokens**: No arbitrary pixels. Use `--space-*`, `--fs-*`, `shadow-level-*`, `rounded-card-lg`.
- **Layout**: Use `<PageContainer>` for all standard pages. Avoid `space-y-*`, use `flex-col` + `gap-*`.
- **API Routes**: Always use `createRouteHandler` factory with Zod schemas and explicit auth guards.
- **Offline-First**: All reads hit Dexie L1 first; all writes queued via `QueueCore`.

## Architectural Decisions
- [2026-05-24] **Flashcard Engine**: Unified SR logic (SM-2/FSRS) into `src/lib/flashcard-engine/` with singleton access.
- [2026-05-27] **Immersive Mode**: Context-driven `ImmersiveModeProvider` auto-hides navigation during active sessions.
- [2026-05-28] **Tinder-Style Deck**: Swipable 3-card cascade for flashcards with `QualityPicker` SM-2 overlay.
- [2026-05-30] **Mega-Component Decomposition**: Overgrown files (profile, quiz, auth) split into co-located subdirectories.
- [2026-05-30] **B2B2C Dashboards**: Dedicated roles for teachers/parents with linked student progress monitoring.

## Past Bugs & Failures
- **Next.js Worker**: `bunx --bun next build` fails due to worker git-clone compat. Use `npx next build`.
- **Competency Sync**: Mismatch between `proficiency` and `score` fields. Standardized on `score`.
- **TTS Leak**: Multi-subscriber callback bug in `TTSService` fixed by clearing subscribers on unmount.
- **Middleware Proxy**: Collision between `middleware.ts` and `proxy.ts` resolved by merging into `proxy.ts`.

## Deployment & Environments
- **Appwrite**: SA Region (`jnb.cloud.appwrite.io`) used for low-latency access in South Africa.
- **AI Providers**: Gemini 2.0 Flash Lite -> Nvidia NIM (Llama 3.3 70B) -> Groq.
