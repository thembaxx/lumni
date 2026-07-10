# Plan 147: Fix fire-and-forget notification timer leak

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 82a850d3..HEAD -- src/lib/services/notification-service/`
> If any file under that directory changed since this plan was written, compare
> the "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: correctness
- **Planned at**: commit `82a850d3`, 2026-07-10

## Why this matters

Two functions in `alert-schedulers.ts` (`scheduleAssignmentReminders` and
`scheduleExamAlerts`) call `setTimeout(() => sendLocalNotification(...), delay)`
but never store or clear the timer handle. If `initializeNotificationSchedulers()`
is called multiple times (settings change, hot-reload, component remount),
the old timers are never cancelled and multiple notifications fire for the
same event. Users receive duplicate "Assignment Due Tomorrow!" or "Exam
tomorrow!" notifications.

The `study-scheduler.ts` module (same directory) already has the correct
pattern: a module-level `let currentTimer: ReturnType<typeof setTimeout>`
with a `clearCurrentTimer()` function called before creating a new timer.

## Current state

**File**: `src/lib/services/notification-service/alert-schedulers.ts`

`scheduleAssignmentReminders` (lines 147-169) creates a `setTimeout` per
assignment with no stored handle:

```typescript
// Lines 158-165
const delay = alertTime - now;
setTimeout(() => {
  // <-- handle not stored
  sendLocalNotification(
    "Assignment Due Tomorrow!",
    `Your assignment on ${a.topics.join(", ")} is due tomorrow. Complete it now!`,
    "/dashboard",
  );
}, delay);
```

`scheduleExamAlerts` (lines 197-223) does the same per exam slot:

```typescript
// Lines 213-219
setTimeout(() => {
  // <-- handle not stored
  sendLocalNotification(
    `${slot.subject} exam tomorrow!`,
    `Your ${slot.subject} exam starts at ${slot.startTime}. Good luck!`,
    "/dashboard",
  );
}, delay);
```

The correct pattern exists in the same directory at
`src/lib/services/notification-service/study-scheduler.ts`:

```typescript
// From study-scheduler.ts
let currentTimer: ReturnType<typeof setTimeout> | null = null;

export function clearCurrentTimer(): void {
  if (currentTimer !== null) {
    clearTimeout(currentTimer);
    currentTimer = null;
  }
}

// Before each setTimeout:
clearCurrentTimer();
currentTimer = setTimeout(() => { ... });
```

## Scope

**In scope**:

- `src/lib/services/notification-service/alert-schedulers.ts` — both timer leak functions

**Out of scope**:

- Do NOT change `study-scheduler.ts` (it already has the correct pattern)
- Do NOT extract or refactor the storage-persistence pattern (already works)

## Git workflow

- Branch: `advisor/147-notification-timer-leak`
- Commit message: `fix: store and clear notification alert timers to prevent duplicates`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add timer storage + cleanup to `alert-schedulers.ts`

Add at the top of the file (after the existing imports and before the first function):

```typescript
const activeTimers = new Set<ReturnType<typeof setTimeout>>();

function clearActiveTimers(): void {
  for (const timer of activeTimers) {
    clearTimeout(timer);
  }
  activeTimers.clear();
}
```

### Step 2: Store timer handles in `scheduleAssignmentReminders`

Replace the timer creation block (lines 158-165) with:

```typescript
const timer = setTimeout(() => {
  sendLocalNotification(
    "Assignment Due Tomorrow!",
    `Your assignment on ${a.topics.join(", ")} is due tomorrow. Complete it now!`,
    "/dashboard",
  );
  activeTimers.delete(timer);
}, delay);
activeTimers.add(timer);
```

### Step 3: Store timer handles in `scheduleExamAlerts`

Replace the timer creation block (lines 213-219) with:

```typescript
const timer = setTimeout(() => {
  sendLocalNotification(
    `${slot.subject} exam tomorrow!`,
    `Your ${slot.subject} exam starts at ${slot.startTime}. Good luck!`,
    "/dashboard",
  );
  activeTimers.delete(timer);
}, delay);
activeTimers.add(timer);
```

### Step 4: Wire cleanup into `initializeNotificationSchedulers`

Find the `initializeNotificationSchedulers()` function (around line 254).
Add a call to `clearActiveTimers()` at the top of the function body, before
any new timer creation:

```typescript
export async function initializeNotificationSchedulers(): Promise<void> {
  clearActiveTimers();  // <-- add this
  clearAllTimers();     // existing cleanup for study-scheduler
  // ... rest of function
```

**Verify**: `pnpm run typecheck` → exit 0, no errors.

## Test plan

The existing test at `src/lib/services/notification-service/__tests__/alert-schedulers.test.ts`
(if it exists) should still pass. No new tests needed — the change is purely
additive (storing handles + cleanup). A reviewer should verify that:

1. `clearActiveTimers()` is called before scheduling new alerts
2. Each timer self-removes from the set after firing
3. `activeTimers` is module-scoped, not leaking to other modules

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0, no regressions
- [ ] `pnpm exec oxlint` — zero warnings on changed files
- [ ] `grep -n 'const timer = setTimeout' src/lib/services/notification-service/alert-schedulers.ts` returns 2+ matches
- [ ] `grep -n 'clearActiveTimers' src/lib/services/notification-service/alert-schedulers.ts` returns 2+ matches (definition + call site)
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The `initializeNotificationSchedulers` function doesn't exist at the expected location. Search for it.
- There are already timer-storage declarations in the file (import conflict).

## Maintenance notes

- If new alert types are added to `alert-schedulers.ts`, they must use the same `activeTimers` pattern.
- The `study-scheduler.ts` pattern (single `currentTimer`) and the `alert-schedulers.ts` pattern (multiple timers in a Set) are intentionally different — study-scheduler schedules exactly one timer, alert-schedulers schedules per-item timers. Plan 159 proposes consolidating these into a single architecture.
