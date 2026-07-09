# Plan 002: Fix 3 unauthenticated API endpoints to require auth

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `advisor-plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat be3a4dfb..HEAD -- src/app/api/study-sessions/route.ts src/app/api/engine/re-engagement/route.ts src/app/api/engine/budget/route.ts src/app/api/exam-dates/ingest/route.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `be3a4dfb`, 2026-07-09

## Why this matters

Three API endpoints allow unauthenticated or user-spoofable requests that should require authentication:

1. **`POST /api/study-sessions`** — writes arbitrary session data to Appwrite with `auth: "optional"` and stores `"anonymous"` as userId. Anyone can pollute analytics and exhaust write quotas.
2. **`POST /api/engine/re-engagement`** — accepts `body.userId` to override the target user, with `auth: "optional"`. An attacker can spam re-engagement notifications to any user.
3. **`POST /api/exam-dates/ingest`** — accepts PDF uploads with `auth: "optional"`. Unauthenticated users can upload arbitrary PDFs for AI parsing (prompt injection vector) and fill Dexie/Appwrite with synthetic records.

**Not in scope for this plan**: The budget GET endpoint is informational and its trust model is a separate concern. It uses `x-forwarded-for` for identity — that's a different fix.

## Current state

### `src/app/api/study-sessions/route.ts`

```typescript
export const POST = createRouteHandler({
  auth: "optional",
  // ...
  execute: async ({ userId, body }) => {
    const safeUserId = userId || "anonymous"; // line ~27
    // ... writes to Appwrite with safeUserId
  },
});
```

### `src/app/api/engine/re-engagement/route.ts`

```typescript
export const POST = createRouteHandler({
  auth: "optional", // line 9
  errorLabel: "ReEngagement",
  execute: async ({ userId, body }) => {
    const targetUserId = (body as { userId?: string }).userId ?? userId; // line 12
    // ... calls service.checkAndNotify(targetUserId)
  },
});
```

### `src/app/api/exam-dates/ingest/route.ts`

```typescript
export const POST = createRouteHandler({
  auth: "optional", // line 15
  // ... accepts multipart/form-data with PDF files or JSON with base64 PDF
});
```

**Repo conventions to match:**

- `createRouteHandler` config uses `auth: "required"` for authenticated endpoints
- `auth: "admin"` for admin-only endpoints
- The `HttpError` class is used for 400/403/404 responses
- `getAuthenticatedUserId` is used internally by `createRouteHandler` when `auth` is `"required"` or `"admin"`
- Error responses follow the pattern in existing routes: throw `HttpError(400, "message")`

## Commands you will need

| Purpose   | Command                   | Expected on success |
| --------- | ------------------------- | ------------------- |
| Typecheck | `pnpm typecheck`          | exit 0              |
| Tests     | `pnpm run test`           | all pass            |
| Lint      | `pnpm exec oxlint`        | exit 0              |
| Format    | `pnpm exec oxfmt --check` | exit 0              |

## Scope

**In scope:**

- `src/app/api/study-sessions/route.ts`
- `src/app/api/engine/re-engagement/route.ts`
- `src/app/api/exam-dates/ingest/route.ts`

**Out of scope:**

- `src/app/api/engine/budget/route.ts` — separate concern (IP-based identity)
- Any other route files
- The `createRouteHandler` factory itself

## Git workflow

- Branch: `advisor/002-auth-endpoints-fix`
- Commit per route; message style: conventional commits matching repo

## Steps

### Step 1: Fix study-sessions endpoint

Change `auth: "optional"` to `auth: "required"`. Verify that `userId` is never null in the execute body (with `auth: "required"`, `createRouteHandler` guarantees it's non-null for authenticated calls). Remove the `|| "anonymous"` fallback.

**Before:**

```typescript
auth: "optional",
```

And in the execute body:

```typescript
const safeUserId = userId || "anonymous";
```

**After:**

```typescript
auth: "required",
```

Remove the `|| "anonymous"` fallback — use `userId` directly (it's guaranteed non-null by the auth guard).

**Verify**: `pnpm typecheck` → exit 0

### Step 2: Fix re-engagement endpoint

Change `auth: "optional"` to `auth: "required"`. Remove the `body.userId` override path entirely. The `userId` from auth should always be used.

**Before:**

```typescript
auth: "optional",
// ... later in execute:
const targetUserId = (body as { userId?: string }).userId ?? userId;
```

**After:**

```typescript
auth: "required",
// ... in execute: use userId directly — remove the body.userId line
const targetUserId = userId; // guaranteed non-null by auth: "required"
```

Optionally remove the unused `body` destructure if `body` is no longer used in the function.

**Verify**: `pnpm typecheck` → exit 0

### Step 3: Fix exam-dates ingest endpoint

Change `auth: "optional"` to `auth: "required"`. The rest of the endpoint logic (PDF parsing, storage) stays the same.

**Before:**

```typescript
auth: "optional",
```

**After:**

```typescript
auth: "required",
```

Optionally add a rate-limit: `withRateLimit(handler, { max: 5, windowMs: 60000 })` — 5 uploads per minute to prevent abuse. Check if the route already uses `withRateLimit`; if not, wrap the handler.

**Verify**: `pnpm typecheck` → exit 0

### Step 4: Run full verification

**Verify**:

- `pnpm typecheck` → exit 0
- `pnpm exec oxlint` → exit 0
- `pnpm run test` → all 1500+ tests pass (no regressions)

## Test plan

No new tests needed for these changes — the routes are thin wrappers. The existing `createRouteHandler` tests cover the `auth:` behavior ("required" returns 401 without session). Verify with `pnpm run test`.

## Done criteria

- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm run test` — all tests pass
- [ ] `pnpm exec oxlint` — exit 0 on changed files
- [ ] `git diff` shows only the 3 route files changed
- [ ] Each route has `auth:` set to `"required"` instead of `"optional"`
- [ ] Re-engagement no longer accepts `body.userId`
- [ ] `advisor-plans/README.md` status row updated

## STOP conditions

Stop and report if:

- Any route has logic that depends on `userId` being possibly-undefined after changing auth (e.g., TypeScript errors)
- Tests for these specific routes exist and fail (unlikely — no existing route-level tests were found)
- The app's offline/guest mode relies on these endpoints being unauthenticated (check for callers that are used before auth is established — `useQuestionEngine` for pre-login quiz generation, etc.)

## Maintenance notes

- If a future route needs admin gating, use `auth: "admin"` — already supported by `createRouteHandler`.
- The `exam-dates/ingest` rate limit (5/min) may need adjustment if legitimate users batch-upload timetables. Monitor Sentry for 429s.
