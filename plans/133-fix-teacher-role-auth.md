# Plan 133: Fix teacher endpoint role authorization

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 6c00cdcd..HEAD -- src/app/api/teacher/ src/lib/server/ src/lib/api/create-route-handler.ts`

## Status

- **Priority**: P0
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `6c00cdcd`, 2026-07-08

## Why this matters

All teacher routes (`teacher/link`, `teacher/roster/import`, `teacher/share-assignment`, etc.) use `auth: "required"` but never verify the caller holds a teacher role. Any authenticated student can:

- Link to arbitrary students and view their reports
- Import CSV rosters enumerating Appwrite users by email
- Create shared assignments and classroom codes

The roster import additionally creates `new Users(serverClient)` which uses `APPWRITE_API_KEY` with full admin privileges — exposed to any authenticated user.

## Current state

Currently:

- `src/app/api/teacher/link/route.ts:5` — `auth: "required"` only, no role check before `linkStudentToTeacher()`
- `src/app/api/teacher/roster/import/route.ts:110` — `new Users(serverClient)` with admin API key, gated only by `auth: "required"`
- `src/app/api/teacher/share-assignment/route.ts:5` — `auth: "none"` (unauthenticated writes)
- No `isTeacher()` helper exists in `src/lib/server/auth.ts`
- `ADMIN_USER_IDS` pattern exists at `src/lib/server/auth.ts:132` (env-var-based) — replicate for teachers

## Commands you will need

| Purpose   | Command              | Expected on success |
| --------- | -------------------- | ------------------- |
| Typecheck | `pnpm run typecheck` | exit 0, no errors   |
| Tests     | `pnpm run test`      | all pass            |
| Lint      | `pnpm exec oxlint`   | 0 warnings          |

## Steps

### Step 1: Create `isTeacher()` guard in `src/lib/server/auth.ts`

Add a `TEACHER_USER_IDS` env-var-based check (matching the `ADMIN_USER_IDS` pattern):

```ts
const TEACHER_IDS = new Set(
  (process.env.TEACHER_USER_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
);

export function isTeacher(userId: string): boolean {
  if (!userId) return false;
  return TEACHER_IDS.has(userId);
}
```

### Step 2: Fix `teacher/share-assignment/route.ts`

Change `auth: "none"` to `auth: "required"`. Pass `userId` to `shareAssignment()` call. Right now the handler receives `body` but not `userId` — add extracting it from the handler context.

**Verify**: `pnpm run typecheck` → 0 errors

### Step 3: Fix `teacher/link/route.ts`

Add an `isTeacher()` guard inside `execute()` before calling `linkStudentToTeacher()`. Throw `HttpError(403, "Teacher access required")` if not a teacher.

### Step 4: Fix `teacher/roster/import/route.ts`

Add `isTeacher()` guard at the top of `execute()`. Also: the `serverClient` admin API exposure is a separate concern — for this plan, add the role guard. The admin key issue should be fixed by scoping the API key or using a restricted client.

### Step 5: Audit remaining teacher routes

Check all routes under `src/app/api/teacher/` — add `isTeacher()` guard to each. Routes include: link, roster, share-assignment, assignments, observations, reports, ghost-links, classroom join-codes.

**Verify**: `pnpm run test` → all pass

### Step 6: Add `.env.example` entry

Add `TEACHER_USER_IDS` to `.env.example` with a comment.

## Test plan

Update existing test files for affected routes to mock `isTeacher()` returning `true`, and add a test case where it returns `false` → expects 403.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] `pnpm exec oxlint` has 0 warnings
- [ ] All teacher routes return 403 when caller is not in `TEACHER_USER_IDS`
- [ ] `teacher/share-assignment` now requires auth
- [ ] No files outside the in-scope list are modified

## STOP conditions

Stop and report if:

- The `ADMIN_USER_IDS` pattern has been removed or changed from the described approach
- A teacher route uses a non-standard handler pattern that prevents adding the guard cleanly
- Tests fail in unexpected ways beyond mock setup

## Maintenance notes

- When adding new teacher routes, add the `isTeacher()` guard
- The env-var approach is temporary — when teacher self-registration is implemented, this should be migrated to an Appwrite collection check
