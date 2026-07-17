# Plan 203: Verify teacher-student relationship in intervention endpoint

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: MEDIUM
- **Depends on**: none
- **Category**: security
- **Generated at**: 2026-07-17

## Why this matters

The teacher interventions endpoint at `src/app/api/teacher/interventions/route.ts` allows a teacher to create intervention records (e.g., "needs extra tutoring") for a student. It currently accepts `schoolId` from the client and only checks that the teacher belongs to the school. It does not verify that the student is actually linked to the teacher via the `TEACHER_STUDENTS` collection. A teacher could create intervention records for any student in the school, even if they have no relationship with that student, leading to data pollution and potential misuse.

## Current state

`src/app/api/teacher/interventions/route.ts:20-39`:

```typescript
const { studentId, schoolId, reason, notes } = await req.json();
// Checks teacher is in SCHOOL_MEMBERS for schoolId (client-supplied)
// Does NOT check TEACHER_STUDENTS for teacher-student link
```

## Target state

- Server derives `schoolId` from the teacher's own `SCHOOL_MEMBERS` record (not from client input)
- Server queries `TEACHER_STUDENTS` to confirm a relationship exists between `userId` (teacher) and `studentId`
- Request is rejected with 403 if no relationship exists
- `schoolId` is removed from the expected request body shape

## Scope

- `src/app/api/teacher/interventions/route.ts` — add TEACHER_STUDENTS lookup, remove client-supplied schoolId

## Steps

### 1. Read the route file

Read the full route file to understand its current auth pattern, Appwrite schema usage, and surrounding imports.

### 2. Remove `schoolId` from the request body

Remove `schoolId` from the destructured body. Derive it server-side from the teacher's `SCHOOL_MEMBERS` record. This prevents a teacher from scoping an intervention to a school they don't belong to.

### 3. Add TEACHER_STUDENTS relationship check

After authenticating the teacher and deriving `schoolId`, query the `TEACHER_STUDENTS` collection:

```typescript
const relationship = await databases.listDocuments(DATABASE_ID, TEACHER_STUDENTS_COLLECTION_ID, [
  Query.equal("userId", userId),
  Query.equal("studentId", studentId),
]);

if (relationship.total === 0) {
  return NextResponse.json({ error: "No teacher-student relationship found" }, { status: 403 });
}
```

### 4. Handle missing relationship gracefully

Return a 403 with a clear error message. Do not reveal whether the student exists — just say the relationship was not found.

### 5. Verify

```bash
pnpm run typecheck
pnpm exec oxlint --fix
pnpm run test
```

## Stop conditions

- If the `TEACHER_STUDENTS` collection does not exist in the Appwrite schema — stop and report. Check `src/lib/appwrite/constants.ts` for the collection ID.
- If interventions are supposed to work for school-wide announcements (no specific teacher-student link) — stop and report. This plan assumes interventions are per-relationship.

## Estimated time

30–45 minutes
