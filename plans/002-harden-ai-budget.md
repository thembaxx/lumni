# Plan 002: Harden AI budget against IP spoofing

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 8a6fadbe..HEAD -- src/lib/ai/with-budget.ts src/lib/ai/daily-call-tracker.ts src/app/api/engine/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `8a6fadbe`, 2026-06-21
- **Issue**: (omit)

## Why this matters

The AI budget tracker derives anonymous user identity from `x-forwarded-for` or `x-real-ip` headers. An attacker can rotate these headers on each request to bypass per-user daily limits (20 generate / 50 visual / 20 hint). Combined with `count: 10000` on `/api/engine/generate`, this burns Gemini/Nvidia/Groq API credits at scale. For authenticated users, the real userId is available but not used — the IP-derived identity is used instead.

## Current state

**`src/lib/ai/with-budget.ts:12-15`**:
```typescript
const userId =
  req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
  req.headers.get("x-real-ip")?.trim() ||
  "anonymous";
```

This value is used as the budget key for `dailyCallTracker.check(type, userId)`.

**`src/app/api/engine/generate/route.ts:8-9`**:
```typescript
auth: "none",
budget: "generate",
```

The route is `auth: "none"` but has `budget: "generate"`. The `createRouteHandler` factory calls `checkBudget(req, type)` which uses the IP-derived userId.

**`src/lib/ai/daily-call-tracker.ts`**: Uses `userId` as the Dexie cache key for daily limits.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Typecheck | `npx tsc --noEmit`       | exit 0, no errors   |
| Lint      | `npx biome check src/lib/ai/` | 0 errors       |
| Tests     | `bun run test`           | 1326+ pass, 0 fail  |

## Scope

**In scope**:
- `src/lib/ai/with-budget.ts`
- `src/lib/ai/daily-call-tracker.ts` (if interface changes needed)

**Out of scope**:
- `src/app/api/engine/generate/route.ts` — do not change `auth: "none"` (anonymous users must be able to generate)
- `src/lib/api/create-route-handler.ts` — do not modify the factory
- Any Appwrite collection changes

## Git workflow

- Branch: `advisor/002-harden-ai-budget`
- Commit: `fix: use authenticated userId for AI budget tracking`

## Steps

### Step 1: Pass userId from session into checkBudget

The `checkBudget` function currently ignores any authenticated userId. Change it to accept an optional `sessionUserId` parameter:

In `src/lib/ai/with-budget.ts`:

```typescript
export async function checkBudget(
  req: NextRequest,
  type: AICallType,
  sessionUserId?: string | null,
): Promise<{
  allowed: boolean;
  response?: NextResponse;
  userId: string;
}> {
  const userId =
    sessionUserId ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    "anonymous";
  // ... rest unchanged
}
```

The key change: `sessionUserId` is checked first. When a user is authenticated, the real userId from the session cookie is passed here instead of the spoofable IP.

### Step 2: Thread sessionUserId through createRouteHandler

Read `src/lib/api/create-route-handler.ts` to find where `checkBudget` is called. The `createRouteHandler` factory already has access to `userId` from the auth check (when `auth: "required"` or `auth: "optional"`). Thread that userId into `checkBudget(req, type, userId)`.

If the budget check is done inside the factory's wrapper, the change is in `create-route-handler.ts`. If it's done in the route's `execute` function, thread it there.

**Verify**: `npx tsc --noEmit` → 0 errors (the signature change must be backward-compatible — `sessionUserId` is optional, so existing callers still work)

### Step 3: Strip X-Forwarded-For spoofing for anonymous users

For anonymous users (no session), the IP-based fallback is still spoofable. The fix: only trust the leftmost IP from the load balancer, not arbitrary client-provided values. On Vercel, the `x-forwarded-for` header is set by the platform and the leftmost IP is the true client IP. The current code already does `.split(",")[0]` which is correct.

However, add a safety check: if `x-forwarded-for` contains multiple comma-separated values, the client may have injected extras. Log a warning when this happens:

```typescript
const forwardedFor = req.headers.get("x-forwarded-for");
if (forwardedFor && forwardedFor.includes(",")) {
  console.warn("[Budget] Multiple X-Forwarded-For values detected:", forwardedFor);
}
```

This is a monitoring improvement, not a fix — the `.split(",")[0]` is already correct.

**Verify**: `npx biome check src/lib/ai/with-budget.ts` → 0 errors

### Step 4: Run full verification

```bash
npx tsc --noEmit
npx biome check src/lib/ai/
bun run test
```

## Test plan

- Add tests in `src/lib/ai/__tests__/with-budget.test.ts`:
  - `checkBudget(req, "generate", "real-user-id")` → userId is `"real-user-id"`
  - `checkBudget(req, "generate")` with `x-forwarded-for: "1.2.3.4"` → userId is `"1.2.3.4"`
  - `checkBudget(req, "generate")` with no IP headers → userId is `"anonymous"`

## Done criteria

- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx biome check src/lib/ai/` exits 0
- [ ] `bun run test` exits 0; new tests for userId override exist and pass
- [ ] `grep -n "sessionUserId" src/lib/ai/with-budget.ts` returns a match
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

- The `create-route-handler.ts` factory doesn't call `checkBudget` directly (it may be called elsewhere).
- The `checkBudget` function signature change breaks existing callers.

## Maintenance notes

- If the app moves to a non-Vercel hosting platform, the `x-forwarded-for` handling may need adjustment.
- Future: consider a global anonymous budget (e.g., 50 generates/day per IP) in addition to per-user budgets.
