# Plan 095: Design spike — Effect TS: adopt or abandon

> **Executor instructions**: This is a _design spike_ — not an implementation
> plan. The output is a decision document, not code changes. Follow the steps
> below to produce a recommendation. When done, update the status row for this
> plan in `plans/README.md`.
>
> **Drift check**: No code is changed by this plan. Skip drift check.

## Status

- **Priority**: P3
- **Effort**: M (research + document)
- **Risk**: LOW (no code changes)
- **Depends on**: Plan 091 (docs must accurately reflect current state first)
- **Planned at**: commit `d4ba0811`, 2026-07-05

## Why this matters

Effect TS is installed (`effect v3.21.4`, `@effect/platform v0.96.2`, `@effect/language-service`) with a prepare-script patch and documented conventions. But only 1 file (`cached-ai-generator.ts`) actually uses it. The ADR says "Phase 1 complete" but the AI client was never migrated.

This half-state has real costs:

- Every new developer or agent must spend time understanding "should I use Effect here?"
- The `@effect/language-service` prepare script runs on every install (potential build-time cost)
- npm audit includes `effect` in its scan
- The docs describe conventions that can't be followed in practice

The project should either commit to Effect (migrate the AI client and establish a pattern) or abandon it (uninstall deps, revert the ADR, remove from AGENTS.md). This spike produces a data-driven recommendation.

## Current state

- `node_modules/effect` installed: 3.21.4
- `node_modules/@effect/platform` installed: 0.96.2
- `node_modules/@effect/language-service` installed — with `prepare` script patch in `package.json`
- Working Effect code: `src/lib/ai/cached-ai-generator.ts` (1 file, ~5 Effect.gen blocks, ~77 lines)
- Non-Effect AI client: `src/lib/ai/client.ts` (0 Effect imports, `for...of`/`try/catch` fallback)
- ADR-0013: claims Phase 1 complete (now corrected by Plan 091)
- All error handling in services: plain try/catch (Sessions 37-38 extracted services using imperative patterns)
- TypeScript: `tsconfig.json` includes `@effect/language-service` plugin

## STOP conditions

- Plan 091 is not yet DONE — the docs must reflect reality before this spike has accurate inputs
- The project owner has already made a decision — check with them before writing a recommendation

## Commands you will need

| Purpose                          | Command                                              | Expected on success                  |
| -------------------------------- | ---------------------------------------------------- | ------------------------------------ |
| Find all Effect imports          | `rg "from "effect"$\|from "@effect/" src/ --type ts` | List all files using Effect          |
| Check Effect npm size            | `pnpm why effect`                                    | Shows dependency chain               |
| List Effect-related dependencies | `pnpm ls --depth 0 \| grep -i effect`                | Shows installed top-level packages   |
| Check `prepare` script line      | `rg "prepare" package.json`                          | Shows if language-service is patched |

## Steps

### Step 1: Inventory all Effect usage

Run the find command above. Read every file that imports from Effect. Classify usage patterns:

- `Effect.gen` + `yield*` — idiomatic
- `Effect.tryPromise` — pragmatic
- `Context.Tag` / `Layer` — DI pattern
- Schema usage — if any

Produce a table: file, lines of Effect code, pattern used.

### Step 2: Inventory the migration surface

If the project were to adopt Effect fully, what would need to migrate? List:

- Core services: AI client, Grader, QuestionProcessor, all service-extracted classes
- Error handling: 148 catch blocks (S23 audit) — how many would be replaced by Effect.error types?
- Testing: Effect has `@effect/vitest` — is there any adoption?

Count files and approximate LoC that would change.

### Step 3: Compare approaches

Build a comparison table:

| Criterion           | Adopt Effect                  | Abandon Effect       | Stay Halfway                 |
| ------------------- | ----------------------------- | -------------------- | ---------------------------- |
| Bundle size         | Adds ~40KB min+gzip           | Zero (remove dep)    | ~40KB for 1 file             |
| Error handling      | `Effect.catchAll` chain       | try/catch (current)  | Mixed — confusing            |
| Learning curve      | Steep first week              | None                 | Stagnant (already installed) |
| Testability         | `Layer` DI built-in           | Manual DI (current)  | Manual DI                    |
| Concurrency         | `Effect.all` with concurrency | Promise.all          | Mixed                        |
| File count affected | ~150+ files                   | ~5 files (uninstall) | Current (~1 file)            |
| Lint support        | Built-in effect/ts plugin     | Biome (current)      | Biome                        |

### Step 4: Write the recommendation

Based on the analysis above, produce a concrete recommendation:

- **Adopt**: if the migration cost is justified by the error-handling and concurrency benefits
- **Abandon**: if the migration cost is too high for the current team
- **Hold**: if there's a middle path (e.g., use Effect only in new `effect/` modules, don't backfill)

Write the recommendation as an ADR update or a new decision document. File it at `docs/adr/0013-effect-adoption.md` (update the existing one) or as a new spike doc.

### Step 5: Present to the user

The executor's output is the recommendation document. Present it to the user for a decision.

## Verification

1. Recommendation document is written with clear, data-backed reasoning
2. All Effect usage in the codebase is cataloged
3. Migration cost is estimated (files, LoC, approximate time)
4. The recommendation is actionable (not "it depends")
