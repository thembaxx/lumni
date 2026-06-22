# ADR-01: Component Decomposition Strategy — Atomic vs. Domain-Driven for Education UI

**Status:** Proposed  
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

## Related

- `src/components/atoms/consent-status-badge.tsx`
- `src/components/molecules/quiz-launcher.tsx`
- `src/components/organisms/parent-shell.tsx`
