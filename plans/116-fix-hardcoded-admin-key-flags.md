# Plan 116: Replace hardcoded admin key with proper auth in flags route

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a79c0e7c..HEAD -- src/app/api/admin/flags/route.ts`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding.

## Status

- **Priority**: P0
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `a79c0e7c`, 2026-07-06

## Why this matters

The flags admin route compares `searchParams.get("adminKey")` against the literal string `"admin"`. Anyone who guesses this query parameter can read all feature flag overrides, create/delete flags, and toggle flags for arbitrary users. This is a trivially exploitable auth bypass on an admin-only surface.

## Current state

- `src/app/api/admin/flags/route.ts:11-14` — `adminAuthorized()` function:

```ts
function adminAuthorized(req: NextRequest): boolean {
  const { searchParams } = new URL(req.url);
  return searchParams.get("adminKey") === "admin";
}
```

- Used by GET (line 17), POST (line 29), DELETE (line 56)
- The route does NOT use `createRouteHandler` — it's a hand-rolled Next.js App Router handler
- Other admin routes use `createRouteHandler({ auth: "admin" })` — see `src/app/api/admin/exams/[id]/route.ts:6` as the exemplar

## Commands you will need

| Purpose   | Command                                             | Expected on success |
| --------- | --------------------------------------------------- | ------------------- |
| Typecheck | `pnpm run typecheck`                                | exit 0, no errors   |
| Tests     | `pnpm run test`                                     | all pass            |
| Lint      | `pnpm exec oxlint src/app/api/admin/flags/route.ts` | 0 errors            |

## Steps

### Step 1: Migrate flags route to createRouteHandler

Replace the hand-rolled handler with `createRouteHandler` using `auth: "admin"`. Remove the `adminAuthorized` function entirely.

```ts
// src/app/api/admin/flags/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { type FlagOverride } from "@/lib/shared/flags/types";
import { flagRegistry } from "@/lib/shared/flags/registry";
import { createRouteHandler } from "@/lib/api/create-route-handler";

const overrides = new Map<string, FlagOverride>();

function overrideKey(key: string, userId?: string): string {
  return userId ? `${key}:user:${userId}` : key;
}

export const GET = createRouteHandler({
  auth: "admin",
  errorLabel: "FlagsGet",
  execute: async () => {
    const allOverrides = Array.from(overrides.values());
    return { flags: flagRegistry, overrides: allOverrides };
  },
});

export const POST = createRouteHandler<{ key: string; enabled: boolean; userId?: string }>({
  auth: "admin",
  errorLabel: "FlagsPost",
  parseBody: async (req) =>
    (await req.json()) as { key: string; enabled: boolean; userId?: string },
  validate: (body) => {
    if (!body.key) return "Flag key is required";
    if (typeof body.enabled !== "boolean") return "Enabled must be a boolean";
    return null;
  },
  execute: async ({ body }) => {
    const override: FlagOverride = {
      key: body.key,
      enabled: body.enabled,
      userId: body.userId,
      updatedAt: Date.now(),
    };
    overrides.set(overrideKey(body.key, body.userId), override);
    return { success: true };
  },
});

export const DELETE = createRouteHandler<{ key: string; userId?: string }>({
  auth: "admin",
  errorLabel: "FlagsDelete",
  parseBody: async (req) => (await req.json()) as { key: string; userId?: string },
  validate: (body) => (!body.key ? "Flag key is required" : null),
  execute: async ({ body }) => {
    overrides.delete(overrideKey(body.key, body.userId));
    return { success: true };
  },
});
```

**Verify**: `pnpm exec oxlint src/app/api/admin/flags/route.ts` → 0 errors

### Step 2: Typecheck and test

**Verify**: `pnpm run typecheck` → exit 0, no errors
**Verify**: `pnpm run test` → all pass

## Test plan

- Existing tests for `createRouteHandler` (`src/lib/api/__tests__/create-route-handler.test.ts`) cover the auth guard
- Add a smoke test: `src/app/api/admin/flags/__tests__/route.test.ts` — verify GET returns 401 without admin session

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm exec oxlint src/app/api/admin/flags/route.ts` exits 0
- [ ] `grep -rn "adminKey" src/` returns no matches
- [ ] `plans/README.md` status row updated

## STOP conditions

- The `createRouteHandler` signature doesn't support the flag overrides pattern
- The route changes break an existing consumer that depends on the query-param auth
