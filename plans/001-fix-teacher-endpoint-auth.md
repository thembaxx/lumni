# Plan 001: Fix privilege escalation and add auth to teacher endpoints

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 8a6fadbe..HEAD -- src/app/api/user/role/ src/app/api/teacher/ghost-link/ src/app/api/teacher/students/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: MED
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `8a6fadbe`, 2026-06-21
- **Issue**: (omit)

## Why this matters

Three auth flaws let any authenticated user escalate to teacher privileges, create unlimited ghost links, or read any student's academic data. The self-role-assignment endpoint (`POST /api/user/role`) accepts `{role:"teacher"}` from any logged-in user, granting teacher labels without verification. The ghost link endpoints (`POST` + `DELETE /api/teacher/ghost-link`) are completely unauthenticated — anyone can create or delete them. The student report endpoint has no ownership check — any user can read any student's data by guessing the `studentId`.

Together these form a privilege escalation chain: anonymous → self-assign teacher → access student reports, create ghost links, and manage assignments.

## Current state

**File 1: `src/app/api/user/role/route.ts`**

- Line 7-30: `POST` handler with `auth: "required"`, validates role is in `VALID_ROLES`, then calls `usersApi.updateLabels()` to append the role to the user's labels.
- No check that the user is authorized for the requested role (no invitation token, no admin approval, no linked teacher-student record).

**File 2: `src/app/api/teacher/ghost-link/route.ts`**

- Line 7-8: `POST` with `auth: "none"` — creates a ghost link with `teacherId: "ghost"`, no rate limiting.
- Line 37-38: `DELETE` with `auth: "none"` — deletes any ghost link by token, no ownership check.

**File 3: `src/app/api/teacher/students/[studentId]/report/route.ts`**

- Uses `auth: "required"` but queries Appwrite with the `studentId` from URL params without verifying the caller is linked to that student.

**Repo convention for auth**: Use `createRouteHandler` with `auth: "required"` for authenticated endpoints. For teacher-specific routes, the pattern is to check a teacher-students or parent-students relationship before returning data. See `src/lib/api/create-route-handler.ts` for the factory.

## Commands you will need

| Purpose   | Command                                                                                                | Expected on success |
| --------- | ------------------------------------------------------------------------------------------------------ | ------------------- |
| Typecheck | `npx tsc --noEmit`                                                                                     | exit 0, no errors   |
| Lint      | `npx biome check src/app/api/user/role/ src/app/api/teacher/ghost-link/ src/app/api/teacher/students/` | 0 errors            |
| Tests     | `bun run test`                                                                                         | 1326+ pass, 0 fail  |

## Scope

**In scope** (the only files you should modify):

- `src/app/api/user/role/route.ts`
- `src/app/api/teacher/ghost-link/route.ts`
- `src/app/api/teacher/students/[studentId]/report/route.ts`

**Out of scope** (do NOT touch, even though they look related):

- `src/lib/api/create-route-handler.ts` — do not modify the factory
- `src/lib/auth/` — do not change auth context
- Any Appwrite collection schema changes — the `TEACHER_STUDENTS` collection already exists

## Git workflow

- Branch: `advisor/001-fix-teacher-auth`
- Commit per step or per logical unit
- Message style: `fix: <description>` (match repo convention from `git log`)

## Steps

### Step 1: Remove self-service role assignment

Replace the role route with one that only allows setting `"student"` (the default). Teacher and parent roles must be set by admin or invitation only.

In `src/app/api/user/role/route.ts`:

```typescript
export const POST = createRouteHandler({
  auth: "required",
  errorLabel: "UserRole",
  validate: (body) => {
    if (!body.role || !VALID_ROLES.includes(body.role as (typeof VALID_ROLES)[number])) {
      return "Invalid role";
    }
    if (body.role !== "student") {
      return "Only student role can be set by users. Teacher/parent roles require admin setup.";
    }
    return null;
  },
  execute: async ({ userId, body }) => {
    const { role } = body as { role: string };
    const usersApi = new Users(serverClient);
    const user = await usersApi.get(userId as string);
    const existingLabels = user.labels.filter(
      (l) => !VALID_ROLES.includes(l as (typeof VALID_ROLES)[number]),
    );
    const updated = await usersApi.updateLabels(userId as string, [...existingLabels, role]);
    return { labels: updated.labels };
  },
});
```

