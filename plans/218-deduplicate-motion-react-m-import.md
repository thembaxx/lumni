# Plan 218: Deduplicate motion/react-m import across 105 files

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: perf

## Why this matters

The codebase has 100+ files that import `import * as m from "motion/react-m"` for the `m.div`/`m.button` proxy, AND many of those same files also import individual hooks from `"motion/react"`. This means each page bundle includes two separate entry points into the `motion` module, adding module-resolution overhead and defeating tree-shaking for the `m` proxy. Merging into a single `import { m } from "motion/react"` eliminates the duplicate module graph entry.

## Current state

- 105 files use `import * as m from "motion/react-m"` — verified via `grep` on `src/`
- 76 files also import named exports from `"motion/react"` (e.g. `AnimatePresence`, `useReducedMotion`, `animate`)
- Example from `src/components/quiz/quiz-view.tsx:6-13`: both `import { AnimatePresence, ... } from "motion/react"` and `import * as m from "motion/react-m"` in the same file
- The `react-m` sub-path is a proxy module that adds extra code per entry point

## Target state

- All files import `{ m }` (or `{ m, type ... }`) from `"motion/react"` instead of `* as m from "motion/react-m"`
- Named hooks remain imported from `"motion/react"` and are now all in the same import statement
- Zero `import * as m from "motion/react-m"` references remain in `src/`

## Scope

- ~105 `.tsx` and `.ts` files in `src/` that import from `"motion/react-m"`
- Known safe: `import { m } from "motion/react"` is the canonical import — the `m` object is exported from the main barrel

## Steps

### 1. Bulk find-and-replace

Use `sed` or a script across all matching files:

```
Replace: import * as m from "motion/react-m";
With:    import { m } from "motion/react";
```

Files that already have a `from "motion/react"` import need the new `{ m }` merged into the existing named import list.

### 2. Merge with existing motion/react imports

For each file that already has `import { ... } from "motion/react"`:

- Remove the existing `import { ... } from "motion/react"` line
- Change the `import * as m from "motion/react-m"` line to `import { m, ... } from "motion/react"` — merging all previously separate named exports

Script approach:

```typescript
// pseudocode for the migration script
for each file matching `import.*motion/react-m`:
  read file
  if file also has `import {.*} from "motion/react"`:
    extract named exports from that line
    remove that line
    replace `import * as m from "motion/react-m"` with `import { m, <extracted-named-exports> } from "motion/react"`
  else:
    replace `import * as m from "motion/react-m"` with `import { m } from "motion/react"`
  write file
```

### 3. Manual cleanup

After the bulk script, some cases may have edge conditions:

- Files importing `type` re-exports (e.g. `import type { Variants } from "motion/react"`) — these should remain as separate type imports or be merged with `import { m, type Variants }`
- Test files — same transformation applies

### 4. Verify

```bash
pnpm run typecheck
pnpm exec biome check --write
pnpm run test
```

Check `rg "from \"motion/react-m\"" src/` returns zero results after cleanup.

## Stop conditions

- `pnpm run typecheck` fails — some edge case with type-only imports or barrel re-exports
- If total changes exceed 200 files, stop and switch to a gradual approach (one directory at a time)

## Estimated time

2–4 hours (bulk script + manual edge cases + verification)
