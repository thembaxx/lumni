# Plan 158: Raise vitest coverage thresholds

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 82a850d3..HEAD -- vitest.config.ts`
> If vitest.config.ts changed since this plan was written, treat it as a STOP
> condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `82a850d3`, 2026-07-10

## Why this matters

The vitest coverage thresholds are set at 0% for all metrics
(`statements: 0, branches: 0, functions: 0, lines: 0`). This means the
pipeline will never fail due to insufficient coverage, no matter how low it
drops. Raising these to a meaningful minimum (e.g., match the current actual
coverage) creates a safety net: any PR that adds untested code will be caught.

## Current state

The relevant lines in `vitest.config.ts`:

```typescript
coverage: {
  provider: "v8",
  reporter: ["text", "json-summary", "lcov"],
  thresholds: {
    statements: 0,
    branches: 0,
    functions: 0,
    lines: 0,
  },
},
```

## Scope

**In scope**:

- `vitest.config.ts` — raise thresholds

**Out of scope**:

- Do NOT change any test files or source files
- Do NOT change the coverage provider or reporter config
- Do NOT add per-file thresholds or exclude patterns

## Git workflow

- Branch: `advisor/158-raise-test-thresholds`
- Commit message: `ci: raise vitest coverage thresholds from 0% to current baseline`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Measure current coverage

```bash
pnpm run test -- --coverage
```

Parse the `text` reporter output for overall percentages. Example output:

```
Lines        : 23.4% ( 1234 / 5678 )
Functions    : 18.9% (  456 / 2412 )
Statements   : 23.1% ( 2345 / 10123 )
Branches     : 15.2% (  789 / 5189 )
```

Record these 4 numbers precisely.

### Step 2: Update the config

Set each threshold to the recorded percentage, rounded DOWN to the nearest
whole percent. Do NOT round — use floor. This ensures the threshold never
exceeds current actual coverage.

```typescript
thresholds: {
  statements: 23,  // replace with actual
  branches: 15,    // replace with actual
  functions: 18,   // replace with actual
  lines: 23,       // replace with actual
},
```

### Step 3: Verify the thresholds pass

```bash
pnpm run test -- --coverage
```

If the check exits 0, the thresholds are set correctly. If it exits non-zero,
you miscalculated (a threshold is higher than actual coverage). Lower by 1
and re-run.

**Verify**: `pnpm run typecheck` → exit 0.

### Step 4: Set a CI-hardness level

The `--coverage` flag is NOT currently part of the CI test job in
`.github/workflows/ci.yml`. Look for `test` or `vitest` in the CI file — if
coverage reporting is not part of CI, the thresholds are only enforced
locally. This is acceptable for now (scope boundary), but add a comment in
the CI file noting that if coverage is added to CI, the thresholds will
enforce automatically.

```bash
grep -n 'coverage\|vitest\|test' .github/workflows/ci.yml
```

If coverage is already in CI, great — nothing more to do. If not, add a \
comment:

```
# TODO: add --coverage to the vitest run to enforce coverage thresholds
```

## Test plan

No tests to write or update. The coverage thresholds are infra config only.

## Done criteria

- [ ] `pnpm run test -- --coverage` exits 0 (thresholds match or are below
      current coverage)
- [ ] All 4 threshold values in `vitest.config.ts` are non-zero integers
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- Running `pnpm run test -- --coverage` fails for unrelated reasons (e.g.,
  coverage plugin missing, v8 provider not available). If the coverage
  reporter itself doesn't work, fix that first, then come back to thresholds.
- Any of the 4 metrics is above 80% — that would be a pleasant surprise.
  Consider a more aggressive target discussion with the team. But still set
  the threshold to the actual value.

## Maintenance notes

- These thresholds are a floor, not a target. Every time a new feature adds
  tested code, the actual coverage goes up. Every 3-6 months, run this plan
  again to raise the floor.
- If a legitimate refactor temporarily drops coverage, the team can lower the
  threshold in that PR with a documented reason. The threshold should trend
  upward over time.
