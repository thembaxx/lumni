<!-- LAST_SYNC: 2026-06-02 -->
# Repository Index — Lumni

## Core Directory Structure
```text
.
├── .context/             # Context layer (context.md, system-design.md, memory.md, repo-index.md)
├── docs/                 # Documentation and ADRs
├── public/               # Static assets
├── scripts/              # Build and utility scripts
├── src/
│   ├── app/              # Next.js App Router (pages & API)
│   │   ├── [locale]/     # L10n-aware routes (dashboard, quiz, exam, flashcards)
│   │   └── api/          # REST API (engine, auth, sync, jobs)
│   ├── components/       # React components
│   │   ├── ui/           # Shadcn-based design system primitives
│   │   ├── quiz/         # Question cards and STEM diagram renderers
│   │   ├── flashcard/    # Swipeable deck and SM-2 quality picker
│   │   ├── tools/        # Solver + verified-by-pill
│   │   └── dashboard/    # Student/Teacher/Parent analytics and focus tools
│   ├── lib/              # Core business logic and Engines
│   │   ├── question-engine/ # Question gen, grading (11 types), validation, RAG-augmented
│   │   ├── visual-engine/   # Diagram gen (Konva/STEM) or Wiki (Non-STEM)
│   │   ├── flashcard-engine/# Unified SM-2/FSRS spaced-repetition logic
│   │   ├── tinyfish/        # Web-grounded RAG (7 modules) — June 2026
│   │   ├── quiz-packs/      # Offline AI quiz pack generation
│   │   └── orchestrator/    # Orchestration of engines and background jobs
│   ├── hooks/            # Shared React hooks (useQuestionEngine, useAuth)
│   └── store/            # Zustand stores for client-side state
└── e2e/                  # Playwright E2E test suites
```

## Key Configuration Files
- `package.json`: Project dependencies (Next.js 16, React 19) and scripts.
- `bunfig.toml`: Bun runtime configuration (test setup, happy-dom).
- `biome.json`: Biome linting and formatting rules.
- `tsconfig.json`: TypeScript configuration (strict mode, path aliases).
- `next.config.ts`: Next.js configuration and build-time flags.
- `playwright.config.ts`: E2E test suite configuration.

## Module Map
| Module | Purpose |
|--------|---------|
| `src/lib/question-engine/` | Single source of truth for generation and grading of 11 question types. RAG-augmented via `PromptManager`. |
| `src/lib/visual-engine/` | Manages STEM diagrams (Konva) and non-STEM visuals (Wikimedia). |
| `src/lib/flashcard-engine/` | Unified SM-2/FSRS engine with daily limits and leech detection. |
| `src/lib/tinyfish/` | Web-grounded RAG (7 modules: client, cache, in-flight, allowlist, wrap, types, index). |
| `src/lib/orchestrator/` | Coordinates engines, job queues, and progress tracking. |
| `src/lib/quiz-packs/` | Offline AI quiz pack generation and Dexie persistence. |
| `src/lib/db/` | Dexie L1 cache schema (v25, 33 tables) and repository access layers. |
| `src/lib/api/` | Generic route handler factory (`createRouteHandler`). |

## Dependency Graph
- **Framework**: `next` (v16.2.6), `react` (v19.2.6)
- **Styling**: `tailwindcss` (v4), `framer-motion` (v12)
- **Persistence**: `dexie` (L1), `appwrite` (L2)
- **AI Providers**: `Gemini` (Primary), `Nvidia NIM` (Fallback), `Groq` (Last resort)
- **RAG**: `TinyFish` (Search + Fetch, free tier) — flows into both solve and quiz generation
- **Math**: `katex` via `remark-math` and `rehype-katex`
- **Diagrams**: `konva` (Canvas), `mermaid` (SVG)

## Entry Points
- `src/app/[locale]/page.tsx`: Main dashboard / Study feed.
- `src/app/api/engine/generate/route.ts`: Question generation endpoint (RAG-augmented).
- `src/app/api/solve/route.ts`: AI solver endpoint (RAG-augmented, returns sources).
- `src/lib/orchestrator/index.ts`: Learning orchestration entry point.
- `src/lib/tinyfish/index.ts`: RAG entry point (`searchWithRAG`, `getSourceForQuestion`).
- `src/instrumentation.ts`: Sentry and observability initialization.

## Recent Changes (Last 7 Days)
- **TinyFish RAG shipped across 3 PRs** (`f5313f32` foundation + Dexie v25, `6c7c2ff1` solve + VerifiedByPill, `dd3940c4` quiz + rag-enricher + 3s timeout).
- **Q7 follow-up** (`2c16e85e`): Quiz results page now surfaces RAG sources via `engine.getLastRagContext()`; both `QuizResult` and `QuizResultsCard` render `<VerifiedByPill sources={...} />`. 1203 tests pass.
- **Q4 follow-up** (`f769f322`): Per-question RAG source persistence on `Question.webSources?: { url, title }[]` (Dexie v26, lazy rehydrate). Hybrid AI-cite `sourceRefs: number[]` with all-sources fallback via `src/lib/question-engine/source-mapper.ts`; new `<SourceAttributionPill>` rendered on `QuestionCardFeedback` (4th pill consumer, lighter inline pill). 1220 tests pass.
- Implemented Swipeable Flashcard Deck (Tinder-style interaction).
- Activated Full-Screen Immersive Mode for Quiz and Exams.
- Unified Spaced Repetition logic into `FlashcardEngine`.
- Introduced `createRouteHandler` factory for API standardization.
- Fixed Competency Sync field mismatch (`score` vs `proficiency`).
