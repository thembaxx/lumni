<!-- LAST_SYNC: 2026-06-02 -->
# System Design — Lumni

## Overview & Goals
Lumni is a mobile-first South African Matric exam prep platform. It provides offline-capable practice, AI-powered grading, algorithmic study planning, and web-grounded RAG injection for both solve and quiz generation (via TinyFish). The platform prioritizes offline availability through local AI generation (Quiz Packs), on-device caching (Dexie), and immersive focus modes.

## Architecture Diagram
```mermaid
graph TD
    Client[Browser: Next.js/React]
    Dexie[(Dexie L1 Cache<br/>v25, 33 tables)]
    Appwrite[(Appwrite L2 Storage)]
    API[Next.js API Routes]
    Engine[Question Engine]
    Visual[Visual Engine]
    Pack[Quiz Pack Service]
    AI[AI: Gemini/Nvidia/Groq]
    Wiki[Wikimedia Commons]
    RAG[TinyFish RAG<br/>search + fetch]
    Queue[QueueCore Job Queue]
    Auth[Appwrite Auth / Anon Gating]
    Stripe[Stripe/Payfast Payments]

    Client <--> Dexie
    Client <--> Auth
    Client <--> API
    API <--> Appwrite
    API <--> Engine
    API <--> Visual
    API <--> Pack
    API <--> Stripe
    API --> RAG
    Engine <--> AI
    Engine --> RAG
    Visual <--> AI
    Visual <--> Wiki
    Pack <--> Engine
    Queue <--> Dexie
    Queue <--> Appwrite
```

## Data Flow
1. **Multi-Tier Caching**: User requests content. L1 (Dexie) is primary; L2 (Appwrite) is secondary; L3 (AI/Wiki/TinyFish) is fallback.
2. **Web-Grounded AI (RAG)**: `/api/solve` and `/api/engine/generate` call `src/lib/tinyfish/` to inject live CAPS/DBE sources into the AI prompt. Cached for 14d (quiz) or 24h (solve). In-flight dedup + 3s timeout fail-open. 24-subject allowlist + per-user daily cap.
3. **Offline Practice**: `QuizPackService` enables bulk generation and storage in `quizPacks`/`packQuestions` Dexie tables for offline-first access.
4. **Question Processing**: Grading (local/AI) is orchestrated by `LearningOrchestrator`, which enqueues sync and progress jobs via `QueueCore`.
5. **Competency tracking**: Progress is assessed via `trackQuestionResult()`, updating the local `competency` table and syncing to Appwrite `competencies` collection.
6. **Monetization**: `PremiumProvider` gates features (offline packs, advanced analytics) based on Appwrite `premium_subscriptions`.
7. **B2B2C Flows**: Teachers manage assignments via `teacher_assignments`; parents monitor progress via `ParentShell`.
8. **Observability**: `latency-tracker` monitors AI performance; `events.ts` tracks usage events.

## Tech Stack
- **Frontend**: Next.js 16.2.6, React 19.2.6, Tailwind CSS 4, Framer Motion 12.
- **Persistence**: Dexie 4 (IndexedDB, v25 schema — 33 tables including `tinyfishCache` + `tinyfishUsage`), Appwrite Cloud, sql.js (SQLite).
- **AI/ML**: Gemini 2.0 Flash Lite (Primary), Nvidia NIM (Fallback), Groq Cloud (Last resort). TinyFish (RAG) for web-grounded solve + quiz.
- **Visualization**: Konva (STEM diagrams), Mermaid.js, Recharts 3.
- **Verification**: Playwright (E2E), Storybook (UI), Bun (Tests).

## Key Abstractions
- **QuestionEngine**: Single source of truth for generation/grading/validation of 11 question types. RAG-augmented via `PromptManager`.
- **FlashcardEngine**: Unified SM-2/FSRS engine wrapping repository, limits, and recovery logic.
- **LearningOrchestrator**: Orchestrates engines and manages side effects (sync, analytics, jobs).
- **TinyFish RAG**: 7 modules — client, cache (Dexie 14d), in-flight dedup, 24-subject allowlist, XML wrap + prompt framing, types, index barrel.
- **createRouteHandler**: Declarative factory for API routes with auth and Zod validation.
- **ImmersiveMode**: Context-driven UI state for focus (auto-hides nav bars).
- **SwipeableCardDeck**: Tinder-style interaction for spaced-repetition flashcards.

## External Integrations
- **Appwrite**: Authentication, Database, Storage.
- **AI Providers**: Google Gemini, Nvidia NIM, Groq Cloud.
- **RAG**: TinyFish (search + fetch, free tier, consent-gated).
- **Payments**: Stripe, Payfast.
- **UploadThing**: Document and avatar storage.

## Current Limitations & TODOs
- **Mock exam mode**: Past-paper simulation is still in development.
- **OCR text extraction**: Official PDF timetables require OCR for automated ingestion.
- **Comparative analytics**: Scaling depends on cross-user data aggregation in Appwrite.
- **Rate limiting**: Current implementation is in-memory; requires Redis for multi-instance.
- **Per-question source persistence**: RAG sources are batch-level only via `QuestionEngine.lastRagContext`; per-question attribution deferred.
- **VerifiedByPill on quiz results**: Solve-only today; UI for quiz results page deferred.

## Recent Changes Log (Last 7 Days)
- Initialized Context Layer with 6-file protocol.
- Deployed Swipeable Card Deck for flashcards.
- Activated Full-Screen Immersive Mode for active sessions.
- Consolidated Spaced Repetition logic.
- **Shipped TinyFish RAG across 3 PRs** (`f5313f32` foundation + Dexie v25, `6c7c2ff1` solve + VerifiedByPill, `dd3940c4` quiz + rag-enricher + 3s timeout). 1197 tests pass.
