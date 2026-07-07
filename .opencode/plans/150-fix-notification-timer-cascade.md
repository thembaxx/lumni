# Plan 150: Fix notification scheduling timer leak — clear cascading timeouts on unmount

> **Executor instructions**: Follow this plan step by step.
> **Drift check**: `git diff --stat 649afc3b..HEAD -- src/lib/services/notification-service/alert-schedulers.ts src/hooks/use-notifications.ts`

## Status

- **Priority**: P1 | **Effort**: M | **Risk**: LOW | **Depends on**: none | **Category**: bug
- **Planned at**: commit `649afc3b`, 2026-07-07

## Why this matters

`initializeNotificationSchedulers` in `alert-schedulers.ts` uses `setTimeout` to recursively schedule the next check (`.then(() => { timer = setTimeout(scheduleNext, ONE_HOUR) })`). There's no cleanup mechanism for the outer recursive timers when the user logs off, navigates away, or the service is torn down. Over hours of operation, leaked timeouts accumulate. On React unmount, the outermost `setTimeout` may be cleared but the inner scheduled ones are not, leading to continued execution after teardown.

## Current state

The scheduling pattern is:

```typescript
function scheduleAll(): void {
  const timer = setTimeout(() => {
    scheduleDailyDigest(...).finally(() => {
      timer = setTimeout(scheduleAll, ONE_HOUR);
    });
  }, delay);
}
```

Only the outermost `timer` is returned. When `clearTimeout(timer)` is called on cleanup, the inner `timer` (reassigned inside `.finally()`) may still fire. The next scheduled invocation has no reference to clear.

## Steps

### Step 1: Convert to `setInterval` with cleanup ref

Replace the recursive `setTimeout` pattern with `setInterval`. This avoids the timer-reference-leak problem entirely because there's only one interval handle:

```typescript
function scheduleAll(cleanupRef: { current: (() => void) | null }): void {
  const run = () => {
    scheduleDailyDigest(...).catch(logError);
  };
  const interval = setInterval(run, ONE_HOUR);
  cleanupRef.current = () => clearInterval(interval);
}
```

### Step 2: Wire cleanup to component lifecycle

If called from a React context/provider, use `useEffect` cleanup:

```typescript
useEffect(() => {
  const cleanupRef: { current: (() => void) | null } = { current: null };
  initializeNotificationSchedulers(cleanupRef);
  return () => cleanupRef.current?.();
}, []);
```

If called from a non-React context, return the cleanup function explicitly and call it on service shutdown.

### Step 3: Verify

```typescript
// Simulate 3-hour run with timer capture:
const cleanupRef = { current: null };
const spy = vi.fn();
vi.useFakeTimers();
initializeNotificationSchedulers(cleanupRef);
vi.advanceTimersByTime(ONE_HOUR * 3);
cleanupRef.current?.();
vi.advanceTimersByTime(ONE_HOUR); // Should NOT fire
expect(spy).not.toHaveBeenCalledTimes(4); // Should be 3, not 4
vi.useRealTimers();
```

## Done criteria

- [ ] Timer cleanup on unmount verified (no post-cleanup invocation)
- [ ] Tests added for timer cleanup behavior
- [ ] `pnpm typecheck` exits 0

## STOP conditions

Stop and report if the scheduling logic has already been refactored to use `setInterval`.
