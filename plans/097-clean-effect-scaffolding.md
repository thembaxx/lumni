# Plan 097: Remove unused Effect scaffolding per Recommendation

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat d4ba0811..HEAD -- package.json tsconfig.json docs/adr/0013-effect-adoption.md AGENTS.md`
> If any in-scope file changed beyond what Plan 091 changed, compare before
> proceeding.

## Status

- **Priority**: P3
- **Effort**: S (~1 hour)
- **Risk**: LOW
- **Depends on**: Plan 095 (recommendation document complete)
- **Planned at**: commit `d4ba0811`, 2026-07-05

## Why this matters

The Effect TS design spike (Plan 095) recommended "Hold" — keep 17 production files using Effect, remove the unused scaffolding set up for a broader migration. `@effect/language-service`, the prepare script patch, and the tsconfig plugin were installed expecting a migration that never happened. They cost ~2s per install and add tsconfig complexity for zero benefit. Fixing ADR-0013 and AGENTS.md to match the "pragmatic Effect" pattern eliminates the ongoing doc drift.

## Current state

Per Plan 095 recommendation at `docs/decisions/2026-07-05-effect-strategy-recommendation.md`:

- `package.json` has `@effect/language-service` in devDependencies
- `package.json` prepare script has `effect-language-service patch`
- `tsconfig.json` has `@effect/language-service` in compilerOptions.plugins
- `docs/adr/0013-effect-adoption.md` status says "Partially Implemented — Evidence Drift"
- `AGENTS.md` Effect section still documents Context.Tag/Layer/@effect/platform/@effect/vitest patterns that are not used

## STOP conditions

- `pnpm install` fails after removing packages — restore immediately
- `pnpm run typecheck` fails after tsconfig change — restore immediately

## Commands you will need

| Purpose   | Command                         | Expected on success |
| --------- | ------------------------------- | ------------------- |
| Install   | `pnpm install`                  | exit 0, no errors   |
| Typecheck | `pnpm run typecheck`            | exit 0, 0 errors    |
| Lint      | `pnpm exec biome check --write` | exit 0              |
| Tests     | `pnpm run test -- --run`        | all pass            |

## Scope

**In scope**:

- `package.json` — remove `@effect/language-service` from devDependencies, remove `effect-language-service patch` from prepare script
- `tsconfig.json` — remove `@effect/language-service` from `compilerOptions.plugins`
- `docs/adr/0013-effect-adoption.md` — update status to "Hold — Pragmatic Adoption", update Scope/Technical Details to reflect current state
- `AGENTS.md` — trim Effect TS section to match actual usage

**Out of scope**:

- Changing any source file in `src/`
- Removing `effect` from dependencies (it's a transitive dep of uploadthing)
- Adding any new Effect usage

## Steps

### Step 1: Read current state of in-scope files

Read the relevant sections of:

- `package.json` — devDependencies and scripts
- `tsconfig.json` — compilerOptions.plugins
- `docs/adr/0013-effect-adoption.md` — status, scope, technical details
- `AGENTS.md` — Effect TS conventions section

### Step 2: Remove `@effect/language-service` from `package.json`

1. Delete `"@effect/language-service": "^0.86.2"` from devDependencies
2. Change the `"prepare"` script from `"husky || true && effect-language-service patch"` to `"husky || true"`
3. Run `pnpm install` — verify exit 0

### Step 3: Remove `@effect/language-service` from `tsconfig.json`

Delete the `@effect/language-service` entry from `compilerOptions.plugins` array.

### Step 4: Update `docs/adr/0013-effect-adoption.md`

1. Change Status from "Partially Implemented — Evidence Drift (July 2026)" to "Hold — Pragmatic Adoption (July 2026)"
2. In `## Decision`, update the rationale to reflect that Effect is proven in 17 production files but not expanded to the full ecosystem
3. In `## Implementation > Current Reality`, add a note that Plan 097 cleaned up the scaffolding
4. Remove or update any references to Phase 2 (Context.Tag/Layer migration plans)
5. Add a reference to the recommendation doc: `docs/decisions/2026-07-05-effect-strategy-recommendation.md`

### Step 5: Update `AGENTS.md` Effect TS section

Trim the Effect TS conventions to match actual usage:

1. Remove: Context.Tag + Layer documentation (not used anywhere)
2. Remove: @effect/vitest reference (not used)
3. Remove: Schema documentation (effect/Schema is deprecated; not used)
4. Remove: @effect/platform HttpClient reference (not used)
5. Remove: reference to cloned Effect v4 repo at `~/.local/share/effect-solutions/effect`
6. Remove: "effect-solutions CLI" reference
7. Keep: Effect.gen + yield\* pattern (used in 13 prod files)
8. Keep: Effect.tryPromise for promise bridging (used in 17 prod files)
9. Keep: Effect.catchAll for error boundaries (used in 17 prod files)
10. Keep: Effect.runPromise at boundaries (used in 10+ files)
11. Keep: const self = this capture pattern for class methods
12. Keep: The caveat that Effect is for async composition only

### Step 6: Verification

Run in order:

1. `pnpm install` — exit 0
2. `pnpm run typecheck` — exit 0, 0 errors
3. `pnpm exec biome check --write` — exit 0
4. `pnpm run test -- --run` — all pass

## Verification

1. `pnpm install` completes without error
2. `@effect/language-service` not found in `node_modules` or `package.json`
3. tsconfig.json has no `@effect/language-service` plugin
4. ADR-0013 status is "Hold — Pragmatic Adoption"
5. AGENTS.md Effect section describes only the patterns actually in use
6. All tests pass
