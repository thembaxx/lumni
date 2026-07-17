# Plan 216: Add defensive default to `competencyLevelToWeight` switch

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug

## Why this matters

`competencyLevelToWeight()` maps a `CompetencyLevel` string to a numeric weight used in schedule priority calculations. The switch has no `default:` arm. If a new competency level is added (e.g. `"beginner"`, `"advanced"`) or an unexpected value leaks in from a corrupted Dexie record, the function returns `undefined`. Callers treat the result as a number: priority scores become `NaN`, schedule ordering breaks silently, and topics with unknown levels are pushed to the end of the queue with no diagnostic.

The existing `CompetencyLevel` type union is `"novice" | "developing" | "proficient" | "mastered"` — exhaustive today, but the lack of `default` means the compiler won't flag a gap when the union expands. Adding `default` with `logError` + sensible fallback prevents silent NaN propagation.

## Current state

`src/lib/study-planner/adaptive-planner.ts:131-142`:

```ts
function competencyLevelToWeight(level: CompetencyLevel): number {
  switch (level) {
    case "novice":
      return 4;
    case "developing":
      return 3;
    case "proficient":
      return 2;
    case "mastered":
      return 1;
  }
  // missing default → returns undefined → NaN in calculations
}
```

`CompetencyLevel` is a string union defined in the same file (likely around line 116-122):

```ts
type CompetencyLevel = "novice" | "developing" | "proficient" | "mastered";
```

## Target state

Switch gets a `default:` arm that:

1. Calls `logError("competencyLevelToWeight", { level })` to report the unexpected value
2. Returns a fallback weight of `2.5` (mid-range, equivalent to "proficient-adjacent") so schedule calculations degrade gracefully instead of producing NaN

```ts
function competencyLevelToWeight(level: CompetencyLevel): number {
  switch (level) {
    case "novice":
      return 4;
    case "developing":
      return 3;
    case "proficient":
      return 2;
    case "mastered":
      return 1;
    default:
      logError("competencyLevelToWeight", `Unexpected level: ${level}`);
      return 2.5;
  }
}
```

## Scope

- `src/lib/study-planner/adaptive-planner.ts` only, lines 131-142
- No other files
- No behavioural change for valid inputs

## Steps

### 1. Verify current code

Read `src/lib/study-planner/adaptive-planner.ts:130-145` to confirm exact line numbers and surrounding code.

### 2. Add `default:` arm

Edit `competencyLevelToWeight`:

After the `case "mastered": return 1;` line, insert:

```ts
    default:
      logError("competencyLevelToWeight", `Unexpected competency level: ${level}`);
      return 2.5;
```

### 3. Ensure `logError` is imported

Check the imports at the top of `adaptive-planner.ts`. If `logError` is not already imported from `@/lib/shared/logger`, add the import.

### 4. Verify

```bash
pnpm run typecheck
pnpm exec biome check --write
pnpm run test
```

Expected: zero errors. All existing tests pass because valid inputs still hit their cases.

## Stop conditions

- Any file outside `src/lib/study-planner/adaptive-planner.ts` is modified — stop and revert
- `pnpm run typecheck` fails
- Any test regresses

## Estimated time

15 minutes
