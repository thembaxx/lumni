# Plan 153: Remove legacy spaced-repetition barrel re-export shims

> **Executor instructions**: Follow this plan step by step.
> **Drift check**: `git diff --stat 649afc3b..HEAD -- src/lib/spaced-repetition/ src/lib/utils/spaced-repetition.ts src/lib/flashcard-repository/`

## Status

- **Priority**: P2 | **Effort**: S | **Risk**: MEDIUM | **Depends on**: none | **Category**: arch
- **Planned at**: commit `649afc3b`, 2026-07-07

## Why this matters

As noted in AGENTS.md (Session 8), three legacy files re-export from the consolidated flashcard engine for backward compatibility:

- `src/lib/spaced-repetition/index.ts`
- `src/lib/flashcard-repository/index.ts`
- `src/lib/utils/spaced-repetition.ts`

These shims exist so the Session 8 consolidation was non-breaking. After ~8 sessions of subsequent work, all importers should have been updated to use `@/lib/flashcard-engine` directly. If so, these shims are dead code that adds confusion and misdirection.

## Current state

Three legacy barrel files re-export from `@/lib/flashcard-engine`. They were created for backward compatibility; it's now time to check if all importers have moved.

## Steps

### Step 1: Check for remaining importers

For each legacy barrel, search for all imports from that path:

```bash
rg "from \"@/lib/spaced-repetition\"" src/
rg "from \"@/lib/flashcard-repository\"" src/
rg "from \"@/lib/utils/spaced-repetition\"" src/
```

### Step 2a: If zero importers remain

Delete all three shim files and the directories if empty. Update any internal references within the flashcard-engine itself.

### Step 2b: If importers remain

For each remaining importer, update the import path to `@/lib/flashcard-engine`, then delete the shims. Test after each update.

### Step 3: Verify

`pnpm typecheck` → exit 0. `pnpm test` → all pass. `pnpm exec oxlint` → exit 0.

## Done criteria

- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm test` passes
- [ ] `src/lib/spaced-repetition/index.ts` removed (or confirmed still needed with an inline comment)
- [ ] `src/lib/flashcard-repository/index.ts` removed (or confirmed still needed)
- [ ] `src/lib/utils/spaced-repetition.ts` removed (or confirmed still needed)
- [ ] All remaining importers use `@/lib/flashcard-engine`

## STOP conditions

This plan has medium risk because deleting shims could break imports that aren't caught by typecheck (e.g., dynamic imports or lazily resolved paths). Verify with `rg`, not just typecheck.
