# Plan 046: Fix anonymous budget identification for AI operations

> **Executor instructions**: Follow this plan step by step. Run every
> verification command. Drift check first: `git diff --stat 7525d6ed..HEAD -- src/lib/ai/with-budget.ts src/lib/ai/daily-call-tracker.ts`

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED (changing budget keys may affect existing daily quotas — additive keys are safe)
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `7525d6ed`, 2026-06-23

## Why this matters

Anonymous AI budget tracking uses IP-based identification (`x-forwarded-for` header). In local dev or proxy configurations where this header is absent, ALL anonymous calls share the `"anonymous"` key — a single user can exhaust the daily generation budget for everyone. Additionally, IP-based budgets can be bypassed by rotating proxies, making per-user budgets effectively per-IP.

## Current state

`src/lib/ai/with-budget.ts:18-22`:

```typescript
const userId =
  sessionUserId ||
  forwardedFor?.split(",")[0]?.trim() ||
  req.headers.get("x-real-ip")?.trim() ||
  "anonymous";
```

The budget is a simple daily counter stored per user-ID key. For anonymous users, the ID is derived from the first `x-forwarded-for` value.

## Commands you will need

| Purpose   | Command              | Expected on success |
| --------- | -------------------- | ------------------- |
| Typecheck | `pnpm run typecheck` | exit 0              |
| Tests     | `pnpm run test`      | all pass            |
| Lint      | `pnpm run lint`      | exit 0              |

## Scope

**In scope**:

- `src/lib/ai/with-budget.ts`

**Out of scope**:

- `src/lib/ai/daily-call-tracker.ts` — its API doesn't change
- `src/lib/ai/client.ts` — the caller
- Rate-limiter or auth middleware

## Steps

### Step 1: Add user-agent to anonymous key

Combine the IP with a hashed user-agent to make budget keys harder to share:

```typescript
function hashFingerprint(parts: string[]): string {
  let hash = 5381;
  const str = parts.join("|");
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) + hash + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

// In checkBudget:
const ip = forwardedFor?.split(",")[0]?.trim() || req.headers.get("x-real-ip")?.trim() || "unknown";
const ua = req.headers.get("user-agent") || "unknown";
const hashedId = hashFingerprint([ip, ua]);

const userId = sessionUserId || `anon_${hashedId}`;
```

**Verify**: `pnpm run typecheck` → exit 0.

### Step 2: Update test expectations

Search for tests of `checkBudget` or `withBudget`:

```bash
pnpm exec grep -rn "checkBudget\|with-budget\|withBudget" src/ --include="*.test.*"
```

Update any that assert `userId` is "anonymous" or a bare IP. They should now expect `anon_<hash>`.

**Verify**: `pnpm run test` → all pass.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] Anonymous budget keys are `anon_<hash>` combining IP + user-agent fingerprint
- [ ] The `"anonymous"` literal fallback is no longer reachable (replaced with `anon_<hash>`)
- [ ] `plans/README.md` status row updated

## Maintenance notes

- The fingerprint hash is not cryptographic — it's just to make key collisions harder than bare IPs. If stronger anonymity guarantees are needed, use server-side session tokens instead.
- If the user-agent changes mid-session (unusual but possible), the user gets a new budget allowance. This is acceptable for a free-tier guard.
