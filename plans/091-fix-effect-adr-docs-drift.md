# Plan 091: Fix ADR-0013 Effect TS documentation drift

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat d4ba0811..HEAD -- docs/adr/0013-effect-adoption.md AGENTS.md .context/CONTEXT.md src/lib/ai/client.ts src/lib/ai/cached-ai-generator.ts`
> If any in-scope file changed, compare the "Current state" excerpts against
> the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Planned at**: commit `d4ba0811`, 2026-07-05

## Why this matters

ADR-0013 claims "Implemented — Phase 1" and describes the AI client as the canonical Effect provider chain pattern. `AGENTS.md:1236-1243` documents Effect conventions using the AI client as the reference. `CONTEXT.md:150` references a `uniform-adapter.ts` that doesn't exist. Meanwhile `src/lib/ai/client.ts` uses plain `for...of` / `try/catch` — zero Effect usage. The only real Effect usage is in `cached-ai-generator.ts`.

Every time an agent reads these docs and tries to follow the Effect pattern, they either get confused (can't find the reference) or write Effect code that doesn't match the rest of the codebase. Fixing the docs to match reality eliminates this cost immediately, even before the strategic decision on Effect adoption.

## Current state

- `docs/adr/0013-effect-adoption.md` — Status: "Implemented — Phase 1". Claims AI client and grading pipeline were refactored to Effect. Claims `PROGRESS.md` created (doesn't exist). All false.
- `AGENTS.md:1236-1243` — "Provider chain pattern: The AI client (`src/lib/ai/client.ts`) demonstrates the canonical pattern: Define a `ProviderError` type with `Effect.catchAll` fallback chain, Use `Effect.gen` for sequential fallback...". The actual file uses `for...of` + `try/catch`.
- `CONTEXT.md:150` — "Uniform AI adapter: `createUniformProvider()` factory... Used by `src/lib/ai/client.ts`". File `src/lib/ai/uniform-adapter.ts` does not exist.
- `src/lib/ai/cached-ai-generator.ts` — The only file in the codebase that imports from `effect` (~5 Effect.gen blocks, 77 lines total). Works correctly.
- `src/lib/ai/client.ts` — 0 imports from `effect`. Uses `for...of` + `try/catch` + fallback chain. No Effect.

## STOP conditions

- `src/lib/ai/client.ts` has already been refactored to use Effect — in that case the docs are correct, skip this plan
- Any file in scope was modified outside of `plans/` since `d4ba0811` — reconcile first

## Commands you will need

| Purpose   | Command                         | Expected on success |
| --------- | ------------------------------- | ------------------- |
| Typecheck | `pnpm run typecheck`            | exit 0, no errors   |
| Lint      | `pnpm exec biome check --write` | exit 0              |

## Scope

**In scope**:

- `docs/adr/0013-effect-adoption.md` — rewrite Status and Implementation sections to reflect reality
- `AGENTS.md` — correct the Effect conventions section (lines ~1236-1243)
- `.context/CONTEXT.md` — correct or remove the `uniform-adapter.ts` reference (line ~150)

**Out of scope**:

- Refactoring `src/lib/ai/client.ts` to use Effect (that's Plan 095 or its result)
- Creating `src/lib/ai/uniform-adapter.ts`
- Installing or removing npm packages
- Any other file outside the three listed above

## Steps

### Step 1: Read all three in-scope docs

Read and understand the full content of each file to know what to correct.

### Step 2: Fix `docs/adr/0013-effect-adoption.md`

1. Change `## Status` from "Implemented — Phase 1" to "Partially Implemented — Evidence Drift"
2. In `## Decision`, change the sentence about the AI client being refactored to say that Effect TS was introduced via `cached-ai-generator.ts` and is proven in that bounded context, but the AI client (`src/lib/ai/client.ts`) remains imperative
3. Add a "Current Reality" subsection under `## Implementation` that:
   - States `cached-ai-generator.ts` is the only production file using Effect (~5 Effect.gen blocks, 77 lines)
   - States the AI client uses `for...of` + `try/catch` with no Effect
   - States `uniform-adapter.ts` was documented but never created
4. Change the suggested workflow from "Write new services using Effect" to "Proven in cached-ai-generator; new Effect code should be isolated to a single module until strategy is decided"
5. Remove any reference to `PROGRESS.md` that doesn't exist

### Step 3: Fix `AGENTS.md`

1. Find the "Provider chain pattern" subsection under Effect TS conventions
2. Replace it with accurate text: "The AI client (`src/lib/ai/client.ts`) uses a `for...of`/`try/catch` fallback chain — this is the _imperative_ pattern. The _Effect_ pattern is demonstrated in `src/lib/ai/cached-ai-generator.ts` (~5 Effect.gen blocks). See ADR-0013 for the current adoption status."
3. Verify no other references to Effect describe the AI client as an Effect pattern

### Step 4: Fix `.context/CONTEXT.md`

1. Find the line referencing `uniform-adapter.ts` (line ~150)
2. Replace with: "AI provider chain: `src/lib/ai/client.ts` — imperative `for...of`/`try/catch` fallback over Gemini → Nvidia → Groq. Effect TS proven via `cached-ai-generator.ts` (see ADR-0013)."

### Step 5: Run verification

Run `pnpm run typecheck` — 0 errors. Run `pnpm exec biome check --write` — 0 errors on changed files.

## Verification

1. `docs/adr/0013-effect-adoption.md` no longer claims the AI client was refactored to Effect
2. The Current Reality section accurately describes `cached-ai-generator.ts` as the only Effect file
3. `AGENTS.md` Effect section no longer describes the AI client as an Effect pattern reference
4. `.context/CONTEXT.md` no longer references `uniform-adapter.ts`
5. `pnpm run typecheck` — 0 errors
6. `pnpm exec biome check --write` — 0 errors on changed files
