# Plan 040: Fix rate-limit middleware fail-closed on store error

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 7525d6ed..HEAD -- src/lib/shared/with-rate-limit.ts`
> If any in-scope file changed, compare before proceeding; on a mismatch, STOP.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW (fail-open is safe for rate limiting — store is secondary defense)
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `7525d6ed`, 2026-06-23

## Why this matters

When the rate-limit store throws (Redis timeout, connection error), the catch block sets `allowed: false`, rejecting ALL subsequent requests until the window expires. A brief Redis connectivity blip takes down all rate-limited API routes (engine generate/grade/hint, solve, etc.) for up to 60 seconds.

## Current state

`src/lib/shared/with-rate-limit.ts:19-28`:

```typescript
try {
  rateLimit = await checkRateLimit(ip, apiConfig);
} catch (e) {
  logError("RateLimit", e);
  rateLimit = {
    allowed: false, // <-- fail-closed: store error = reject everything
    remaining: 0,
    resetAt: Date.now() + apiConfig.windowMs,
  };
}
```

The repo uses conventional commits. Convention example: `fix: add missing DiagramColors type import in chart.tsx`.

## Commands you will need

| Purpose   | Command              | Expected on success |
| --------- | -------------------- | ------------------- |
| Typecheck | `pnpm run typecheck` | exit 0              |
| Tests     | `pnpm run test`      | all pass            |
| Lint      | `pnpm run lint`      | exit 0              |

## Scope

**In scope**:

- `src/lib/shared/with-rate-limit.ts` — the catch block

**Out of scope**:

- `src/lib/shared/rate-limit.ts` — the `checkRateLimit` function itself
- `src/lib/rate-limiter/` — store implementations
- Any route handler or config

## Steps

### Step 1: Change catch to fail-open

Replace the catch block so a store error allows the request through (rate limit is a secondary defense, not an auth gate):

```typescript
} catch (e) {
  logError("RateLimit", e);
  rateLimit = {
    allowed: true,         // <-- fail-open: store error = allow request
    remaining: 1,
    resetAt: Date.now() + apiConfig.windowMs,
  };
}
```

**Verify**: `pnpm run typecheck` → exit 0.

### Step 2: Update tests

Search for existing tests of `withRateLimit`:

```
pnpm exec grep -rn "withRateLimit\|with-rate-limit" src/ --include="*.test.*"
```

If tests assert `allowed: false` on error, update them to expect `allowed: true`.

**Verify**: `pnpm run test` → all pass, including rate-limit tests.

## Test plan

- No new tests needed if existing tests pass after the one-line change.
- If tests were found in Step 2, update their expected values: the store-error path should produce `allowed: true`, not `false`.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] The catch block in `with-rate-limit.ts` sets `allowed: true` on store error
- [ ] `plans/README.md` status row updated

## STOP conditions

- The code at `with-rate-limit.ts:19-28` doesn't match the excerpts
- A test explicitly verifies the old `allowed: false` behavior and the fix breaks it (update the test, don't revert)

## Maintenance notes

- This is a one-line change. The rationale is documented above if someone later questions why rate limits are bypassed during store errors.
