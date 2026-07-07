# Plan 140: Consolidate dual flag/experiment systems

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step.
>
> **Drift check (run first)**: `git diff --stat 6c00cdcd..HEAD -- src/lib/shared/flags/ src/lib/experiments/ src/app/api/experiment/`

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: 138 (personalized-feed flag fix)
- **Category**: tech-debt
- **Planned at**: commit `6c00cdcd`, 2026-07-08

## Why this matters

Two completely separate flag/experiment systems exist: `src/lib/shared/flags/` (registry, resolver, use-feature-flag hook, admin UI) and `src/lib/experiments/` (types, config, bucketing, API route). Both have different types, config structures, and resolution logic. The experiments system has no production consumers. Every new experiment requires cognitive load of choosing which system.

## Steps

### Step 1: Audit experiments consumers

Check `src/lib/experiments/` for any production code that imports from it. Likely zero after the conditions audit.

### Step 2: Port the one experiment config (if any) to flags registry

If `onboarding-flow-v1` or any experiment config exists in `experiments/config.ts`, move it to `flags/registry.ts`.

### Step 3: Delete experiments system

Remove:

- `src/lib/experiments/` directory
- `src/app/api/experiment/evaluate/` route
- Related Dexie tables if any (schema.ts, check for `experimentAssignments`)

### Step 4: Update schema.ts

Remove any experiment-related table definitions from `src/lib/db/schema.ts` and bump the version.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] `src/lib/experiments/` directory removed
- [ ] No imports from `@/lib/experiments` remain
- [ ] Schema version bumped with experiments tables removed
