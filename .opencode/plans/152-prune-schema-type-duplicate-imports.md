# Plan 152: Deduplicate Dexie schema types — prune unused barrel exports

> **Executor instructions**: Follow this plan step by step.
> **Drift check**: `git diff --stat 649afc3b..HEAD -- src/lib/db/schema.ts src/lib/db/__tests__/`

## Status

- **Priority**: P2 | **Effort**: S | **Risk**: LOW | **Depends on**: none | **Category**: arch
- **Planned at**: commit `649afc3b`, 2026-07-07

## Why this matters

The Dexie schema file (`src/lib/db/schema.ts`) exports both `offlineDB` and `OfflineDatabase`, which means type consumers import from both the schema file and the types file. Over time, type references to table row types have proliferated across the codebase as ad hoc inline interfaces rather than re-using the canonical type from `data-access.ts`.

## Current state

- `src/lib/db/schema.ts` exports the Dexie database instance and its class type
- `src/lib/db/data-access.ts` exports table accessor types
- Table row types are sometimes defined inline in consumers, sometimes imported from schema.ts, sometimes from data-access.ts

## Steps

### Step 1: Audit all type exports in schema.ts

Read `src/lib/db/schema.ts` and list every exported type/interface. For each one, search `src/` for import references using `rg "from \"@/lib/db/schema\""` and `rg "from \"@/lib/db\""`.

### Step 2: Identify unused exports

For each type/interface that is exported but never imported outside of `src/lib/db/`, remove the export keyword (keep the type for internal use).

### Step 3: Normalize import paths

For types that are imported from multiple locations (both schema.ts and data-access.ts or barrel), pick one canonical source. Move type imports to `@/lib/db` (the barrel) where possible.

### Step 4: Verify

`pnpm typecheck` → exit 0. `pnpm test` → all pass.

## Done criteria

- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm test` passes
- [ ] Unused type exports removed from schema.ts
- [ ] Import paths for table row types normalised to one canonical source

## STOP conditions

Stop and report if this analysis reveals that all schema exports are consumed — in that case, the plan scope is already clean and this can be closed as "no issue found".
