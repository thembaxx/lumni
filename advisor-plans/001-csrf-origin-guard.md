# Plan 001: Add Origin header validation to `createRouteHandler`

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `advisor-plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat be3a4dfb..HEAD -- src/lib/api/create-route-handler.ts src/lib/shared/with-rate-limit.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: MED
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `be3a4dfb`, 2026-07-09
- **Issue**: (none — no `--issues` flag)

## Why this matters

Every mutation endpoint in the codebase (50+ routes) inherits the same `createRouteHandler` factory. None of them validate the `Origin` or `Referer` header before processing requests. This means any authenticated session is vulnerable to cross-site request forgery (CSRF): a malicious page can trigger AI generation (costing money), submit exam answers, enroll in groups, create/delete feature flags, and more. The fix is a single origin-check hook in the factory that covers all routes with zero per-route changes.

## Current state

The `createRouteHandler` factory is at `src/lib/api/create-route-handler.ts`. It wraps route execution with auth checks, body parsing, validation, rate limiting, and error handling — but never checks the `Origin` header. The existing code looks like:

```typescript
// src/lib/api/create-route-handler.ts (around line 80-130)
export function createRouteHandler<TBody, TResult>(config: RouteHandlerConfig<TBody, TResult>) {
  return async (req: NextRequest, context?: { params?: Promise<Record<string, string>> }) => {
    try {
      // ... auth check ...
      // ... body parsing ...
      // ... validation ...
      // ... budget check ...
      const result = await config.execute({ body, userId, req, params, requestId });
      return NextResponse.json(result);
    } catch (error) {
      // ... error handling ...
    }
  };
}
```

There is a pre-existing pattern for conditional middleware: `withRateLimit` in `src/lib/shared/with-rate-limit.ts` wraps the handler. The `HttpError` class (line 30) and `SecurityError` class (line 40) both exist for error responses.

**Repo conventions to match:**

- Error responses use `HttpError` for 4xx and `SecurityError` for auth/security failures
- Environment config comes from `process.env.NEXT_PUBLIC_SITE_URL` (check if this exists) or `process.env.VERCEL_URL`
- The `logError` function from `@/lib/shared/logger` is used throughout
- `NextRequest` from `next/server`

**Design constraint (from ADR-0005, theming):** No hardcoded values — use existing error classes.

## Commands you will need

| Purpose   | Command                                                             | Expected on success |
| --------- | ------------------------------------------------------------------- | ------------------- |
| Typecheck | `pnpm typecheck`                                                    | exit 0, no errors   |
| Tests     | `pnpm test -- createRouteHandler`                                   | all pass            |
| Lint      | `pnpm exec oxlint`                                                  | exit 0              |
| Format    | `pnpm exec oxfmt --check`                                           | exit 0              |
| Full gate | `pnpm run typecheck && pnpm exec oxlint && pnpm exec oxfmt --check` | all green           |

## Scope

**In scope** (the only files you should modify):

- `src/lib/api/create-route-handler.ts` — add Origin validation
- `src/lib/api/__tests__/create-route-handler.test.ts` (create) — tests for the origin guard

**Out of scope** (do NOT touch):

- Individual route files — the fix is framework-level
- `with-rate-limit.ts` — no changes needed
- Any route that uses `options` (preflight) — the guard must skip OPTIONS requests
- Any configuration or API key values

## Git workflow

- Branch: `advisor/001-csrf-origin-guard`
- Commit per step; message style: conventional commits matching the repo (`git log --oneline -5` shows the style — match it)
- Do NOT push or open a PR unless instructed

## Steps

### Step 1: Add origin validation to `createRouteHandler`

Add a `validateOrigin` function and call it in the handler pipeline, after auth but before `execute`. The rules:

1. If the HTTP method is `OPTIONS`, skip origin check (preflight).
2. If the request is a GET/HEAD, skip origin check (CSRF requires state-changing methods).
3. If `NEXT_PUBLIC_SITE_URL` is set, compare the `Origin` header against it (exact match). If not set, compare against `https://<VERCEL_URL>` or `http://localhost:<PORT>`.
4. If no `Origin` header is present, allow the request (browser extensions, curl, server-to-server). This is important for API clients.
5. If `Origin` is present but doesn't match, throw a `SecurityError` with status 403.

