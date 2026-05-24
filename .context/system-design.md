<!-- LAST_SYNC: 2026-05-24 -->
# System Design — Lumni

## Overview & Goals
Lumni is a mobile-first South African Matric exam prep platform. It provides offline-capable practice, AI-powered grading, and algorithmic study planning to help students improve their results.

## Architecture Diagram
```mermaid
graph TD
    Client[Browser: Next.js/React]
    Dexie[(Dexie L1 Cache)]
    Appwrite[(Appwrite L2 Storage)]
    API[Next.js API Routes]
    Engine[Question Engine]
    Visual[Visual Engine]
    AI[AI: Gemini/Nvidia/Groq]
    Wiki[Wikimedia Commons]

    Client <--> Dexie
    Client <--> API
    API <--> Appwrite
    API <--> Engine
    API <--> Visual
    Engine <--> AI
    Visual <--> AI
    Visual <--> Wiki
```

## Data Flow
1. **Request**: User requests practice questions for a subject.
2. **L1 Check**: App checks Dexie for cached questions.
3. **L2 Check**: If not in L1, API checks Appwrite questions collection.
4. **Generation**: If not in L2, `QuestionEngine` triggers AI generation.
5. **Enrichment**: `VisualEngine` generates diagrams (STEM) or searches images (non-STEM) in the background.
6. **Processing**: User answers questions; `LearningOrchestrator` handles grading and enriches user competency data.
7. **Sync**: Results are saved to Dexie and queued for background sync to Appwrite.

## Tech Stack
- **Frontend**: Next.js 16, React 19, Tailwind CSS 4, Framer Motion, Zustand.
- **Persistence**: Dexie.js (IndexedDB), Appwrite Database, sql.js (SQLite).
- **AI/ML**: Gemini 2.0 Flash Lite, Nvidia NIM (Llama 3.3), Groq (Llama 3.3).
- **Visualization**: Konva (Canvas diagrams), Mermaid.js, Recharts.
- **Monitoring**: Sentry (Client/Server/Edge).

## Key Abstractions
- **QuestionEngine**: Single source of truth for all question lifecycle operations.
- **VisualEngine**: Manages generation and retrieval of educational visuals.
- **LearningOrchestrator**: Coordinates engines and manages background job side effects.
- **SyncQueue**: Dexie-backed queue ensuring offline mutations are eventually synced.
- **CompetencyEngine**: Tracks student proficiency using Bloom's Taxonomy.

## Current Limitations & TODOs
- **OCR**: National exam schedule extraction currently manual; needs OCR/AI vision for image-based PDFs.
- **Tests**: High priority for E2E (Playwright) and component test coverage.
- **Analytics**: Comparative analytics currently use estimates due to Appwrite data privacy constraints.
- **Domain**: Transitioning from development URL to production domain.
