# Plan 224: Memoize calculateLevel in use-gamification hook

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: perf

## Why this matters

The `use-gamification` hook is consumed by the dashboard, quiz results, exam sessions, and flashcard sessions — any component that shows XP, level, or achievements. `calculateLevel(data.totalXp)` runs on every render of every consumer. If `calculateLevel` iterates through XP thresholds (e.g., `findIndex` over an array of level boundaries), this is wasted work on every render. Wrapping with `useMemo` limits the computation to only when `data.totalXp` actually changes.

At the app level, this fixes a subtle performance anti-pattern: gamification state changes frequently (streak updates, XP gains), causing the hook's `data` object to be replaced, which triggers re-renders in all consumers. Each re-render re-executes `calculateLevel`.

## Current state

- `src/hooks/use-gamification.ts:65`:

```ts
const levelInfo = calculateLevel(data.totalXp);
```

`data.totalXp` changes whenever XP changes (quiz completion, achievements, etc.). No memoization — `calculateLevel` runs on every render cycle.

## Target state

- Line wrapped in `useMemo`:

```ts
const levelInfo = useMemo(() => calculateLevel(data.totalXp), [data.totalXp]);
```

## Scope

- `src/hooks/use-gamification.ts` — single line change

## Steps

### 1. Wrap with useMemo

In `src/hooks/use-gamification.ts`, change line 65 from:

```ts
const levelInfo = calculateLevel(data.totalXp);
```

to:

```ts
const levelInfo = useMemo(() => calculateLevel(data.totalXp), [data.totalXp]);
```

### 2. Verify

```bash
pnpm run typecheck
pnpm exec biome check --write
pnpm run test
```

Manually verify: complete a quiz, earn XP. The level-up overlay and XP popup should still render correctly — they read `levelInfo` which still updates when XP changes (because `data.totalXp` changes trigger the `useMemo` recalculation).

## Stop conditions

- Level info doesn't update after gaining XP (stale memo value)
- TypeScript errors

## Estimated time

10 min
