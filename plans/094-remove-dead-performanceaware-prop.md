# Plan 094: Remove dead `performanceAware` prop from FadeIn component

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `rg "performanceAware" src/ --files-with-matches`
> If the count of files referencing `performanceAware` has changed since
> `d4ba0811`, reconcile the pattern before editing.

## Status

- **Priority**: P4
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Planned at**: commit `d4ba0811`, 2026-07-05

## Why this matters

oxlint emits 4 warnings about the unused `performanceAware` prop in `FadeIn`. While harmless, it triggers lint noise that can mask genuine issues. Removing the prop makes the codebase cleaner and eliminates the warnings.

## Current state

- `src/components/shared/fade-in.tsx:36-37` — `performanceAware` declared as a prop but never referenced in the component body
- 4 oxlint warnings total, all about this prop

## STOP conditions

- `performanceAware` is actually used somewhere that `rg` missed — verify with `rg "performanceAware"` thoroughly
- The prop is part of a public API consumed by other components — check call sites first

## Commands you will need

| Purpose     | Command                                   | Expected on success |
| ----------- | ----------------------------------------- | ------------------- |
| Find usages | `rg "performanceAware" --type ts src/`    | 0 matches after fix |
| Lint        | `pnpm exec oxlint src/components/shared/` | 0 warnings          |
| Typecheck   | `pnpm run typecheck`                      | exit 0, no errors   |

## Scope

**In scope**:

- `src/components/shared/fade-in.tsx` — remove `performanceAware` from the props interface and component destructuring
- Any call sites that pass `performanceAware` to `<FadeIn>` — remove the prop from those JSX calls

**Out of scope**:

- Any other prop cleanup in the same file
- Adding any new functionality

## Steps

### Step 1: Find all usages

Search with `rg "performanceAware" src/` — list every file and line. Read the FadeIn component's props interface to confirm the prop is truly unused.

### Step 2: Remove from FadeIn component

In `src/components/shared/fade-in.tsx`:

1. Remove `performanceAware` from the `interface FadeInProps` (or `type FadeInProps`)
2. Remove `performanceAware` from the destructuring in the function signature

### Step 3: Remove from all call sites

For each file identified in step 1, remove the `performanceAware` attribute from `<FadeIn>` JSX calls.

### Step 4: Verify

Run `rg "performanceAware" --type ts src/` — 0 matches. Run `pnpm exec oxlint src/components/shared/` — 0 warnings about performanceAware. Run `pnpm run typecheck` — 0 errors.

## Verification

1. oxlint produces 0 warnings about `performanceAware`
2. `pnpm run typecheck` passes
3. No remaining references to `performanceAware` in any source file
