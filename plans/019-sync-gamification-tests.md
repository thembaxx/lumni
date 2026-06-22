# Plan 019: Sync Handler + Gamification Service Tests

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: testing
- **Planned at**: commit after `016-stories-content`, 2026-06-21

## Why this matters

The sync handler was significantly changed in plan 011 (sequential processing) but only has 8 tests covering 2 of 8 tables. The gamification service was refactored in Session 38 (stateful orchestrator pattern) but has zero tests — only the underlying pure engine is tested. Both modules are critical infrastructure with no regression safety net.

## Scope

**In scope**:

- `src/lib/sync/__tests__/sync-handler.test.ts` — expand from 8 to ~25 tests
- `src/lib/gamification-engine/__tests__/gamification-service.test.ts` — new file, ~20 tests

**Out of scope**:

- Sync manager tests (separate module)
- Gamification engine tests (already have 20 tests)
- Hook-level tests (use-gamification.test.tsx exists)

## Test patterns to follow

Use `vi.mock()` + dynamic `await import()` pattern (established in existing sync-handler.test.ts). Use `vi.useFakeTimers()` for gamification service debounce tests.

## Steps

### Step 1: Expand sync handler tests

File: `src/lib/sync/__tests__/sync-handler.test.ts`

Add tests for the 6 untested tables:

**competencies** (3 tests):

- Enqueues `appwrite-competency-sync` with correct payload
- Maps `score` field to `proficiency` in payload
- Handles empty competencies array

**flashcards** (2 tests):

- Enqueues `appwrite-flashcard-sync` with correct payload
- Handles empty flashcards array

**wrongAnswers** (2 tests):

- Enqueues `appwrite-wrong-answer-sync` with correct payload
- Handles empty wrongAnswers array

**chatMessages** (2 tests):

- Enqueues `appwrite-chat-sync` with correct payload
- Handles empty chatMessages array

**questionRatings** (2 tests):

- Enqueues `appwrite-rating-sync` with correct payload
- Does NOT include userId in payload (verify this is intentional)

**bookmarks** (2 tests):

- Enqueues `appwrite-bookmark-sync` with correct payload
- Handles empty bookmarks array

**Error handling** (3 tests):

- Table.toArray() rejection: logs error, other tables still process
- enqueue() rejection: fire-and-forget, no propagation
- Unknown table name: processTable falls through switch, no-op

**Total new tests**: ~18

### Step 2: Create gamification service tests

New file: `src/lib/gamification-engine/__tests__/gamification-service.test.ts`

Mock all dependencies:

- `@/lib/db` — mock `gamification` table accessor
- `@/lib/gamification-engine` — mock `gamificationEngine` with vi.fn()
- `@/lib/services/leaderboard-service` — mock `saveWeeklySnapshot`
- `@/lib/shared/api-fetch` — mock `apiFetch`
- `@/lib/shared/logger` — mock `logError`

Tests:

**subscribe/notify** (3 tests):

- Listener receives state on mutation
- Unsubscribe stops notifications
- Multiple listeners all notified

**addXp** (3 tests):

- Delegates to engine, returns correct XpResult
- Persists to Dexie after mutation
- Notifies listeners after mutation

**addAchievement** (2 tests):

- Delegates to engine, returns correct AchievementResult
- Persists + notifies

**updateStreak** (2 tests):

- Delegates, persists, notifies
- Returns StreakResult with correct shape

**consumeStreakFreeze** (2 tests):

- Success: persists + syncs + notifies
- Failure (0 freezes): does NOT persist or notify

**checkForRewardChests** (2 tests):

- With claimable chest: persists + notifies
- Without claimable chest: still notifies, no persist

**Error handling** (2 tests):

- Dexie persist failure: swallowed, logged
- API sync failure: swallowed, logged

**Debounce** (2 tests):

- Rapid addXp calls: only one sync fires after 2s
- Uses vi.useFakeTimers()

**Total new tests**: ~20

### Step 3: Verification

```bash
npx tsc --noEmit
npx biome check src/lib/sync/__tests__/ src/lib/gamification-engine/__tests__/
bun run test
```

## Done criteria

- [ ] `npx tsc --noEmit` exits 0
- [ ] `bun run test` exits 0 (no regressions, new tests pass)
- [ ] Sync handler tests cover all 8 tables + error handling (~25 total)
- [ ] Gamification service tests cover all public methods (~20 total)
- [ ] `plans/README.md` status row updated

## STOP conditions

- `__setDepsForTesting` is not exported from gamification service
- Mock patterns from existing tests don't work for new tests
- Timer mocking conflicts with other tests
