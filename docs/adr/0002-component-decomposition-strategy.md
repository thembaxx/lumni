# ADR-01: Component Decomposition Strategy — Atomic vs. Domain-Driven for Education UI

**Status:** Rejected — codebase evolved domain-grouped structure (`quiz/`, `dashboard/`, `flashcard/`) instead of atomic design  
**Date:** 2026-05-23  
**Author:** Senior Frontend Architect

## Context

Lumni has grown to 14 components with >400 lines of code each. Components like `note-creator.tsx` (697 lines), `profile-tab.tsx` (669 lines), and `dashboard-client.tsx` (542 lines) bundle UI markup, business logic, state management, and side effects into single files. This blocks velocity, prevents Storybook coverage, and makes onboarding painful.

## Decision

Adopt **domain-driven atomic design**:

- Decompose by educational domain (Quiz, Exam, Flashcard, Planner, Parent)
- Enforce atomic size constraints:
  - Atoms: <50 lines, single responsibility, `cva` variants
  - Molecules: <100 lines, composed atoms + 1–2 shadcn primitives
  - Organisms: <150 lines, feature-level assemblies
  - Templates: Page layouts, error boundaries, loading shells
- Co-locate hooks, types, and sub-components in directory index patterns
- All visual variants use `cva` (class-variance-authority) with explicit Tailwind maps
- Loading, error, and empty states are first-class sub-components

## Consequences

- **Positive:** Clear ownership per domain; reusable components; easier testing; faster onboarding
- **Negative:** More files to navigate; stricter code review discipline required
- **Migration path:** Legacy components in `src/components/[domain]/` remain functional; new work uses `src/components/atoms/`, `molecules/`, `organisms/`, `templates/`

## Disposition (Session 41 — June 2026)

The atomic `atoms/molecules/organisms/templates` directory structure was **never adopted**. The codebase instead evolved a **domain-grouped** structure (`quiz/`, `dashboard/`, `flashcard/`, `navigation/`, `celebration/`, `onboarding/`, `tools/core|communication|math|science|scheduling`). This happened organically because:

1. Educational UI concepts (flashcard decks, quiz views, exam sessions) cross-cut atomic boundaries — a single flashcard deck is simultaneously an atom (card), molecule (deck), and organism (study session).
2. Domain grouping made imports predictable: `import { X } from "@/components/flashcard/X"` — no guessing which atomic tier something lives in.
3. Size constraints proved less useful than **cohesion**: a 300-line file with clear internal structure (`quiz-view.tsx`) is easier to maintain than 6 scattered 50-line files.

**Verdict:** The domain-grouped structure was the right call. ADR-0002 is formally **Rejected**.

## Related

- `src/components/quiz/` — largest domain, question engine + view + results + feedback
- `src/components/dashboard/` — homepage orchestration, gamification, analytics
- `src/components/flashcard/` — swipeable card deck, SM-2 quality picker
- `src/components/tools/` — split into `core/`, `communication/`, `math/`, `science/`, `scheduling/`
