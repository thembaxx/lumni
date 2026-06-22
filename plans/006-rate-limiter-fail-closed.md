# Plan 006: Make rate limiter fail-closed on store error

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 8a6fadbe..HEAD -- src/lib/shared/with-rate-limit.ts src/lib/shared/rate-limit.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `8a6fadbe`, 2026-06-21
- **Issue**: (omit)

## Why this matters

The rate limiter's catch block returns `{ allowed: true, remaining: Infinity }` when the store (Redis or Map) throws. This means any store exception — Redis restart, memory pressure, transient network blip — disables rate limiting for that request. An attacker can trigger this by sending requests that cause store errors. The fix is simple: fail-closed (deny the request) instead of fail-open.

## Current state

**`src/lib/shared/with-rate-limit.ts:21-29`**:

```typescript
let rateLimit: Awaited<ReturnType<typeof checkRateLimit>>;
try {
  rateLimit = await checkRateLimit(ip, apiConfig);
} catch {
  rateLimit = {
    allowed: true, // ← fail-open
    remaining: Infinity,
    resetAt: Date.now() + apiConfig.windowMs,
  };
}
```

**Repo convention**: Rate limiting is used on auth routes (3 sign-in/5min) and AI generation endpoints. The `withRateLimit` wrapper is imported from `@/lib/shared/with-rate-limit`.

## Commands you will need

| Purpose   | Command                                             | Expected on success |
| --------- | --------------------------------------------------- | ------------------- |
| Typecheck | `npx tsc --noEmit`                                  | exit 0, no errors   |
| Lint      | `npx biome check src/lib/shared/with-rate-limit.ts` | 0 errors            |
| Tests     | `bun run test`                                      | 1326+ pass, 0 fail  |

## Scope

**In scope**:

- `src/lib/shared/with-rate-limit.ts`

**Out of scope**:

- `src/lib/rate-limiter/core.ts` — do not modify the store implementation
- `src/lib/rate-limiter/redis-store.ts` — do not modify Redis

## Git workflow

- Branch: `advisor/006-rate-limiter-fail-closed`
- Commit: `fix: rate limiter fails closed on store error`

## Steps

### Step 1: Change the catch block to deny

Replace the fail-open catch block with fail-closed:

```typescript
let rateLimit: Awaited<ReturnType<typeof checkRateLimit>>;
try {
  rateLimit = await checkRateLimit(ip, apiConfig);
} catch (e) {
  logError("RateLimit", e);
  rateLimit = {
    allowed: false, // ← fail-closed
    remaining: 0,
    resetAt: Date.now() + apiConfig.windowMs,
  };
}
```

Add `import { logError } from "@/lib/shared/logger"` at the top if not already imported.

**Verify**: `npx biome check src/lib/shared/with-rate-limit.ts` → 0 errors

### Step 2: Run full verification

```bash
npx tsc --noEmit
npx biome check src/lib/shared/with-rate-limit.ts
bun run test
```

## Test plan

- Add a test in `src/lib/shared/__tests__/with-rate-limit.test.ts`:
  - Mock `checkRateLimit` to throw → verify the handler returns 429
  - Mock `checkRateLimit` to return `{allowed: true}` → verify the handler passes through

## Done criteria

- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx biome check src/lib/shared/with-rate-limit.ts` exits 0
- [ ] `bun run test` exits 0
- [ ] `grep -n "allowed: true" src/lib/shared/with-rate-limit.ts` returns no matches in the catch block
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

- The `checkRateLimit` function doesn't throw (the catch block may be unreachable dead code).
- Other callers depend on the fail-open behavior.

## Maintenance notes

- During normal operation, the store should never fail. The fail-closed behavior only triggers during infrastructure incidents.
- Monitor for 429 spikes after deployment — if the store is unhealthy, legitimate users will be blocked. Consider a circuit-breaker pattern as a future improvement.
