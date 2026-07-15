# Plan 163: Fix Sync Double Online Listener Leak

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 409ce60c..HEAD -- src/lib/sync/service.ts`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: MED
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `409ce60c`, 2026-07-15
- **Issue**: (none)

## Why this matters

`sync/service.ts:start()` registers two `window.addEventListener("online", ...)` listeners, but `stop()` only removes one. Each auth cycle (logout → login) leaks 2 event listeners. Over a few sessions, accumulated listeners trigger multiple redundant sync cycles that race on shared mutable state (`pushOutbox` → `pullRemote` → `state`), corrupting the outbox queue.

## Current state

In `src/lib/sync/service.ts`, the `start()` method registers two online listeners:

```typescript
// Line ~209 — first listener (cleanupOnline that IS removed by stop())
const cleanupOnline = () => {
  if (navigator.onLine) scheduleSync();
};
window.addEventListener("online", cleanupOnline);

// Line ~219 — second listener (handleOnline that is NOT removed by stop())
const handleOnline = () => {
  if (navigator.onLine) scheduleSync();
};
window.addEventListener("online", handleOnline);
```

And `stop()` at ~line 241:

```typescript
window.removeEventListener("online", cleanupOnline); // only removes first listener
```

The return value of `start()` (a cleanup function) is discarded by `sync-provider.tsx`, so even the returned cleanup never runs.

The repo convention for event listener cleanup: use `useEffect` returns or store cleanup in a class field. Match the existing pattern in `sync/service.ts`.

## Commands you will need

| Purpose   | Command                                | Expected on success |
| --------- | -------------------------------------- | ------------------- |
| Install   | `pnpm install`                         | exit 0              |
| Typecheck | `pnpm run typecheck`                   | exit 0, no errors   |
| Tests     | `pnpm run test -- --run src/lib/sync/` | all pass            |
| Lint      | `pnpm exec oxlint --fix`               | exit 0              |

## Scope

**In scope**:

- `src/lib/sync/service.ts`

**Out of scope**:

- `src/lib/sync/sync-provider.tsx` — its discarded return value is a separate issue
- Any other sync module

## Steps

### Step 1: Remove the duplicate online listener

In `src/lib/sync/service.ts`, find the `start()` method. Remove the second `window.addEventListener("online", handleOnline)` and its surrounding `const handleOnline = ...` declaration. Only `cleanupOnline` should remain. Ensure `stop()` removes `cleanupOnline`.

The `cleanup` function returned by `start()` (line ~229) should remain as-is (it calls `stop()` which now correctly removes the only listener).

**Verify**: `rg "addEventListener.*online" src/lib/sync/service.ts` → exactly 1 match

### Step 2: Run all verification gates

**Verify**: `pnpm run typecheck` → exit 0, no errors
**Verify**: `pnpm run test -- --run src/lib/sync/` → all pass
**Verify**: `pnpm exec oxlint --fix` → exit 0

## Test plan

No new tests needed. The existing sync service tests should continue passing after this change (the bug was a runtime listener leak, not a logic error).

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test -- --run src/lib/sync/` exits 0
- [ ] Only 1 `addEventListener("online"` call exists in `src/lib/sync/service.ts`
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" doesn't match the excerpts (codebase has drifted)
- A step's verification fails twice after a reasonable fix attempt
- The fix requires touching an out-of-scope file

## Maintenance notes

If the sync interval or online handler logic changes, ensure listener registration stays singular. Reviewers should verify no other `addEventListener("online"` calls exist in the same file.
