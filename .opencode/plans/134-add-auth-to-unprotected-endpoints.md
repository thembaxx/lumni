# Plan 134: Add auth guards to 3 unprotected AI-cost endpoints

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 649afc3b..HEAD -- src/app/api/engine/test/route.ts src/app/api/test-exam-papers/route.ts src/app/api/study-sessions/route.ts`

## Status

- **Priority**: P0
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `649afc3b`, 2026-07-07

## Why this matters

Three API routes expose AI-cost operations or internal data without authentication. `/api/engine/test` generates real AI questions draining the daily budget. `/api/test-exam-papers` lists exam paper documents with UploadThing file keys. `/api/study-sessions` allows anonymous Appwrite document creation. All should require authentication.

## Current state

**Route 1 — `/api/engine/test`** (`src/app/api/engine/test/route.ts:8`):

```typescript
auth: "none",
// ... calls LearningOrchestrator.generateQuestionSet() + engine.generateHint()
```

**Route 2 — `/api/test-exam-papers`** (`src/app/api/test-exam-papers/route.ts:5`):

```typescript
auth: "none",
// Returns exam paper metadata + file keys to any caller
```

**Route 3 — `/api/study-sessions`** (`src/app/api/study-sessions/route.ts:6`):

```typescript
auth: "optional",
execute: async ({ userId, body }) => {
  await databases.createDocument(..., {
    userId: userId || "anonymous",  // writes "anonymous" when unauthenticated
```

The repo convention: `auth: "none"` public, `auth: "optional"` works with or without user, `auth: "required"` needs user. Routes consuming AI credits or creating Appwrite docs should use `auth: "required"`.

## Commands you will need

| Purpose   | Command            | Expected on success |
| --------- | ------------------ | ------------------- |
| Typecheck | `pnpm typecheck`   | exit 0, no errors   |
| Tests     | `pnpm test`        | all pass            |
| Lint      | `pnpm exec oxlint` | exit 0              |

## Scope

**In scope**:

- `src/app/api/engine/test/route.ts`
- `src/app/api/test-exam-papers/route.ts`
- `src/app/api/study-sessions/route.ts`

**Out of scope**: Any other API routes, the `createRouteHandler` implementation.

## Steps

### Step 1: Change `engine/test` to `auth: "required"`

In `src/app/api/engine/test/route.ts:8`, change `auth: "none"` to `auth: "required"`.

### Step 2: Change `test-exam-papers` to `auth: "required"`

In `src/app/api/test-exam-papers/route.ts:5`, change `auth: "none"` to `auth: "required"`.

### Step 3: Change `study-sessions` to `auth: "required"`

In `src/app/api/study-sessions/route.ts:6`, change `auth: "optional"` to `auth: "required"`.

Remove the `"anonymous"` fallback on line 27: `userId: userId` (not `userId || "anonymous"`).

### Step 4: Run verification

**Verify**: `pnpm typecheck` → exit 0. `pnpm test` → all pass. `pnpm exec oxlint` → exit 0.

## Test plan

No new tests needed. The handlers are functionally identical for authenticated users.

## Done criteria

- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm test` exits 0
- [ ] `pnpm exec oxlint` exits 0
- [ ] `grep '"none"' src/app/api/engine/test/route.ts` returns no matches
- [ ] `grep '"none"' src/app/api/test-exam-papers/route.ts` returns no matches
- [ ] `grep '"optional"' src/app/api/study-sessions/route.ts` returns no matches
- [ ] `grep 'anonymous' src/app/api/study-sessions/route.ts` returns no matches

## STOP conditions

Stop and report back if the route handler format has changed or if any of these routes have been redirected.

## Maintenance notes

- Monitoring systems that call `/api/engine/test` will need valid authentication after this change.
- Clients relying on anonymous study session creation will break — intentional.
