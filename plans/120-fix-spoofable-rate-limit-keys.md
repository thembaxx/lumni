# Plan 120: Fix spoofable rate-limit and budget keys

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a79c0e7c..HEAD -- src/lib/shared/with-rate-limit.ts src/lib/ai/with-budget.ts`

## Status

- **Priority**: P0
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `a79c0e7c`, 2026-07-06

## Why this matters

Rate limiting and budget enforcement key on the client-supplied `X-Forwarded-For` header. An attacker setting this to arbitrary IPs gets a fresh rate-limit bucket and budget allocation per request, circumventing all daily caps.

## Current state

- `src/lib/shared/with-rate-limit.ts:13-16` — extracts IP from `x-forwarded-for` header
- `src/lib/ai/with-budget.ts:19-23` — same pattern for budget tracking
- `src/app/api/engine/budget/route.ts:9-11` — same for budget status endpoint

On Vercel, the edge sets `x-real-ip` which is NOT client-controllable. The `x-forwarded-for` header IS client-controllable.

## Commands you will need

| Purpose   | Command              | Expected on success |
| --------- | -------------------- | ------------------- |
| Typecheck | `pnpm run typecheck` | exit 0, no errors   |
| Tests     | `pnpm run test`      | all pass            |

## Steps

### Step 1: Create a shared `getClientIp` helper

Create `src/lib/shared/get-client-ip.ts`:

```ts
import { type NextRequest } from "next/server";

/**
 * Extract client IP from the rightmost untrusted position in X-Forwarded-For,
 * or fall back to x-real-ip (Vercel edge-set, not client-controllable).
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    // Take the rightmost IP (first untrusted proxy)
    const ips = forwarded.split(",").map((ip) => ip.trim());
    return ips[ips.length - 1] || "unknown";
  }
  return req.headers.get("x-real-ip") || "unknown";
}
```

**Verify**: `pnpm run typecheck` → exit 0

### Step 2: Update with-rate-limit.ts

Replace the inline IP extraction with `getClientIp(req)`.

**Verify**: `pnpm exec oxlint src/lib/shared/with-rate-limit.ts` → 0 errors

### Step 3: Update with-budget.ts

Same replacement.

**Verify**: `pnpm exec oxlint src/lib/ai/with-budget.ts` → 0 errors

### Step 4: Update budget route

Same replacement for the budget status endpoint.

**Verify**: `pnpm run typecheck` → exit 0
**Verify**: `pnpm run test` → all pass

## Test plan

- Add unit test for `getClientIp`: verify rightmost IP extraction, fallback to x-real-ip, missing header
- Model after existing tests in `src/lib/shared/__tests__/`

## Done criteria

- [ ] All three files use `getClientIp()` instead of raw header parsing
- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] `plans/README.md` status row updated

## STOP conditions

- Vercel strips `x-real-ip` in the deployment (check `next.config.ts` headers)
- The `getClientIp` helper returns different values than the old code for legitimate proxy chains
