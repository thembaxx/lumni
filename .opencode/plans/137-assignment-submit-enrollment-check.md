# Plan 137: Add enrollment check to assignment submit route

> **Executor instructions**: Follow this plan step by step.
> **Drift check**: `git diff --stat 649afc3b..HEAD -- src/app/api/assignments/`

## Status

- **Priority**: P0 | **Effort**: M | **Risk**: MED | **Depends on**: none | **Category**: security
- **Planned at**: commit `649afc3b`, 2026-07-07

## Why this matters

The assignment submit endpoint `auth: "required"` but never verifies the student is enrolled. Any authenticated user can submit scores to any assignment ID, corrupting gradebooks. Messages and grades routes have the same gap.

## Current state

`src/app/api/assignments/[id]/submit/route.ts:6`:

```typescript
auth: "required",
// ...creates/updates ASSIGNMENT_SUBMISSIONS without checking enrollment
```

`src/app/api/teacher/assignments/[id]/grades/route.ts` — checks teacher owns the assignment but not student enrollment.
`src/app/api/teacher/assignments/[id]/messages/route.ts` — authenticates but no participation check.

## Steps

### Step 1: Investigate assignment schema

Read a representative `ASSIGNMENTS` document to understand which field identifies the student owner or class. Check `src/lib/db/client.ts` for `COLLECTIONS.ASSIGNMENTS` and its query patterns. If the assignment has a `studentId` field, use that. If it uses a class-based model, check the class roster.

### Step 2: Add enrollment check to submit route

In `src/app/api/assignments/[id]/submit/route.ts`, add before the create/update logic:

```typescript
const assignment = await getDocument(COLLECTIONS.ASSIGNMENTS, assignmentId);
if (!assignment) throw new HttpError(404, "Assignment not found");
// Check based on schema: either assignment.studentId !== userId or class membership
if (assignment.studentId !== userId) throw new HttpError(403, "Not enrolled");
```

Use the `HttpError` class already imported from `@/lib/api/create-route-handler`.

### Step 3: Apply same pattern to grades and messages routes

In `src/app/api/teacher/assignments/[id]/grades/route.ts` and `src/app/api/teacher/assignments/[id]/messages/route.ts`, add the same enrollment check. For `grades` (read-only), either the teacher (ownership) OR an enrolled student should pass. For `messages`, POST should require enrollment, GET can be open to teacher or enrolled students.

### Step 4: Verify

`pnpm typecheck` → exit 0. `pnpm test` → all pass. `pnpm exec oxlint` → exit 0.

## Done criteria

- [ ] Assignment submit returns 403 for unenrolled users
- [ ] Assignment grades/messages return 403 for users who are neither teacher nor enrolled student
- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm test` exits 0

## STOP conditions

Stop and report if the assignments data model doesn't have a clear `studentId` or enrollment mechanism — don't guess the schema.