**Verify**: `npx biome check src/app/api/user/role/route.ts` → 0 errors

### Step 2: Add auth to ghost link creation

Change `auth: "none"` to `auth: "required"` on the POST handler. The `teacherId` field should be set from the authenticated `userId` instead of hardcoded `"ghost"`.

In `src/app/api/teacher/ghost-link/route.ts`, change the POST handler:

```typescript
export const POST = createRouteHandler({
  auth: "required",
  execute: async ({ userId }) => {
    const token = crypto.randomUUID();
    const link = {
      token,
      teacherId: userId, // was: "ghost"
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      revoked: false,
    };
    // ... rest unchanged
  },
  errorLabel: "GhostLink",
});
```

**Verify**: `npx biome check src/app/api/teacher/ghost-link/route.ts` → 0 errors

### Step 3: Add auth + ownership check to ghost link deletion

Change `auth: "none"` to `auth: "required"` on DELETE, and verify the caller owns the link before deleting:

```typescript
export const DELETE = createRouteHandler({
  auth: "required",
  execute: async ({ body, userId }: { body: { token?: string }; userId: string }) => {
    if (body.token) {
      try {
        const docs = await databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.GHOST_LINKS, [
          Query.equal("token", body.token),
        ]);
        if (docs.documents.length > 0) {
          const link = docs.documents[0];
          if (link.teacherId !== userId) {
            return { success: false, error: "Not authorized" };
          }
          await databases.deleteDocument(APPWRITE_DATABASE_ID, COLLECTIONS.GHOST_LINKS, link.$id);
        }
      } catch (e) {
        logError("GhostLinkDelete", e);
      }
    }
    return { success: true };
  },
  errorLabel: "GhostLink",
});
```

**Verify**: `npx biome check src/app/api/teacher/ghost-link/route.ts` → 0 errors

### Step 4: Add ownership check to student report endpoint

Read `src/app/api/teacher/students/[studentId]/report/route.ts`. Add a query to the `TEACHER_STUDENTS` collection (or `PARENT_STUDENTS`) to verify the authenticated `userId` is linked to the `studentId` before returning data. If no link exists, return 403.

The pattern depends on the Appwrite collection structure. Look at how `COLLECTIONS` is defined in `src/lib/db/client.ts` to find the correct collection names.

**Verify**: `npx tsc --noEmit` → 0 errors

### Step 5: Run full verification

```bash
npx tsc --noEmit
npx biome check src/app/api/user/role/ src/app/api/teacher/ghost-link/ src/app/api/teacher/students/
bun run test
```

All must pass.

## Test plan

- Add tests in `src/app/api/teacher/__tests__/ghost-link.test.ts`:
  - POST without auth → 401
  - POST with auth → creates link with `teacherId` = userId
  - DELETE without auth → 401
  - DELETE with auth but wrong ownership → link not deleted
  - DELETE with auth and correct ownership → link deleted

- Add test in `src/app/api/user/__tests__/role.test.ts`:
  - POST with `{role:"teacher"}` → rejected with error message
  - POST with `{role:"student"}` → succeeds

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx biome check src/app/api/user/role/ src/app/api/teacher/ghost-link/ src/app/api/teacher/students/` exits 0
- [ ] `bun run test` exits 0; new tests for ghost link auth and role restriction exist and pass
- [ ] `grep -n "auth: \"none\"" src/app/api/teacher/` returns no matches
- [ ] `grep -n 'role !== "student"' src/app/api/user/role/route.ts` returns a match
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" doesn't match the excerpts (the codebase has drifted since this plan was written).
- A step's verification fails twice after a reasonable fix attempt.
- The fix appears to require touching an out-of-scope file.
- You cannot find the `TEACHER_STUDENTS` or `PARENT_STUDENTS` collection name in `src/lib/db/client.ts`.

## Maintenance notes

- If teacher invitation flow is added later, the role route can be extended to accept invitation tokens.
- The `teacherId: "ghost"` value on ghost links was likely a placeholder — changing it to `userId` means existing ghost links created with "ghost" won't match any real teacher. Verify whether existing ghost links need migration.
- Review that the Appwrite `TEACHER_STUDENTS` collection has the right indexes for the ownership check query.