The function signature: `function validateOrigin(req: NextRequest, config: RouteHandlerConfig): string | null` returning an error message or null.

Place the check in the handler body after the auth guard, around line 90-110.

```typescript
// Pseudocode — adapt to the actual code flow
function validateOrigin(req: NextRequest, config: RouteHandlerConfig): string | null {
  const method = req.method;
  if (method === "OPTIONS" || method === "GET" || method === "HEAD") return null;

  const origin = req.headers.get("origin");
  if (!origin) return null; // no origin = not a browser CSRF

  const allowedOrigin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);

  if (!allowedOrigin) {
    // In development, allow any origin (no env set)
    if (process.env.NODE_ENV === "development") return null;
    return "Origin validation misconfigured: no allowed origin set";
  }

  return origin === allowedOrigin ? null : `Origin "${origin}" not allowed`;
}
```

**Verify**:

1. Read the file and locate the exact insertion point.
2. After making the change: `pnpm typecheck` → exit 0

### Step 2: Create tests for the guard

Create `src/lib/api/__tests__/create-route-handler.test.ts`. Model the test structure after existing tests in the same directory (check for other test files in `src/lib/api/__tests__/`).

Test cases:

1. GET request with no Origin → no rejection
2. GET request with wrong Origin → no rejection (GETs are safe)
3. POST request with matching Origin → no rejection
4. POST request with wrong Origin → 403 rejection
5. POST request with no Origin → allowed (no CSRF vector)
6. OPTIONS request with wrong Origin → always allowed (preflight)
7. Development mode with no env set → allowed

Use `vi.mock` to set environment variables. Use `NextRequest` from `next/server` for creating test requests.

```typescript
// Example test structure
import { NextRequest } from "next/server";

function createMockRequest(method: string, origin?: string): NextRequest {
  const headers = new Headers();
  if (origin) headers.set("origin", origin);
  return new NextRequest(`http://localhost:3000/api/test`, { method, headers });
}
// ...call createRouteHandler with a test config and assert responses
```

**Verify**: `pnpm test -- create-route-handler` → exit 0, new tests pass

### Step 3: Verify no regressions

Run the full gate.

**Verify**:

- `pnpm typecheck` → exit 0
- `pnpm exec oxlint` → exit 0
- `pnpm test` → all 1500+ tests pass (no regressions)

## Test plan

- File: `src/lib/api/__tests__/create-route-handler.test.ts` (new)
- Cases: 7 test cases as described in Step 2
- Pattern: use `vi.mock` for env vars, `new NextRequest()` for request objects, assert on `NextResponse.status`

## Done criteria

- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm test -- createRouteHandler` — all tests pass
- [ ] `pnpm test` — all tests pass (no regressions)
- [ ] `pnpm exec oxlint` — exit 0, no warnings on changed files
- [ ] `advisor-plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The file structure in `src/lib/api/` doesn't match expectations (e.g., `create-route-handler.ts` is structured very differently from described).
- A step's verification fails twice after a reasonable fix attempt.
- The fix appears to require touching an out-of-scope file.
- The approach breaks existing tests in unexpected ways (e.g., tests send POST requests without an Origin header and expect 200 — those should still pass per rule 4).

## Maintenance notes

- If the app gains a second allowed origin (e.g., an embedded widget domain), the `validateOrigin` function needs to accept multiple origins.
- Electron apps or React Native WebView clients may not send Origin headers — the "no origin = allow" rule handles this.
- The CSP `report-uri` in `next.config.ts` should eventually be updated to use nonces (separate plan).
