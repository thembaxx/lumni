# Plan 069: Add membership checks to live session + student report endpoints

> **Executor instructions**: Follow this plan step by step. Run every verification command — do not move on until it passes. If anything in STOP conditions occurs, stop and report.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `245ba077`, 2026-06-29

## Why this matters

Two endpoints lack authorisation checks:

1. `PATCH /api/study-groups/[groupId]/live-session` — allows any authenticated user to end or modify any live session without checking if they are a member of the study group.
2. `GET /api/teacher/students/[studentId]/report` — allows any authenticated user to retrieve any student's report. The teacher→student relationship is context-dependent; the calling user might not be the student's teacher.

## Current state

`src/app/api/study-groups/[groupId]/live-session/route.ts:15-30`:

```typescript
export const PATCH = createRouteHandler({
  auth: "required",
  handler: async ({ params, body }) => {
    // No membership check — modifies session regardless of group membership
  },
});
```

`src/app/api/teacher/students/[studentId]/report/route.ts`:

```typescript
export const GET = createRouteHandler({
  auth: "required",
  handler: async ({ params }) => {
    // No teacher relationship check — returns any student's report
  },
});
```

## Scope

**In scope**:

- `src/app/api/study-groups/[groupId]/live-session/route.ts` — add membership check
- `src/app/api/teacher/students/[studentId]/report/route.ts` — add teacher check
- Any shared utility needed (e.g., `isGroupMember(userId, groupId)`)

**Out of scope**:

- Other study group endpoints (GET/POST for live sessions) — check those in the handler, but the main bug is the PATCH
- The teacher→student relationship data model — if it doesn't exist, the plan must define what to check

## Commands

| Purpose   | Command                  | Expected on success |
| --------- | ------------------------ | ------------------- |
| Typecheck | `pnpm run typecheck`     | exit 0              |
| Lint      | `pnpm exec oxlint --fix` | exit 0              |

## Steps

### Step 1: Read existing auth patterns

Read the following to understand existing auth patterns:

- `src/app/api/study-groups/[groupId]/live-session/route.ts` — full file
- `src/app/api/teacher/students/[studentId]/report/route.ts` — full file
- `src/app/api/study-groups/` — any other handler that does membership checks (grep for `isGroupMember` or `members`)
- `src/lib/study-groups/` — service layer
- `src/lib/db/` — DataAccess interface for study groups

### Step 2: Add membership check to live session PATCH

After extracting `userId` and `groupId`, call a membership check:

```typescript
// This is pseudocode — adjust for actual DataAccess interface
const isMember = await checkGroupMembership(userId, groupId);
if (!isMember) {
  return Response.json({ error: "Not a member of this group" }, { status: 403 });
}
```

Check if the DataAccess has `studyGroupMembers` table or similar. If not, use the existing `StudyGroupService` or `studyGroups` table.

### Step 3: Add teacher check to student report GET

Determine how teacher→student relationships are stored. Look for:

- `teacherStudents` table in Dexie or Appwrite
- `teacher` field on the user profile
- `assignedTeacher` on student records

If no teacher→student relationship model exists, the minimum viable fix is to check that the requesting user is a teacher (has a `role` field set to `"teacher"` or similar) rather than that they are specifically assigned to that student. This is weaker but at least prevents arbitrary student data access by non-teacher users.

### Step 4: Create shared utility (if needed)

If both checks use the same pattern, extract `isGroupMember` to a shared location (e.g., `src/lib/study-groups/auth.ts`) or the existing auth utilities.

### Step 5: Verify

**Verify**:

- `pnpm run typecheck` → exit 0
- `pnpm exec oxlint --fix` → exit 0

## Done criteria

- [ ] `PATCH` live session endpoint returns `403` when caller is not a group member
- [ ] `GET` student report endpoint returns `403` when caller is not a teacher for that student
- [ ] `pnpm run typecheck` exits 0
- [ ] No files outside in-scope list are modified

## STOP conditions

- If the DataAccess interface does not expose study group membership — stop and report; the membership check approach needs re-scoping.
- If teacher→student relationship data doesn't exist in any table — use the minimum fix (role check) and note the gap for future implementation.
- If the endpoint handler structure is significantly different from what's described — read the actual file and adapt.
