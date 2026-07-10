# Plan 148: Harden re-engagement route auth

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 82a850d3..HEAD -- src/app/api/engine/re-engagement/`
> If any file changed since this plan was written, compare the "Current state"
> excerpts against the live code before proceeding; on a mismatch, treat it as
> a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `82a850d3`, 2026-07-10

## Why this matters

The `POST /api/engine/re-engagement` route uses `auth: "optional"` and accepts
a `userId` field from the request body. If not provided, it defaults to the
authenticated session user. Since the route is `"optional"`, an unauthenticated
caller can provide any `targetUserId` via body, causing push notifications to
be sent to that user. While rate-limited to 1 req/min, this is a notification
harassment vector.

## Current state

`src/app/api/engine/re-engagement/route.ts`:

```typescript
// Lines 8-12
const handler = createRouteHandler({
  auth: "optional",             // <-- should be "required"
  errorLabel: "ReEngagement",
  execute: async ({ userId, body }) => {
    const targetUserId = (body as { userId?: string }).userId ?? userId;
```

Only the `/dashboard` page should trigger re-engagement — always against the
currently authenticated user. There is no legitimate use case for a server-side
caller targeting a different userId.

## Scope

**In scope**:

- `src/app/api/engine/re-engagement/route.ts`

**Out of scope**:

- Do NOT change the `ReEngagementService` class
- Do NOT change the rate-limit config (1 req/min is fine)
- Do NOT change the response shape (clients may depend on it)

## Git workflow

- Branch: `advisor/148-re-engagement-auth`
- Commit message: `fix: harden re-engagement route auth`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Change auth to required

Change line 9 from:

```typescript
  auth: "optional",
```

to:

```typescript
  auth: "required",
```

### Step 2: Replace userId derivation

Change lines 11-12 from:

```typescript
  execute: async ({ userId, body }) => {
    const targetUserId = (body as { userId?: string }).userId ?? userId;
```

to:

```typescript
  execute: async ({ userId }) => {
    const targetUserId = userId;
```

Remove the `body` parameter from the destructuring since it's no longer used.
This also eliminates the `as` cast.

**Verify**: `pnpm run typecheck` → exit 0, no errors.

## Test plan

No new tests — the route is a thin 10-line delegate. The `createRouteHandler`
factory has its own auth guard tests.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0, no regressions
- [ ] `pnpm exec oxlint` — zero warnings on changed files
- [ ] `grep -n 'auth: "optional"' src/app/api/engine/re-engagement/route.ts` returns no match
- [ ] `grep -n '.userId ?? userId' src/app/api/engine/re-engagement/route.ts` returns no match
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- There is a legitimate use case for an authenticated admin triggering re-engagement for another user. If so, validate `userId === body.userId` instead of removing the body field.
- Any client code sends a `userId` in the body that this change would break. Check `git grep '"re-engagement"' src/` to find callers.

## Maintenance notes

- If multi-user re-engagement support is needed later, add a separate admin route with explicit role checks, not an `auth: "optional"` body override.
