# Plan 208: Add stale-link cleanup and school check to teacher report route

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Generated at**: 2026-07-17

## Why this matters

The teacher report endpoint at `src/app/api/teacher/students/[studentId]/report/route.ts` retrieves a student's performance data but does not verify that the student is currently enrolled at the same school as the teacher. A teacher who changes schools (or a student who transfers) could still access historical data via stale ghost links or `SCHOOL_MEMBERS` records that were never cleaned up. Without an active school membership check, teachers might see data for students who are no longer their responsibility.

Additionally, there is no mechanism to clean up stale teacher-student links when a student leaves a school, which means old records accumulate in the `SCHOOL_MEMBERS` and `TEACHER_STUDENTS` collections.

## Current state

`src/app/api/teacher/students/[studentId]/report/route.ts:17-37`:

```typescript
// Verifies teacher is authenticated
// Verifies teacher belongs to a school
// Fetches student data
// Does NOT check that the student is currently enrolled at the teacher's school
```

## Target state

- The student's current school is looked up from their profile/`SCHOOL_MEMBERS` record
- The teacher must have an active `SCHOOL_MEMBERS` record for the same school
- Stale ghost links and orphaned `TEACHER_STUDENTS` records are cleaned up via a background sync job

## Scope

- `src/app/api/teacher/students/[studentId]/report/route.ts` — add current-school check
- Potentially `src/lib/sync/sync-handlers.ts` or a new cleanup job — stale-link cleanup

**Out of scope**:

- The student report data computation
- The teacher auth mechanism

## Steps

### 1. Read the route file

Read `src/app/api/teacher/students/[studentId]/report/route.ts` to understand the current flow, auth pattern, and Appwrite queries used.

### 2. Add current-school membership check

After authenticating the teacher, look up the student's current school membership:

```typescript
const studentSchools = await databases.listDocuments(DATABASE_ID, SCHOOL_MEMBERS_COLLECTION_ID, [
  Query.equal("userId", studentId),
  Query.equal("active", true), // if the schema supports an active flag
  Query.limit(1),
]);

if (studentSchools.total === 0) {
  return NextResponse.json(
    { error: "Student is not currently enrolled in any school" },
    { status: 404 },
  );
}

const studentSchoolId = studentSchools.documents[0].schoolId;
```

Then verify the teacher belongs to the same school:

```typescript
const teacherMembership = await databases.listDocuments(DATABASE_ID, SCHOOL_MEMBERS_COLLECTION_ID, [
  Query.equal("userId", userId),
  Query.equal("schoolId", studentSchoolId),
  Query.equal("active", true),
  Query.limit(1),
]);

if (teacherMembership.total === 0) {
  return NextResponse.json(
    { error: "You do not have access to this student's data" },
    { status: 403 },
  );
}
```

If there's no `active` field in the schema, skip it and rely on the presence of the membership record alone.

### 3. Add stale-link cleanup

In the background sync handlers (`src/lib/sync/sync-handlers.ts` or the orchestrator's job processor), add a cleanup routine that:

1. Finds all `TEACHER_STUDENTS` records where either the teacher or student no longer has an active `SCHOOL_MEMBERS` record
2. Deletes those orphaned records
3. Runs weekly (via the existing scheduler) or on-demand

If a dedicated cleanup job is too heavy for this plan, instead add a cleanup step at the beginning of the report endpoint that lazily removes stale links for the requesting teacher only.

### 4. Verify

```bash
pnpm run typecheck
pnpm exec oxlint --fix
pnpm run test
```

## Stop conditions

- If the `SCHOOL_MEMBERS` collection does not have a way to determine active/inactive status — stop and report the assumption. The check can still work with a simple "record exists" query, but a stale-link cleanup cannot distinguish between "was enrolled" and "is enrolled."
- If the background sync handler architecture does not support adding new cleanup jobs — stop and report. The lazy cleanup fallback (in the route itself) is a valid simpler alternative.

## Estimated time

1–2 hours
