<!-- LAST_SYNC: 2026-05-31 -->
# Repository Index — Lumni

## Core Directory Structure
- `.context/`: Context layer (context.md, system-design.md, memory.md, repo-index.md)
- `src/app/`: Next.js App Router (pages & API)
  - `[locale]/`: Localization-aware routes (dashboard, quiz, exam, flashcards, admin, parent, teacher)
  - `api/`: Route handlers (engine, auth, exam-sessions, jobs, premium, student, teacher, sync)
- `src/components/`: React components
  - `ui/`: Design system primitives
  - `quiz/`: Question cards, diagrams (geometry, chart, chemistry, graph)
  - `dashboard/`: Analytics, today-focus, search, practice-tabs, offline-packs, assignments
  - `flashcard/`: Swipeable deck, SM-2 quality picker
  - `exam/`: Session UI, results, results-search
  - `parent/`: Child selector, progress grid, weekly reports
  - `teacher/`: Class roster, assignment builder, student drill-down
  - `settings/tabs/`: Sections (avatar, subjects, province, password, data, appearance)
  - `onboarding/`: 5-step wizard with Three.js
  - `shared/`: Immersive mode, error boundaries, page container
- `src/lib/`: Core logic & Engines
  - `ai/`: Provider chain (Gemini/Nvidia/Groq), latency tracker
  - `question-engine/`: Generation, grading (11 types), validators, competency mapper
  - `visual-engine/`: Konva diagrams, Wikimedia images
  - `flashcard-engine/`: SM-2/FSRS logic, daily limits, leech detection
  - `quiz-packs/`: Offline bulk generation service
  - `observability/`: Usage event tracking
  - `api/`: createRouteHandler factory
  - `db/repositories/`: Dexie/Appwrite data access
- `src/hooks/`: useQuestionEngine, useVisualEngine, useSwipeDeck, useImmersiveMode, useSnapAnswer
- `src/store/`: Zustand (exam-session, bookmarks, tools, voice-recorder)

## Data Layer (Dexie v23)
- `questions`, `visuals`, `quizPacks`, `packQuestions`, `flashcards`, `wrongAnswers`, `examDates`, `competencies`, `jobs`, `syncQueue`, `chatMessages`, `notes`, `studySessions`, `questionRatings`, `teacher_assignments`.

## Entry Points
- `src/app/[locale]/page.tsx`: Dashboard / Study Feed
- `src/app/api/engine/generate/route.ts`: Question Gen
- `src/lib/orchestrator/`: Learning Orchestration
- `src/instrumentation.ts`: Sentry/Observability init
