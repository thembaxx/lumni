<!-- LAST_SYNC: 2026-05-23 -->
# Repository Index

## Directory Tree (Max Depth 3)
```
./
  dev-out.txt
  DESIGN.md
  .gitignore
  repo-index.md
  Dockerfile.cpu
  app.config.ts
  LANGUAGE.md
  exams.db-shm
  TODO.md
  exams.db
  CONTEXT.md
  .biomeignore
  .eslintignore
  server.py
  SPEC.md
  sentry.client.config.ts
  sentry.server.config.ts
  PRODUCT.md
  bun.lock
  biome.json
  MEMORY.md
  bunfig.toml
  implementation-notes.md
  instrumentation.ts
  components.json
  requirements.txt
  system-design.html
  opencode.json
  exams.db-wal
  dev-err.txt
  prompt-catalog.md
  .pr-body.md
  AGENTS.md
  postcss.config.mjs
  tsconfig.json
  docker-compose.yml
  package.json
  README.md
  next.config.ts
  system-design.md
  sentry.edge.config.ts
  public/
    web-app-manifest-512x512.png
    logo.png
    web-app-manifest-192x192.png
    manifest.json
    sw.js
    apple-touch-icon.png
    docs/
  .impeccable/
    design.json
  JSON/
    Geography_P1_Nov_2025_Eng.json
  .vscode/
    mcp.json
  src/
    proxy.ts
    instrumentation.ts
    instrumentation-client.ts
    components/
    app/
    hooks/
    docs/
    curriculum/
    scripts/
    data/
    store/
    assets/
    lib/
    types/
  docs/
    visual-engine-plan.md
    strategic-analysis-2026-05.md
    roadmap.md
    agents/
    issues/
    superpowers/
    adr/
  .kilo/
    plans/
  .husky/
    pre-commit
  scripts/
    create-minimal-animations.ts
    create-linear-issues.ps1
    run_download.ps1
    download-exam-papers.ps1
    test-download2.mjs
    markdown-to-json.ts
    upload-exam-papers.ps1
    ensure-appwrite.ts
    fix-remaining-ts-errors.mjs
    migrate-to-hugeicons.mjs
    batch-generate-questions.ts
    download_exams_fixed.ps1
    test-db.mjs
    replace-colors.ps1
    create-admin.ts
    phosphor-to-hugeicons.json
    test-import.json
    create-exam-papers-table.mjs
    test-download.mjs
    update_exam_json.py
    save-exam-papers-to-db.mjs
    download-new-animations.mjs
    download-animations.mjs
    fix_remaining_lint.py
    seed-exams-to-appwrite.ts
    push-migration.mjs
    sync-todo-to-linear.ts
    pdt-to-mkdwn.ts
    seed-linear-issues.ts
    download_exams_python.py
    upload-exam-papers.mjs
    marker-api/
  .agents/
    skills/
  .jules/
    sentinel.md
  .superpowers/
    brainstorm/
  markdown/
    Geography P1 Nov 2025 Eng.md
  .opencode/
    plans/
  patches/
    next+16.2.6.patch
```

## Key Configuration Files
- `package.json`: Project metadata and dependencies
- `tsconfig.json`: TypeScript configuration
- `biome.json`: Linting and formatting rules
- `next.config.ts`: Next.js configuration
- `bunfig.toml`: Bun runtime configuration
- `Dockerfile.cpu`: Docker configuration for CPU-based environments
- `docker-compose.yml`: Docker Compose configuration

## Module/Component Map
- `src/app/`: Next.js App Router pages and API routes. Primary entry points for the web application.
- `src/components/`: Reusable React components organized by feature (quiz, exam, dashboard, ui, etc.).
- `src/lib/`: Core business logic, engine implementations (QuestionEngine, VisualEngine), and shared utilities.
- `src/hooks/`: Custom React hooks for data fetching, state management, and side effects.
- `src/store/`: Zustand stores for client-side state persistence.
- `src/curriculum/`: CAPS curriculum data in JSON format for various subjects.

## Dependency Graph (Core External)
- `next` (16.2.6): Web framework
- `react` (19.2.6): UI library
- `appwrite`: Backend as a Service (Auth, DB, Storage)
- `dexie`: IndexedDB wrapper for offline storage
- `framer-motion`: Animations
- `konva`: Canvas rendering for diagrams
- `tailwindcss`: Styling
- `gemini`: Primary AI provider

## Entry Points
- `src/app/page.tsx`: Landing page
- `src/app/dashboard/page.tsx`: Main user dashboard
- `src/app/layout.tsx`: Root layout with providers
- `src/instrumentation.ts`: Server-side instrumentation

## Recent Changes (Last 7 days)
- ""
- .agents/skills/impeccable/SKILL.md
- .agents/skills/impeccable/reference/adapt.md
- .agents/skills/impeccable/reference/animate.md
- .agents/skills/impeccable/reference/audit.md
- .agents/skills/impeccable/reference/bolder.md
- .agents/skills/impeccable/reference/brand.md
- .agents/skills/impeccable/reference/clarify.md
- .agents/skills/impeccable/reference/cognitive-load.md
- .agents/skills/impeccable/reference/color-and-contrast.md
- .agents/skills/impeccable/reference/colorize.md
- .agents/skills/impeccable/reference/craft.md
- .agents/skills/impeccable/reference/critique.md
- .agents/skills/impeccable/reference/delight.md
- .agents/skills/impeccable/reference/distill.md
- .agents/skills/impeccable/reference/document.md
- .agents/skills/impeccable/reference/extract.md
- .agents/skills/impeccable/reference/harden.md
- .agents/skills/impeccable/reference/heuristics-scoring.md
- .agents/skills/impeccable/reference/interaction-design.md
