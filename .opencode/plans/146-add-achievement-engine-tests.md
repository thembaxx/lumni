# Plan 146: Add achievement engine unit tests

> **Executor instructions**: Follow this plan step by step.
> **Drift check**: `git diff --stat 649afc3b..HEAD -- src/lib/gamification-engine/`

## Status

- **Priority**: P1 | **Effort**: M | **Risk**: LOW | **Depends on**: none | **Category**: test
- **Planned at**: commit `649afc3b`, 2026-07-07

## Why this matters

The gamification engine (`src/lib/gamification-engine/`) has zero unit tests despite containing ~400 lines of business-critical achievement-checking logic (XP, streak, achievement unlock conditions, chest rewards). The `checkAndUnlockAchievements` method encodes scoring rules (100 XP per achievement, streak freeze pricing, etc.) that, if wrong, silently corrupt user state.

## Current state

- `src/lib/gamification-engine/gamification-engine.ts` — ~250 lines of achievement-checking logic
- `src/lib/gamification-engine/service.ts` — ~150 lines of state management
- `src/lib/gamification-engine/types.ts` — ~50 lines of types
- No test file exists for any of these

## Steps

### Step 1: Create test file

Create `src/lib/gamification-engine/__tests__/gamification-engine.test.ts`.

### Step 2: Write unit tests for `gamification-engine.ts`

Test `checkAndUnlockAchievements` with:

1. **First-time XP gain** — user starts at 0 XP, earns 10 XP → returns `{ xpGained: 10, newTotal: 10 }`
2. **Level up** — user at 90 XP, earns 20 XP → returns `{ xpGained: 20, newTotal: 110, leveledUp: true, ... }`
3. **Streak update** — syncDailyStreak: previous end `2026-07-05`, today `2026-07-06` (no break) → streak continues
4. **Streak broken** — previous end `2026-07-04`, today `2026-07-06` (1-day gap) → streak resets
5. **Achievement unlock** — first accomplishment → achievement added to `achievements[]`
6. **Achievement already earned** — same accomplishment again → no duplicate
7. **Chest tier progression** — 5th daily check-in → `chestTier` advances
8. **Streak freeze consumed** — streak would break but `freezeCount > 0` → freeze consumed, streak preserved

### Step 3: Write unit tests for `service.ts`

Test `GamificationService` with:

1. **Initialise with default values** — empty state gets defaults (0 XP, 0 streak, etc.)
2. **Update counter additive** — `updateCounter("wrongAnswersReviewed", 5)` → value increases by 5
3. **Set counter absolute** — `setCounter("wrongAnswersReviewed", 10)` → value becomes 10
4. **Persist on mutate** — verify `saveGamification` or equivalent persistence is called

### Step 4: Verify

`pnpm test` → new tests pass. `pnpm typecheck` → exit 0.

## Test plan

The gamification engine depends on a `StoredGamification` type and a persistence layer. For unit tests, mock the persistence layer or pass an `InMemoryDataAccess`. Follow the existing DI test pattern from `src/lib/gamification-engine/service.test.ts`.

## Done criteria

- [ ] `pnpm test` passes (all new tests + existing)
- [ ] `pnpm typecheck` exits 0
- [ ] Achievement unlock logic (XP, streak, chest, freeze) covered by at least 8 test cases
- [ ] Service layer persistence verified

## STOP conditions

Stop and report if the gamification engine's constructor/dependency signature has changed substantially — read the current source first to verify the DI pattern.
