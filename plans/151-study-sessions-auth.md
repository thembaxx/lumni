# Plan 151: Harden study-sessions route auth

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 82a850d3..HEAD -- src/app/api/study-sessions/`
> If any file changed since this plan was written, compare the "Current state"
> excerpts against the live code before proceeding; on a mismatch, treat it as
> a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `82a850d3`, 2026-07-10

## Why this matters

`POST /api/study-sessions` uses `auth: "optional"` and writes study session
data to Appwrite with `userId: userId || "anonymous"`. Anyone can insert
arbitrary study session records into the Appwrite database, polluting
analytics data. The `subject` field is the only validated field and can contain
any string value, enabling injection through downstream analytics queries.

## Current state

`src/app/api/study-sessions/route.ts`:

```typescript
// Lines 5-6
export const POST = createRouteHandler({
  auth: "optional",
  // ...
  execute: async ({ userId, body }) => {
    // Line 27
    await databases.createDocument(APPWRITE_DATABASE_ID, COLLECTIONS.STUDY_SESSIONS, "unique()", {
      userId: userId || "anonymous",
```

Study session data is low-sensitivity (subject, question counts, duration) but
the data pollution is a real operational concern for analytics accuracy.

## Scope

**In scope**:

- `src/app/api/study-sessions/route.ts` — require auth

**Out of scope**:

- Do NOT change the body validation (already checks for `subject`)
- Do NOT change the `subject` parameter type
- Do NOT change any clients that call this endpoint

## Git workflow

- Branch: `advisor/151-study-sessions-auth`
- Commit message: `fix: require auth for study-sessions route`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Change auth from optional to required

Change line 6 from:

```typescript
  auth: "optional",
```

to:

```typescript
  auth: "required",
```

### Step 2: Remove anonymous userId fallback

Change line 27 from:

```typescript
      userId: userId || "anonymous",
```

to:

```typescript
      userId,
```

Since `auth: "required"` guarantees `userId` is a non-null string, the
fallback is dead code.

**Verify**: `pnpm run typecheck` → exit 0, no errors.

## Test plan

Find all callers of this route:

```bash
git grep 'study-sessions' src/ -- '*.ts' '*.tsx'
```

Add `Authorization` header or cookie to each caller's fetch request if it
doesn't already include authentication. Then verify:

```bash
pnpm run test
```

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0, no regressions
- [ ] `pnpm exec oxlint` — zero warnings on changed files
- [ ] `grep -n 'auth: "optional"' src/app/api/study-sessions/route.ts` returns no match
- [ ] `grep -n 'anonymous' src/app/api/study-sessions/route.ts` returns no match
- [ ] No files outside the in-scope and caller-update list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- Any caller of `POST /api/study-sessions` does not send authentication
  credentials. You must update those callers to include auth, or if they are
  designed to work without auth (e.g., anonymous preview), escalate for
  design guidance.
- The route is called from a non-browser context (e.g., server-side or
  service worker) that lacks cookie-based auth. If so, add a service-specific
  API key path instead of removing anonymous support.

## Maintenance notes

- Study session data is a key input to the analytics pipeline. Keeping it
  authenticated prevents data pollution from automated scripts.
