<!-- LAST_SYNC: 2026-05-29 -->
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
├── .context/                   # Persistent context layer
├── .agents/                    # Agent-specific skills and configs
├── .github/                    # GitHub Actions and workflows
└── ... (root config files)
```

## Key Configuration Files
- `package.json`: Main project configuration, dependencies (Next.js 16.2, React 19.2), and scripts.
- `tsconfig.json`: TypeScript 6 configuration and path aliases.
- `bunfig.toml`: Bun runtime configuration and test setup script (`happy-dom` enabled).
- `biome.json`: Biome configuration for linting and formatting.
- `next.config.ts`: Next.js framework configuration.
- `docker-compose.yml`: Docker services for development (including marker-api).
- `components.json`: Shadcn UI component configuration.
- `postcss.config.mjs`: PostCSS configuration for Tailwind CSS 4.
- `playwright.config.ts`: E2E testing configuration for Playwright.

## Module/Component Map
- `src/app`: Contains the application's pages (e.g., dashboard, quiz, exam) and API route handlers. Uses `createRouteHandler` factory for declarative API logic.
- `src/components`: UI components organized by domain: `ui` (primitives), `quiz` (question cards, diagrams), `dashboard`, `admin`, `tools` (reorganized into `core/`, `communication/`, `math/`, `science/`, `scheduling/`).
- `src/lib`: Core logic: `flashcard-engine` (unified SR), `question-engine` (gen/grade), `visual-engine` (diagrams), `api` (create-route-handler), `orchestrator` (jobs), `services` (barrel), `db` (repositories), `ai` (clients), `quiz-packs` (offline packs), `exam-dates` (tracker).
- `src/hooks`: Domain-specific hooks like `useQuestionEngine`, `useVisualEngine`, `useAuth`, `useQuizSession`, `useQuizPacks`, `useImmersiveMode`.
- `src/store`: Zustand stores for global state: `main`, `flashcards`, `exam-session`, `bookmarks`, `tools`, `voice-recorder`.

## Dependency Graph (Core)
- **Framework**: Next.js 16.2.6, React 19.2.6
- **Backend/DB**: Appwrite (remote), Dexie 4 (local IndexedDB), sql.js (SQLite)
- **AI**: Gemini 2.0 Flash Lite (primary), Nvidia NIM, Groq
- **State Management**: Zustand 5, TanStack React Query 5
- **Styling**: Tailwind CSS 4, Framer Motion 12
- **Rendering**: KaTeX (math), Konva (diagrams), Three.js (onboarding)
- **Tooling**: Biome 2.4, Bun 1.2, Sentry 10, UploadThing 7, Playwright 1.6, Storybook 10

## Entry Points
- `src/app/page.tsx`: Application dashboard / home feed.
- `src/app/layout.tsx`: Root layout with providers and global styles.
- `src/app/api/engine/generate/route.ts`: Question generation entry point.
- `src/instrumentation.ts`: Sentry and monitoring initialization.

## Recent Changes (Last 7 Days)
- **Anonymous Gating**: Implemented soft gating for anonymous users (Sign In button, hidden referrals, profile/dashboard empty states).
- **Exam Dates Tracker**: Full national exam dates integration with seed data for 2026 and Appwrite/Dexie sync path.
- **Immersive Mode**: Full-screen immersive mode for quiz and exam sessions, hiding navigation and maximizing focus.
- **Swipeable Flashcards**: Implemented Tinder-style swipe interaction for flashcard reviews with quality fine-tuning.
- **Offline AI Quiz Packs**: Implementation of downloadable question sets stored in Dexie v18 (`quizPacks` + `packQuestions` tables).
- **E2E & Storybook**: Setup Playwright for end-to-end testing and Storybook for UI component documentation.
- **Architecture**: Unified `FlashcardEngine`, `createRouteHandler` factory, and consolidated `services` barrel.
