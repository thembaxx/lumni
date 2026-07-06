# Plan 109: Fix UploadThing auth — replace bearer token heuristic with real session verification

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat d3446bd7..HEAD -- src/app/api/uploadthing/`
> If any in-scope file changed, compare the "Current state" excerpts against
> the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: MEDIUM (UploadThing upload flow must still work after the change)
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `d3446bd7`, 2026-07-06

## Why this matters

`src/app/api/uploadthing/core.ts` authenticates file uploads by splitting the
`Authorization: Bearer <token>` header on `":"` and trusting the first segment
as a user ID. Any caller — no Appwrite session, no JWT, no signature — can
upload arbitrary files (images, PDFs, JSON, audio) to UploadThing's cloud
storage. An attacker can fill the storage quota, upload malicious content, or
impersonate another user's ID for file operations.

This is the highest-severity security finding from the July 2026 audit.

## Current state

- `src/app/api/uploadthing/core.ts:5-19` — `getSessionUser()` reads the
  `Authorization` header, rejects only `"demo-session"` and `"guest"` tokens,
  and returns `{ id: token.split(":")[0] || token }` for ANY other value.
  No signature verification, no JWT decode, no server-side session check.
- `src/lib/server/auth.ts` — exports `getAuthenticatedUserId(request)` which
  reads the Appwrite session cookie (`a_session_<projectId>`) via `next/headers`
  `cookies()`. This is the same auth used by all `createRouteHandler` routes.
- The repo convention for server-side auth is to use `getAuthenticatedUserId()`
  from `@/lib/server/auth` — see `src/app/api/chat/route.ts` for the pattern.

## Commands you will need

| Purpose   | Command                  | Expected on success |
| --------- | ------------------------ | ------------------- |
| Typecheck | `pnpm run typecheck`     | exit 0, no errors   |
| Tests     | `pnpm run test`          | all pass            |
| Lint      | `pnpm exec oxlint --fix` | exit 0              |

## Scope

**In scope**:

- `src/app/api/uploadthing/core.ts` — replace `getSessionUser()` with real auth

**Out of scope**:

- Any other UploadThing configuration (routes, file router, etc.)
- Any other auth endpoints
- The UploadThing SDK version or upload logic

## Steps

### Step 1: Replace `getSessionUser` with cookie-based auth

Replace `getSessionUser()` and `requireAuth()` in `core.ts` with a version
that calls `getAuthenticatedUserId()` from `@/lib/server/auth`.

Current code (lines 5-30):

```ts
async function getSessionUser(req: Request): Promise<{ id: string } | null> {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return null;
    }
    const token = authHeader.slice(7);
    if (!token || token === "demo-session" || token === "guest") {
      return null;
    }
    return { id: token.split(":")[0] || token };
  } catch {
    return null;
  }
}

async function requireAuth(req: Request): Promise<{ id: string }> {
  const user = await getSessionUser(req);
  if (!user) {
    throw new UploadThingError({ code: "FORBIDDEN", message: "Authentication required" });
  }
  return user;
}
```

Replace with:

```ts
import { getAuthenticatedUserId } from "@/lib/server/auth";

async function requireAuth(req: Request): Promise<{ id: string }> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    throw new UploadThingError({ code: "FORBIDDEN", message: "Authentication required" });
  }
  return { id: userId };
}
```

**Verify**:

- `pnpm exec oxlint --fix` → 0 warnings
- `pnpm run typecheck` → 0 errors

### Step 2: Run tests

```bash
pnpm run test
```

→ 1863+ tests pass (the existing UploadThing tests at `src/app/api/uploadthing/__tests__/` may need updating if they mock `getSessionUser`).

If tests fail because they depend on the old `getSessionUser` mock:

1. Check `src/app/api/uploadthing/__tests__/` for any test that imports from `core.ts`
2. Mock `getAuthenticatedUserId` instead using `vi.mock("@/lib/server/auth")`
3. Pattern: `vi.mocked(getAuthenticatedUserId).mockResolvedValue("test-user-id")`

## Test plan

- No new test file needed — existing UploadThing route tests should pass with
  the new auth mock.
- If no tests exist for `core.ts`, add a minimal test:
  `src/app/api/uploadthing/__tests__/core.test.ts` that verifies `requireAuth`
  returns the user ID when `getAuthenticatedUserId` resolves, and throws
  `UploadThingError` when it returns null.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm exec oxlint --fix` exits 0 with no warnings
- [ ] `pnpm run test` exits 0
- [ ] No files outside in-scope list are modified (`git diff --stat`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- `getAuthenticatedUserId` signature has changed — check and adapt
- UploadThing SDK API changed (`middleware` callback signature) — stop and report
- More than 2 test files fail — stop and investigate

## Maintenance notes

- If Appwrite auth changes (session cookie name, format), update
  `getAuthenticatedUserId` in `@/lib/server/auth.ts` — this file just consumes it
- UploadThing's `middleware` callback receives the raw `Request` object;
  `getAuthenticatedUserId` reads cookies via `next/headers`, which is the
  correct pattern for App Router route handlers
