<!-- LAST_SYNC: 2026-05-31 -->
# System Design — Lumni

## Overview & Goals
Lumni is a mobile-first South African Matric exam prep platform. It provides offline-capable practice, AI-powered grading, and algorithmic study planning. The platform prioritizes offline availability through local AI generation (Quiz Packs), on-device caching (Dexie), and immersive focus modes.

## Architecture Diagram
```mermaid
graph TD
    Client[Browser: Next.js/React]
    Dexie[(Dexie L1 Cache)]
    Appwrite[(Appwrite L2 Storage)]
    API[Next.js API Routes]
    Engine[Question Engine]
    Visual[Visual Engine]
    Pack[Quiz Pack Service]
    AI[AI: Gemini/Nvidia/Groq]
    Wiki[Wikimedia Commons]
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
    Engine <--> AI
    Visual <--> AI
    Visual <--> Wiki
    Pack <--> Engine
    Queue <--> Dexie
    Queue <--> Appwrite
```

## Data Flow
1. **Multi-Tier Caching**: User requests content. L1 (Dexie) is primary; L2 (Appwrite) is secondary; L3 (AI/Wiki) is fallback.
2. **Offline Practice**: `QuizPackService` enables bulk generation and storage in `quizPacks`/`packQuestions` Dexie tables for offline-first access.
3. **Question Processing**: Grading (local/AI) is orchestrated by `LearningOrchestrator`, which enqueues sync and progress jobs via `QueueCore`.
4. **Competency tracking**: Progress is assessed via `trackQuestionResult()`, updating the local `competency` table and syncing to Appwrite `competencies` collection.
5. **Monetization**: `PremiumProvider` gates features (offline packs, advanced analytics) based on Appwrite `premium_subscriptions`. Stripe/Payfast webhooks handle status updates.
6. **B2B2C Flows**: Teachers create assignments via `teacher_assignments` collection; students view them via `student/assignments` route. Parents monitor progress via `ParentShell` using linked `teacher_students` relationships.
7. **Observability**: `latency-tracker` monitors AI provider performance; `events.ts` tracks usage events to localStorage/Appwrite.

## Tech Stack
- **Frontend**: Next.js 16.2.6 (App Router), React 19.2.6, Tailwind CSS 4, Framer Motion 12.
- **Persistence**: Dexie 4 (IndexedDB, v23 schema), Appwrite Cloud, sql.js (SQLite).
- **AI/ML**: Gemini 2.0 Flash Lite (Primary), Nvidia NIM (Fallback), Groq Cloud (Last resort).
- **Visualization**: Konva (STEM diagrams), Mermaid.js, Recharts 3.
- **Verification**: Playwright (E2E), Storybook (UI), Bun (Tests).

## Key Abstractions
- **QuestionEngine**: Single source of truth for generation/grading/validation of 11 question types.
- **FlashcardEngine**: Unified SM-2/FSRS engine wrapping repository, limits, and recovery logic.
- **LearningOrchestrator**: Orchestrates engines and manages side effects (sync, analytics, jobs).
- **createRouteHandler**: Declarative factory for API routes with auth, Zod validation, and AI budgeting.
- **ImmersiveMode**: Context-driven UI state for hiding core navigation components.
- **SnapAnswer**: Event-bus for injecting OCR results from photo-math scanner into quiz/flashcard inputs.

## External Integrations
- **Appwrite**: Authentication, Database (10+ collections), Storage.
- **AI Providers**: Google Gemini, Nvidia NIM, Groq Cloud.
- **Payments**: Stripe, Payfast.
- **UploadThing**: Document and avatar storage.
- **Wikimedia**: Image search fallback for non-STEM visuals.
