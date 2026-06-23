# Plan 049: Migrate 35+15 API routes to createRouteHandler factory

> **Executor instructions**: Follow this plan step by step. Run every
> verification command. Drift check first:
> `git diff --stat 7525d6ed..HEAD -- src/app/api/`

## Status

- **Priority**: P2
- **Effort**: L (35-50 routes, ~15 min each = ~10-12 hours)
- **Risk**: MED (each migration changes error response shape slightly — test per route)
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `7525d6ed`, 2026-06-23

## Why this matters

~35 API route files use raw Next.js `NextRequest`/`NextResponse` handlers, each with 15-25 lines of duplicated auth checking, JSON body parsing, try/catch error wrapping, and response formatting. Additionally, all 15 study-group routes follow the same raw pattern. This means ~500-800 lines of duplicated boilerplate, inconsistent error shapes across endpoints (some return `{ error }`, some `{ message }`, some `{ success: false, error }`), and missing auth checks in some routes.

## Current state

Example of raw handler (`src/app/api/exam-papers/classify/route.ts`):

```typescript
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Admin access required";
    if (msg.includes("Authentication required"))
      return NextResponse.json({ error: msg }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 403 });
  }
  let body: { subject?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  // ... actual logic
}
```

Compare with the factory pattern (`src/app/api/engine/generate/route.ts`):

```typescript
export const POST = createRouteHandler({
  auth: "none",
  errorLabel: "Generate",
  parseBody: async (req) => {
    const body: GenerationParams = await req.json();
    return body;
  },
  validate: (body) => {
    if (!body.subject) return "Subject is required";
    return null;
  },
  execute: async ({ body, userId }) => {
    /* business logic only */
  },
});
```

The `createRouteHandler` pattern is at `src/lib/api/create-route-handler.ts:48-171`.

## Commands you will need

| Purpose   | Command              | Expected on success |
| --------- | -------------------- | ------------------- |
| Typecheck | `pnpm run typecheck` | exit 0              |
| Tests     | `pnpm run test`      | all pass            |
| Lint      | `pnpm run lint`      | exit 0              |

## Scope

**In scope** (priority sub-set — all 15 study-group routes + 5 highest-risk non-factory routes):

- `src/app/api/study-groups/**/route.ts` (15 routes)
- `src/app/api/exam-papers/classify/route.ts`
- `src/app/api/user/export/route.ts`
- `src/app/api/cron/weekly-digest/route.ts`
- `src/app/api/ghost/[token]/route.ts`
- `src/app/api/auth/callback/route.ts`

**Out of scope** (deferred — less critical, same pattern):

- `src/app/api/auth/verify/route.ts`
- `src/app/api/quiz-packs/generate/route.ts`
- `src/app/api/admin/exams/*/route.ts`
- `src/app/api/student/assignments/*/route.ts`
- `src/app/api/teacher/*/route.ts`
- `src/app/api/matric-results/route.ts`
- `src/app/api/csp-violation/route.ts`
- `src/app/api/lessons/*/route.ts`
- `src/app/api/exam-sessions/*/route.ts`

## Steps

### Step 1: Study the createRouteHandler signature

Read `src/lib/api/create-route-handler.ts` fully. Understand:

- `AuthMode`: `"none" | "optional" | "required" | "admin"`
- `RouteHandlerConfig`: `{ auth, budget?, parseBody?, validate?, execute, useRateLimit?, errorLabel?, aiContext? }`
- What `execute` receives: `{ body: TBody, userId, req, params?, requestId? }`
- What it returns: wrapped in `serializeResponse()`

**Verify**: You understand the interface. No command needed.

### Step 2: Migrate study-group routes (highest count, most boilerplate)

Each study-group route at `src/app/api/study-groups/` is a raw handler ~15-40 lines. The pattern for every one is:

```typescript
// BEFORE (raw):
import { type NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/server/auth";
import { someHandler } from "@/lib/study-groups/service";

export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId();
    const body = await req.json();
    const result = await someHandler(body, userId);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
```

```typescript
// AFTER (factory):
import { createRouteHandler } from "@/lib/api/create-route-handler";
import { someHandler } from "@/lib/study-groups/service";

export const POST = createRouteHandler({
  auth: "required",
  parseBody: async (req) => req.json(),
  execute: async ({ body, userId }) => {
    return someHandler(body, userId!);
  },
});
```

For each study-group route:

1. Read the current implementation
2. Identify the auth mode (most are `"required"`, admin ones are `"admin"`)
3. Wrap in `createRouteHandler({ auth, parseBody, execute })`
4. Verify the service function's return shape matches what the route previously returned

**Verify after each route**: `pnpm run typecheck` → exit 0.

### Step 5: Migrate the 5 priority non-study-group routes

Same process. Special notes:

- `cron/weekly-digest/route.ts` — likely `auth: "admin"` with no body parsing
- `auth/callback/route.ts` — may need `auth: "none"` with custom body parsing
- `user/export/route.ts` — likely `auth: "required"`, returns a file/blob response

**Verify**: `pnpm run typecheck` → exit 0.

### Step 6: Run full test suite

```bash
pnpm run test
```

## Test plan

- No new tests required (we're not changing business logic, only the handler wrapper)
- If a route has existing E2E tests, run them: `pnpm run test:e2e -- --grep "study-group"`
- Manually verify at least 2 routes by inspecting the diff: the business logic should be untouched

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] All 15 study-group route files use `createRouteHandler` (no raw `NextResponse` in those files)
- [ ] 5 priority non-study-group routes use `createRouteHandler`
- [ ] No business logic changed — only the handler wrapper
- [ ] `plans/README.md` status row updated

## STOP conditions

- A route uses dynamic route params (`[paramId]`) accessed via `req.nextUrl.pathname` or similar — `createRouteHandler` provides `params` in the execute callback
- A route returns a non-JSON response (file download, redirect, HTML) — `createRouteHandler` wraps in `serializeResponse` which may not support this (STOP and report)
- A route does custom response status code setting (e.g., 201 Created) — `createRouteHandler` always returns 200 unless an error occurs

## Maintenance notes

- When the remaining 15 deferred routes are migrated, they follow the exact same pattern
- The auth middleware in `createRouteHandler` uses `getAuthenticatedUserId()` from `@/lib/server/auth` — any custom auth logic in raw handlers should be inlined into the route service
- Error response shape is now standardized to `{ error: string }` with appropriate HTTP status codes
