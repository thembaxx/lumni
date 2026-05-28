<!-- LAST_SYNC: 2026-05-28 -->
# Repository Index — Lumni

## Directory Tree (Depth 3)
```
.
├── public/                     # Static assets and PWA files
├── src/
│   ├── app/                    # Next.js App Router (pages + API)
│   ├── components/             # React components (UI, features, layout)
│   ├── hooks/                  # Custom React hooks
│   ├── store/                  # Zustand state stores
│   ├── lib/                    # Core business logic and engines
│   ├── types/                  # TypeScript type definitions
│   ├── assets/                 # Animations and static assets
│   ├── curriculum/             # Curriculum definitions (JSON)
│   ├── data/                   # Static data and subjects
│   └── scripts/                # Utility scripts
├── docs/                       # Project documentation (ADRs, specs, guides)
├── scripts/                    # Build and maintenance scripts
├── .context/                   # Persistent context layer (this directory)
├── .agents/                    # Agent-specific skills and configs
├── .github/                    # GitHub Actions and workflows
└── ... (root config files)
```

## Key Configuration Files
- `package.json`: Main project configuration, dependencies (Next.js 16, React 19), and scripts.
- `tsconfig.json`: TypeScript compiler configuration and path aliases.
- `bunfig.toml`: Bun runtime configuration and test setup script.
- `biome.json`: Biome configuration for linting and formatting.
- `next.config.ts`: Next.js framework configuration.
- `docker-compose.yml`: Docker services for development (including marker-api).
- `components.json`: Shadcn UI component configuration.
- `postcss.config.mjs`: PostCSS configuration for Tailwind CSS.
- `playwright.config.ts`: E2E testing configuration for Playwright.

## Module/Component Map
- `src/app`: Contains the application's pages (e.g., dashboard, quiz, exam) and API route handlers.
- `src/components`: UI components organized by domain: `ui` (primitives), `quiz` (question cards, diagrams), `dashboard`, `admin`, `tools` (reorganized into `core/`, `communication/`, `math/`, `science/`, `scheduling/`).
- `src/lib`: Core logic: `flashcard-engine` (unified SR), `question-engine` (gen/grade), `visual-engine` (diagrams), `api` (create-route-handler factory), `orchestrator` (jobs), `services` (barrel of all 10 services), `db` (repositories), `ai` (clients), `quiz-packs` (offline packs), `exam-dates` (tracker).
- `src/hooks`: Domain-specific hooks like `useQuestionEngine`, `useVisualEngine`, `useAuth`, `useQuizSession`, `useQuizPacks`.
- `src/store`: Zustand stores for global state: `main`, `flashcards`, `exam-session`, `bookmarks`, `tools`, `voice-recorder`.

## Dependency Graph (Core)
- **Framework**: Next.js 16.2.6, React 19.2.6
- **Backend/DB**: Appwrite (remote), Dexie (local IndexedDB), sql.js (SQLite)
- **AI**: Gemini 2.0 Flash Lite, Nvidia NIM, Groq
- **State Management**: Zustand, TanStack React Query
- **Styling**: Tailwind CSS 4, Framer Motion
- **Rendering**: KaTeX (math), Konva (diagrams), Three.js (onboarding)
- **Tooling**: Biome, Bun, Sentry, UploadThing, Playwright, Storybook

## Entry Points
- `src/app/page.tsx`: Application dashboard / home feed.
- `src/app/layout.tsx`: Root layout with providers and global styles.
- `src/app/api/engine/generate/route.ts`: Question generation entry point.
- `src/instrumentation.ts`: Sentry and monitoring initialization.

## Recent Changes (Last 7 Days)
- Implementation of Offline AI Quiz Packs (`src/lib/quiz-packs/`).
- Playwright E2E testing setup and smoke tests (`playwright.config.ts`, `e2e/`).
- Appwrite sync path for `exam_dates` implemented.
- Storybook integration and initial stories (`src/stories/`).
- Dexie v18 migration for Quiz Packs support (table count 18→23).
- Services barrel reorganization and generic route handler factory refinement.
