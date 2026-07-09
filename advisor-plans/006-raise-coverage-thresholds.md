# Plan 006: Raise vitest coverage thresholds to meaningful values

> **Executor instructions**: Follow this plan step by step. Run every
> verification command before moving on. If the "STOP conditions" section
> triggers, report back — do not improvise. When done, update the status row
> in `advisor-plans/README.md`.
>
> **Drift check**: `git diff --stat be3a4dfb..HEAD -- vitest.config.ts`
> If the coverage config was already changed, verify against current values.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `be3a4dfb`, 2026-07-09

## Why this matters

The current coverage thresholds (`statements: 10%, branches: 5%, functions: 8%, lines: 10%`) are essentially zero — any PR passes the coverage gate regardless of whether it adds any tests. These appear to be the "we just installed vitest" defaults rather than meaningful targets. Raising them to match actual coverage (25-30% statements, 20% branches) creates a regression gate: a PR that removes tests or adds untested code will fail CI.

## Current state

`src/lib/` has ~26% test-to-source line ratio overall (215 test files, ~27K test lines vs. ~102K source lines). The `vitest.config.ts` coverage thresholds at line 29:

```typescript
thresholds: {
  statements: 10,
  branches: 5,
  functions: 8,
  lines: 10,
},
```

The coverage excludes list (lines 16-28):

```typescript
exclude: [
  "src/**/*.test.{ts,tsx}",
  "src/**/*.spec.{ts,tsx}",
  "src/**/__tests__/**",
  "src/**/__mocks__/**",
  "src/app/**/layout.tsx",
  "src/app/**/page.tsx",
  "src/app/**/loading.tsx",
  "src/app/**/error.tsx",
  "src/types/**",
  "src/instrumentation.ts",
  "next.config.ts",
],
```

**Repo conventions to match:**

- Vitest config at `vitest.config.ts` (root level)
- CI runs `vitest run --coverage` in the `unit-tests` job
- Current actual coverage from a dry run would determine the correct targets

## Commands needed

| Purpose  | Command                      | Expected on success   |
| -------- | ---------------------------- | --------------------- |
| Coverage | `pnpm vitest run --coverage` | Exits 0, prints table |

## Scope

**In scope:**

- `vitest.config.ts` — update threshold values

**Out of scope:**

- Any source code changes
- `vitest.config.ts` exclude list — leave as-is
- CI pipeline changes

## Steps

### Step 1: Run coverage to get current values

```bash
pnpm run test -- --coverage
```

Look for the output line: `Statements: XX.YY% (ZZZZ/AAAA)`. Note all four values: statements, branches, functions, lines.

**Expected**: Between 25-30% statements, 15-20% branches given the test-to-source ratio.

### Step 2: Update thresholds

Set thresholds to roughly 80% of current values (giving 20% headroom for normal fluctuation):

```typescript
thresholds: {
  statements: Math.round(currentStatements * 0.8),
  branches: Math.round(currentBranches * 0.8),
  functions: Math.round(currentFunctions * 0.8),
  lines: Math.round(currentLines * 0.8),
},
```

For example, if current is 28% statements, set to 22%.

**Important**: Round down slightly. It's better to have a threshold that passes consistently than one that breaks on every minor code change.

**Verify**: `pnpm run test -- --coverage` → exits 0 (threshold is not breached)

### Step 3: Run full gate

**Verify**:

- `pnpm typecheck` → exit 0
- `pnpm run test` → all pass (coverage step passes)
- `pnpm exec oxlint` → exit 0

## Test plan

No new tests. Verification is running the coverage suite and confirming it passes.

## Done criteria

- [ ] `pnpm run test -- --coverage` exits 0
- [ ] Thresholds are now set to non-zero values (≥20% statements, ≥10% branches)
- [ ] `git diff vitest.config.ts` shows only the four threshold numbers changed
- [ ] `advisor-plans/README.md` status row updated

## STOP conditions

Stop and report if:

- Current coverage is below 15% statements (the existing tests might be broken or exclude too much)
- The coverage run takes longer than 5 minutes (possible on slow hardware — still run it, just warn)
- Raising thresholds causes CI to fail (this is expected — the headroom ensures stability; if it breake the current commit's test suite, report the actual numbers)

## Maintenance notes

- Raise thresholds gradually: every 3-6 months, re-run coverage and bump targets 5-10 points.
- When coverage drops below threshold, you can either add tests or temporarily lower the threshold and add a note. Prefer adding tests.
- The `exclude` list is reasonable. If new directories are added to the project, add them to the exclude.
