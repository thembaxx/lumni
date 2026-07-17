# Plan 250: Add smoke tests for top 10 highest-risk API routes

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: none
- **Category**: test
- **Generated at**: 2026-07-17

## Why this matters

The project has 130+ API routes with zero test coverage. The 10 highest-risk routes handle money (Stripe webhook, Payfast ITN), auth (login, password reset), data import/export (sync push/pull), admin functions (user management, exam management), and student enrollment (study groups join, teacher student join). A regression in any of these causes silent data loss, failed payments, or auth bypass.

Smoke tests validate the request→response contract: correct HTTP status, expected body shape, and proper error handling for missing params. They use mocked deps so they run in milliseconds without side effects.

## Current state

130+ API routes in `src/app/api/` with zero tests:

| Route                           | Risk | Reason                                                      |
| ------------------------------- | ---- | ----------------------------------------------------------- |
| `POST /api/stripe/webhook`      | HIGH | Payment processing, idempotency key, signature verification |
| `POST /api/auth/callback`       | HIGH | OAuth flow, user session creation                           |
| `POST /api/auth/reset-password` | HIGH | Password reset token validation                             |
| `POST /api/sync/push`           | HIGH | Data import from other devices                              |
| `GET /api/sync/pull`            | HIGH | Data export serving                                         |
| `GET /api/admin/users`          | HIGH | Privileged data access                                      |
| `GET /api/admin/exams`          | HIGH | Admin exam management                                       |
| `POST /api/payfast/itn`         | HIGH | Payment gateway ITN callback                                |
| `POST /api/study-groups/join`   | HIGH | Group enrollment                                            |
| `GET /api/q/[id]`               | HIGH | Public question sharing, view counting                      |

## Target state

10 test files, one per high-risk route. Each test validates:

1. **Happy path** — valid request returns 200/201 with expected body shape
2. **Missing params** — invalid request returns 4xx with error shape
3. **Auth guard** — unauthenticated request returns 401/403 (for protected routes)
4. **Edge case** — empty body, wrong content-type, unexpected payload

Tests use mocked deps (DI pattern via `createRouteHandler` where available, or `vi.mock` for route files that call external services).

## Scope

- 10 new test files in each route's `__tests__/` directory
- No changes to production route implementations

## Steps

### 1. Discover route structure

For each of the 10 routes, find the actual file path:

```bash
find src/app/api -name "route.ts" | grep -E "(stripe|auth/callback|auth/reset|sync/push|sync/pull|admin/users|admin/exams|payfast|study-groups/join|q/\[id\])"
```

### 2. Read each route

For each route, understand:

- Is it a `createRouteHandler` pattern? If so, DI is trivial.
- Is it a raw Next.js route handler? Use `vi.mock` sparingly.
- What external services does it call? (Stripe SDK, Appwrite, Ably, etc.)
- What auth guard does it use?

### 3. Create test template

Create a reusable test helper pattern. Each test file follows this structure:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock external dependencies at module scope only where unavoidable
// Prefer vi.hoisted for clean isolation

const handler = (await import("./route")).POST; // or GET/PUT/DELETE

function createRequest({
  method = "POST",
  url = "http://localhost/api/route",
  body,
  headers,
}: {
  method?: string;
  url?: string;
  body?: unknown;
  headers?: Record<string, string>;
}): NextRequest {
  return new NextRequest(url, {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
}
```

### 4. Write each test file

**stripe/webhook**: Mock Stripe's `constructEvent`. Send valid event payload → 200. Send invalid signature → 400. Send unknown event type → 200 (Stripe expects 200 for unknown events).

**auth/callback**: Mock Appwrite OAuth callback. Valid provider/code → 302 redirect. Missing code → 400. Invalid provider → 400.

**auth/reset-password**: Mock token verification. Valid token → 200. Expired token → 401. Missing password field → 400.

**sync/push**: Mock outbox queue. Valid entries → 200. Empty body → 400. Invalid entry format → 400.

**sync/pull**: Mock checkpoint service. Valid checkpoint → 200 with entries. Missing checkpoint → 200 with full sync. Invalid user → 401.

**admin/users**: Mock admin auth. Admin user → 200 with user list. Non-admin → 403. Missing auth → 401.

**admin/exams**: Mock exam service. Admin user → 200 with exam list. Non-admin → 403.

**payfast/itn**: Mock signature verification. Valid ITN payload → 200. Invalid signature → 400. Duplicate ITN → 409.

**study-groups/join**: Mock group service. Valid invite code → 200. Invalid invite code → 404. Already member → 409.

**q/[id]**: Mock question service. Existing question → 200. Non-existent question → 404. View count increments on GET.

### 5. Verify

```bash
# Run each file individually first
for f in \
  src/app/api/stripe/webhook/__tests__/*.test.ts \
  src/app/api/auth/callback/__tests__/*.test.ts \
  src/app/api/auth/reset-password/__tests__/*.test.ts \
  src/app/api/sync/push/__tests__/*.test.ts \
  src/app/api/sync/pull/__tests__/*.test.ts \
  src/app/api/admin/users/__tests__/*.test.ts \
  src/app/api/admin/exams/__tests__/*.test.ts \
  src/app/api/payfast/itn/__tests__/*.test.ts \
  src/app/api/study-groups/join/__tests__/*.test.ts \
  src/app/api/q/\[id\]/__tests__/*.test.ts; do
  echo "=== $f ==="
  pnpm test -- "$f"
done

pnpm run typecheck
pnpm exec biome check
```

## Test plan

| Route                 | Happy Path              | Error Cases             |
| --------------------- | ----------------------- | ----------------------- |
| `stripe/webhook`      | Valid event → 200       | Invalid signature → 400 |
| `auth/callback`       | Valid OAuth → 302       | Missing code → 400      |
| `auth/reset-password` | Valid token → 200       | Expired token → 401     |
| `sync/push`           | Valid entries → 200     | Empty body → 400        |
| `sync/pull`           | Valid checkpoint → 200  | Invalid user → 401      |
| `admin/users`         | Admin role → 200        | Non-admin → 403         |
| `admin/exams`         | Admin role → 200        | No auth → 401           |
| `payfast/itn`         | Valid signature → 200   | Invalid sig → 400       |
| `study-groups/join`   | Valid code → 200        | Invalid code → 404      |
| `q/[id]`              | Existing question → 200 | Not found → 404         |

## Done criteria

- [ ] All 10 routes have a `__tests__/` directory with at least one `.test.ts` file
- [ ] Each test covers happy path + at least 2 error cases
- [ ] `pnpm test` passes with no regressions
- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm exec biome check` passes on all new files
- [ ] `plans/README.md` status row updated

## STOP conditions

- If a route uses `createRouteHandler` factory, use its `deps` injection pattern — do NOT use `vi.mock` on route handler factory dependencies
- If a route imports from `next/server` or uses Next.js `cookies()`/`headers()` that require a runtime environment, use `vi.mock` carefully at the top of the describe block, not at module scope
- If any route is protected by middleware (e.g., `src/middleware.ts` rewrites or blocks), the test needs to exercise the middleware too, or mock the auth context that the route expects
- If `POST /api/stripe/webhook` requires Stripe SDK to construct an event, mock `Stripe.webhooks.constructEvent` — do NOT send real Stripe webhook secrets
- If `POST /api/payfast/itn` requires real Payfast IP verification, mock the IP check and signature verification functions
- If any route is over 200 lines, prioritize testing the handler logic rather than the full HTTP wrapper — the route can be refactored into a service with its own test file

## Estimated time

6-8 hours (30-45 min per route)
