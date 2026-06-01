<!-- LAST_SYNC: 2025-01-24 -->
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
│   ├── components/       # React components
│   ├── lib/              # Core business logic and Engines
│   ├── hooks/            # Shared React hooks
│   └── store/            # Zustand stores
└── e2e/                  # Playwright E2E test suites
```

## Recent Churn (Summary from TODO.md)
- WCAG 2.2 AA Accessibility Audit and fixes (10+ critical items).
- Test suite hardening (1109 passing tests).
- B2B2C Dashboard wiring (Teacher/Parent portals).
- Premium gating for Offline Quiz Packs and Visual Engine.
- Photo Math integration with Snap-to-Answer event bus.
- Mega-component decomposition for Profile, OTP, Periodic Table, and AI Solver.
- Appwrite SA Region migration configuration.

## Path-Only Index
./src/app/[locale]/layout.tsx
./src/app/[locale]/page.tsx
./src/app/[locale]/globals.css
./src/app/[locale]/quiz/page.tsx
./src/app/[locale]/quiz/layout.tsx
./src/app/[locale]/quiz/[id]/page.tsx
./src/app/[locale]/flashcards/page.tsx
./src/app/[locale]/flashcards/layout.tsx
./src/app/[locale]/exam/page.tsx
./src/app/[locale]/exam/[id]/page.tsx
./src/app/[locale]/exam/layout.tsx
./src/app/[locale]/dashboard/page.tsx
./src/app/[locale]/dashboard/layout.tsx
./src/app/[locale]/dashboard/student/page.tsx
./src/app/[locale]/dashboard/teacher/page.tsx
./src/app/[locale]/dashboard/parent/page.tsx
./src/app/[locale]/settings/page.tsx
./src/app/[locale]/settings/layout.tsx
./src/app/api/engine/generate/route.ts
./src/app/api/engine/grade/route.ts
./src/app/api/engine/visual/route.ts
./src/app/api/quiz-packs/generate/route.ts
./src/app/api/stripe/webhook/route.ts
./src/app/api/premium/verify/route.ts
./src/app/api/student/assignments/route.ts
./src/components/ui/button.tsx
./src/components/ui/card.tsx
./src/components/ui/dialog.tsx
./src/components/quiz/question-card.tsx
./src/components/quiz/diagrams/geometry.tsx
./src/components/quiz/diagrams/chart.tsx
./src/components/quiz/diagrams/chemistry.tsx
./src/components/quiz/diagrams/graph.tsx
./src/components/flashcard/swipeable-card-deck.tsx
./src/components/flashcard/swipeable-card.tsx
./src/components/flashcard/quality-picker.tsx
./src/components/dashboard/offline-packs.tsx
./src/components/shared/immersive-mode.tsx
./src/lib/question-engine/index.ts
./src/lib/question-engine/types.ts
./src/lib/visual-engine/index.ts
./src/lib/flashcard-engine/index.ts
./src/lib/orchestrator/index.ts
./src/lib/quiz-packs/service.ts
./src/lib/db/index.ts
./src/lib/api/create-route-handler.ts
./src/lib/observability/events.ts
./src/lib/ai/latency-tracker.ts
./src/hooks/use-question-engine.ts
./src/hooks/use-visual-engine.ts
./src/hooks/use-swipe-deck.ts
./src/hooks/use-snap-answer.ts
./package.json
./bunfig.toml
./biome.json
./tsconfig.json
./next.config.ts
./TODO.md
./AGENTS.md
./CONTEXT.md
./DESIGN.md
./SPEC.md
./CLAUDE.md
