# Plan 170: Fix Notification Timer Leak

> **Executor instructions**: Follow this step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 409ce60c..HEAD -- src/lib/services/notification-service/alert-schedulers.ts`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `409ce60c`, 2026-07-15
- **Issue**: (none)

## Why this matters

`scheduleAssignmentReminders` and `scheduleExamAlerts` create `setTimeout` timers. `clearActiveTimers()` is only called in `initializeNotificationSchedulers()`. If the component unmounts and remounts, old timestamps prevent duplicate timers, but the old timer still fires and calls `sendLocalNotification`. The `activeTimers` Set grows unboundedly if `initializeNotificationSchedulers()` is called multiple times. Users may receive stale/duplicate notifications.

## Current state

In `src/lib/services/notification-service/alert-schedulers.ts`:

- Line ~168: `setTimeout(...)` added to `activeTimers` in `scheduleAssignmentReminders`
- Line ~224: `setTimeout(...)` added to `activeTimers` in `scheduleExamAlerts`
- Line ~268: `clearActiveTimers()` called in `initializeNotificationSchedulers()`

The `activeTimers` Set is never cleaned up on unmount. `initializeNotificationSchedulers()` doesn't return a cleanup function.

## Commands you will need

| Purpose   | Command                  | Expected on success |
| --------- | ------------------------ | ------------------- |
| Install   | `pnpm install`           | exit 0              |
| Typecheck | `pnpm run typecheck`     | exit 0, no errors   |
| Tests     | `pnpm run test -- --run` | all pass            |
| Lint      | `pnpm exec oxlint --fix` | exit 0              |

## Scope

**In scope**:

- `src/lib/services/notification-service/alert-schedulers.ts`

## Steps

### Step 1: Return a cleanup function from `initializeNotificationSchedulers`

At the end of `initializeNotificationSchedulers()`, return a cleanup function that calls `clearActiveTimers()`:

```typescript
export function initializeNotificationSchedulers(): () => void {
  // existing code...

  return () => {
    clearActiveTimers();
  };
}
```

### Step 2: Update all callers to use the cleanup function

Search for calls to `initializeNotificationSchedulers()` and ensure the return value is used as a `useEffect` cleanup or similar lifecycle hook. If the caller is in a React component:

```typescript
useEffect(() => {
  const cleanup = initializeNotificationSchedulers();
  return cleanup;
}, []);
```

**Verify**: `rg "initializeNotificationSchedulers" src/` — confirm every caller stores/uses the cleanup

### Step 3: Run all verification gates

**Verify**: `pnpm run typecheck` → exit 0, no errors
**Verify**: `pnpm run test -- --run` → all pass
**Verify**: `pnpm exec oxlint --fix` → exit 0

## Test plan

Existing tests should pass. No new tests needed for this cleanup pattern.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] `initializeNotificationSchedulers()` returns a cleanup function
- [ ] All callers use the cleanup function (not discarding the return value)
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The function signatures differ from the excerpts
- `clearActiveTimers()` is not defined or does something different
- A step's verification fails twice after a reasonable fix attempt

## Maintenance notes

Timer cleanup is a recurring pattern in this codebase. Future timer-creating functions should follow the same return-cleanup pattern. Reviewers should check that cleanup runs on all exit paths (unmount, error, manual stop).
