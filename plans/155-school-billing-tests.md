# Plan 155: Add tests for school billing/money-flow routes

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 82a850d3..HEAD -- src/app/api/school/ src/app/api/stripe/`
> If any files changed since this plan was written, compare the "Current state"
> excerpts against the live code before proceeding; on a mismatch, treat it as
> a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `82a850d3`, 2026-07-10

## Why this matters

The school billing routes (`/api/school/billing`, `/api/school/checkout`,
`/api/school/cancel`) handle Stripe-based school license purchases and
subscription management. The Stripe webhook
(`/api/stripe/webhook`) already has tests (263 lines) but they mock
`stripe.webhooks.constructEvent` entirely — they test the handler's `if/else`
branching, not real Stripe integration. A route-handler regression in the
billing flow (wrong `subscriptionId` extraction, missing `client_reference_id`
guard) silently loses subscription data or charges the wrong amount.

## Current state

Three route files with zero tests:

1. `src/app/api/school/billing/route.ts` — likely handles billing portal
   session creation
2. `src/app/api/school/checkout/route.ts` — likely handles checkout session
   creation
3. `src/app/api/school/cancel/route.ts` — likely handles subscription
   cancellation

The Stripe webhook at `src/app/api/stripe/webhook/route.ts` has tests at
`src/app/api/stripe/__tests__/webhook.test.ts` but they mock `constructEvent`.

Test pattern to follow: `src/app/api/stripe/__tests__/webhook.test.ts`.

## Scope

**In scope**:

- `src/app/api/school/billing/__tests__/route.test.ts` (create)
- `src/app/api/school/checkout/__tests__/route.test.ts` (create)
- `src/app/api/school/cancel/__tests__/route.test.ts` (create)
- `src/app/api/stripe/__tests__/webhook.test.ts` (update — add real Stripe
  event test or document limitation)

**Out of scope**:

- Do NOT change the route handlers themselves
- Do NOT test the `SchoolService` class directly (if it has its own tests)
- Do NOT add Stripe SDK integration tests (requires test API keys in CI)

## Git workflow

- Branch: `advisor/155-school-billing-tests`
- Commit message: `test: add route-level tests for school billing endpoints`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Characterize the route handlers

First, read each route file to understand what it does and what it needs:

```bash
cat src/app/api/school/billing/route.ts
cat src/app/api/school/checkout/route.ts
cat src/app/api/school/cancel/route.ts
```

For each, identify:

- What config it expects from `createRouteHandler`
- What `execute` function it exposes
- What external dependencies it uses (Stripe SDK, Appwrite, services)
- What validation it performs

### Step 2: Create test files with characterization tests

For each billing route, create a test file that:

1. **Successful path** — mocks Stripe successfully, verifies 200 response with
   expected shape (e.g., `{ url }` for checkout redirect)
2. **Missing auth** — verifies 401 when unauthenticated
3. **Missing body fields** — verifies 400 on invalid input (if the route has
   validation)
4. **Stripe error** — mocks Stripe throwing, verifies 500 or appropriate error

Example structure for `billing/__tests__/route.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";

vi.mock("@/lib/server/auth", () => ({
  getAuthenticatedUserId: vi.fn(() => "test-user-id"),
}));

vi.mock("stripe", () => {
  const Stripe = vi.fn().mockImplementation(() => ({
    billingPortal: {
      sessions: {
        create: vi.fn().mockResolvedValue({ url: "https://stripe.com/billing" }),
      },
    },
    checkout: {
      sessions: {
        create: vi.fn().mockResolvedValue({ url: "https://stripe.com/checkout" }),
      },
    },
    subscriptions: {
      cancel: vi.fn().mockResolvedValue({ id: "sub_123", status: "canceled" }),
    },
    webhooks: {
      constructEvent: vi.fn(),
    },
  }));
  return { default: Stripe };
});

function createPost(body: Record<string, unknown> = {}) {
  return new Request("http://localhost:3000/api/school/billing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
```

### Step 3: Write webhook integration note

Add a comment to `src/app/api/stripe/__tests__/webhook.test.ts` documenting
that these tests mock `constructEvent` and do not verify real Stripe
signature verification. Add a test for the event-routing branches if not
already covered.

**Verify**: `pnpm run test -- src/app/api/school/ src/app/api/stripe/` → all tests pass.

## Test plan

- ~3-4 tests per billing route (12 total)
- ~2-3 additional tests for the webhook (event routing branches)
- Use `vi.mock` for Stripe SDK at the top level
- If the routes use `createRouteHandler`, test the exported handler directly

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test -- src/app/api/school/ src/app/api/stripe/` exits 0, 12+ new tests pass
- [ ] `pnpm exec oxlint` — zero warnings on new test files
- [ ] 3 test files created under `school/{billing,checkout,cancel}/__tests__/`
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- The route handlers are not cleanly testable (e.g., they inline Stripe
  initialization rather than importing a shared Stripe instance). If so,
  extract the Stripe client to a shared module first.
- A route uses `auth: "none"` or `auth: "optional"` — these should be
  planned as separate security fixes.
- The Stripe SDK import path is complex (e.g., dynamic import with
  `@/lib/stripe` wrapper). If so, mock the wrapper instead of Stripe
  directly.

## Maintenance notes

- If Stripe SDK interfaces change (e.g., v23), update mocks in all 4 test
  files.
- These tests are unit tests, not integration tests. Real Stripe integration
  testing requires `STRIPE_TEST_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in
  CI, which is a separate effort.
- The billing routes are the codebase's only money-flow paths — any change to
  Stripe interaction logic should update these tests first.
