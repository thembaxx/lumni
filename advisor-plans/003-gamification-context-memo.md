# Plan 003: Memoize gamification hook return value to prevent cascading re-renders

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `advisor-plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat be3a4dfb..HEAD -- src/hooks/use-gamification.ts src/contexts/gamification-provider.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (independent)
- **Category**: perf
- **Planned at**: commit `be3a4dfb`, 2026-07-09

## Why this matters

The `useGamification` hook returns a plain object literal `{ gamification, levelInfo, isLoaded, ... }` at line 250 of its file. This creates a **new object reference on every render**. The `GamificationProvider` spreads this into React context. Every gamification mutation (addXp, updateStreak, unlockAchievement, chest check) cascades a re-render through 17+ dashboard components — even those that only read a single field like `lastPracticeDate`. On quiz completion, multiple mutations fire sequentially, causing a chain of 5-10 full dashboard re-renders.

The fix is wrapping the return value in `useMemo` to stabilize the object reference when underlying data hasn't changed.

## Current state

```typescript
// src/hooks/use-gamification.ts ~ line 250-277
return {
  gamification,
  levelInfo,
  isLoaded: true,
  addXp,
  addAchievement,
  checkAndUnlockAchievements,
  updateStreak,
  useStreakFreeze: consumeStreakFreeze,
  addStreakFreeze,
  completeDailyChallenge,
  checkForRewardChests,
  currentStreak: data.currentStreak,
  streakFreezes: data.streakFreezes,
  subjectQuestionCounts: data.subjectQuestionCounts,
  totalQuestionsAnswered: data.totalQuestionsAnswered,
  claimedChests: data.claimedChests,
  rewardChests: REWARD_CHESTS,
  leveledUp,
  pendingAchievement,
  pendingChest,
  clearLevelUp,
  clearAchievement,
  clearChest,
  updateCounter,
  // ...
};
```

The functions (`addXp`, `addAchievement`, etc.) are already wrapped in `useCallback` earlier in the file. The issue is that the **container object** is recreated each render.

The provider in `src/contexts/gamification-provider.tsx` spreads this object:

```typescript
<GamificationContext.Provider value={value}>
```

**Repo conventions to match:**

- `useMemo` from React is already imported at the top of the file
- Functions are already wrapped with `useCallback` — see their earlier definitions
- The hook uses `const service = useMemo(() => ...)` pattern already (line ~40)
- 17 consumers call `useGamificationContext()` including: today-tab, daily-challenge-card, streak-card, achievement-showcase, competition-card, stats-row, daily-progress-ring

## Commands needed

| Purpose   | Command                   | Expected on success |
| --------- | ------------------------- | ------------------- |
| Typecheck | `pnpm typecheck`          | exit 0              |
| Tests     | `pnpm run test`           | all pass            |
| Lint      | `pnpm exec oxlint`        | exit 0              |
| Format    | `pnpm exec oxfmt --check` | exit 0              |

## Scope

**In scope:**

- `src/hooks/use-gamification.ts` — add `useMemo` wrapping to the return object

**Out of scope:**

- `src/contexts/gamification-provider.tsx` — the provider is fine, the value changes because the hook creates new references
- Individual consumer components — no changes needed
- `src/lib/gamification-engine/` — no changes needed
- Converting to multiple contexts (that would be a larger refactor)

## Steps

### Step 1: Read the full return statement

Read `src/hooks/use-gamification.ts` lines 240-280 to see the exact return object and the variable names for the members that come from the service data vs. local state.

### Step 2: Wrap the return object in `useMemo`

Add a `useMemo` call around the return object. The dependency array must include every value that changes:

**From the service `data` object:**

- `data.currentStreak`, `data.streakFreezes`, `data.subjectQuestionCounts`, `data.totalQuestionsAnswered`, `data.claimedChests`
- `gamification` (the full state object from `useGamificationStore()`)

**From local state/UI:**

- `levelInfo` (depends on `data.xp`)
- `leveledUp`, `pendingAchievement`, `pendingChest` (local state)
- All callback functions (already stable via `useCallback`, but React recommends including them for correctness: `addXp`, `addAchievement`, `checkAndUnlockAchievements`, `updateStreak`, `consumeStreakFreeze`, `addStreakFreeze`, `completeDailyChallenge`, `checkForRewardChests`, `clearLevelUp`, `clearAchievement`, `clearChest`, `updateCounter`, `setCounter`)

**Constants that never change:**

- `REWARD_CHESTS` — module-level constant, safe to omit
- `isLoaded: true` — always true when this returns

```typescript
// After change — pseudocode
return useMemo(
  () => ({
    gamification,
    levelInfo,
    isLoaded: true,
    addXp,
    addAchievement,
    checkAndUnlockAchievements,
    // ... all other fields
  }),
  [
    gamification,
    levelInfo,
    data.currentStreak,
    data.streakFreezes,
    data.subjectQuestionCounts,
    data.totalQuestionsAnswered,
    data.claimedChests,
    leveledUp,
    pendingAchievement,
    pendingChest,
    addXp,
    addAchievement,
    checkAndUnlockAchievements,
    updateStreak,
    consumeStreakFreeze,
    addStreakFreeze,
    completeDailyChallenge,
    checkForRewardChests,
    clearLevelUp,
    clearAchievement,
    clearChest,
    updateCounter,
    setCounter,
  ],
);
```

**Important**: The `gamification` variable may be the entire `StoredGamification` object from `useState`. Include it in the deps.

**Verify**: `pnpm typecheck` → exit 0

### Step 3: Verify tests pass

**Verify**: `pnpm run test` → all tests pass (especially `use-gamification.test.tsx` and gamification-engine tests)

### Step 4: Run full gate

**Verify**:

- `pnpm typecheck` → exit 0
- `pnpm exec oxlint` → exit 0
- `pnpm exec oxfmt --check` → exit 0
- `pnpm run test` → all pass

## Test plan

No new tests needed for this ref-only change. The existing `useGamification` tests should continue to pass. The change is purely about object reference stability — behavior is identical.

If you want to add a test (optional), write a quick assertion that the hook identity is stable across renders with the same data:

```typescript
// In src/hooks/__tests__/use-gamification.test.tsx (or similar)
it("returns a stable reference when data has not changed", async () => {
  const { result, rerender } = renderHook(() => useGamificationContext(), { wrapper });
  const firstRef = result.current;
  rerender();
  expect(result.current).toBe(firstRef); // same reference, no re-render
});
```

## Done criteria

- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm run test` — all pass
- [ ] `pnpm exec oxlint` — zero warnings
- [ ] `git diff` shows only `src/hooks/use-gamification.ts` changed
- [ ] The return value at line ~250 now wraps with `useMemo`
- [ ] `advisor-plans/README.md` status row updated

## STOP conditions

Stop and report if:

- TypeScript errors about missing deps in the `useMemo` array — add them rather than suppressing
- `gamification` is a complex getter that changes identity every render even when data is the same (unlikely — it comes from `useState`)
- `levelInfo` is computed inside the return block (it's likely computed before in the hook body — read first to confirm the variable exists)
