# Plan 161: Add integration test for auth → AI-cost pipeline

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 82a850d3..HEAD -- src/lib/ai/ src/lib/server/auth.ts`
> If either changed since this plan was written, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `82a850d3`, 2026-07-10

## Why this matters

The auth → AI-cost pipeline connects 3 systems: auth middleware
(`getAuthenticatedUserId`), budget checking (`checkBudget` / `trackUsage`),
and the AI provider chain (Gemini → Nvidia → Groq). When `generateText` is
called, the cost should be tracked against the authenticated user. A bug in
any of the three connections means either: unauthorized users consume AI
budget, or authorized users' AI usage is never tracked (free tier unlimited).

This pipeline cross-cuts `createRouteHandler` config, so testing it requires
a route-level integration-style test that exercises all three layers without
calling real AI APIs.

## Current state

- `src/lib/ai/with-budget.ts` — exports `checkBudget()` and `trackUsage()`
  functions that call the AI provider and then track the cost
- `src/lib/server/auth.ts` — exports `getAuthenticatedUserId()` used by all
  `auth: "required"` routes
- `createRouteHandler` — factory that wires auth, budget, and execute
- Individual unit tests exist for `with-budget` and `auth`, but no test
  exercises them together

Test pattern to follow: existing route tests in
`src/app/api/engine/__tests__/` or `src/lib/ai/__tests__/`.

## Scope

**In scope**:

- `src/lib/ai/__tests__/auth-cost-integration.test.ts` (create new file)

**Out of scope**:

- Do NOT test the actual AI providers (Gemini/Nvidia/Groq) — mock them
- Do NOT test the `LearningOrchestrator` or `QuestionEngine` (separate tests)
- Do NOT test specific route handlers (covered by Plan 153)
- Do NOT change `with-budget.ts`, `auth.ts`, or `createRouteHandler`

## Git workflow

- Branch: `advisor/161-auth-ai-cost-integration-test`
- Commit message: `test: add integration test for auth-to-AI-cost pipeline`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Create the test file

Create `src/lib/ai/__tests__/auth-cost-integration.test.ts`.

The test structure uses `createRouteHandler` from
`@/lib/api/create-route-handler` to set up a test route, then exercises it
with different auth states:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createRouteHandler } from "@/lib/api/create-route-handler";

// Mock auth
vi.mock("@/lib/server/auth", () => ({
  getAuthenticatedUserId: vi.fn(),
}));

// Mock budget tracking
vi.mock("@/lib/ai/with-budget", () => ({
  checkBudget: vi.fn(),
  trackUsage: vi.fn(),
}));

// Mock the AI provider (don't call real Gemini)
vi.mock("@/lib/ai/client", () => ({
  generateText: vi.fn(),
  getAI: vi.fn(),
}));

describe("auth-to-AI-cost pipeline", () => {
  let handler: ReturnType<typeof createRouteHandler>;

  const testRoute = {
    auth: "required" as const,
    budget: "generate" as const,
    errorLabel: "TestRoute",
    validate: (body: unknown) => null,
    execute: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    handler = createRouteHandler(testRoute);
  });

  // tests here
});
```

### Step 2: Write the pipeline tests

1. **Authenticated user → budget checked → AI called → cost tracked**:
   Set `getAuthenticatedUserId` to return a userId. `checkBudget` to return
   `{ allowed: true, userId }`. Call the handler. Verify `trackUsage` was
   called with the correct userId and cost.

2. **Unauthenticated → budget NOT checked → AI NOT called**:
   Set `getAuthenticatedUserId` to return `null`. Call the handler. Verify
   it returns `401`. Verify `checkBudget` and `trackUsage` were NOT called.

3. **Authenticated but budget exceeded → AI NOT called**:
   Set `getAuthenticatedUserId` to return a userId. `checkBudget` to return
   `{ allowed: false, userId }`. Call the handler. Verify it returns `429`.
   Verify `trackUsage` was NOT called.

4. **Budget check failure → no usage tracked**:
   Set `checkBudget` to throw. Call the handler. Verify it returns `500`.
   Verify `trackUsage` was NOT called.

5. **Multi-call: cost accumulates across calls**:
   Make 2 successful calls. Verify `trackUsage` was called twice.

**Verify**: `pnpm run test -- src/lib/ai/__tests__/` → all tests pass.

### Step 3: Verify the test isolates correctly

Ensure the test file doesn't import or accidentally call real AI providers:

```bash
grep -n 'gemini\|nvidia\|groq\|vertex\|google' src/lib/ai/__tests__/auth-cost-integration.test.ts
```

Should return only `vi.mock` paths (no actual provider imports).

## Test plan

- 5 test cases as described in Step 2
- All mocks at the module level
- Each test creates a fresh handler via `createRouteHandler`
- The `execute` mock is optional — the test focuses on the pipeline, not the
  business logic

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test -- src/lib/ai/__tests__/` exits 0, 5 new tests pass
- [ ] `pnpm exec oxlint` — zero warnings on the test file
- [ ] No test imports real AI provider modules (`gemini`, `nvidia`, `groq`)
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- `createRouteHandler` doesn't accept the `{ auth, budget, validate, execute,
errorLabel }` config shape. If it uses a different API, adjust the mock
  test route accordingly.
- The `budget` option is not a config parameter of `createRouteHandler` but
  is instead called inside `execute`. If budget checking is done by the
  route handler internally rather than by the factory, the test approach
  changes — we'd need to test through a real route (like the generate route).
- `trackUsage` is called from inside the AI provider's wrapper, not from
  `with-budget`. If so, mock the AI provider wrapper and verify it's called.

## Maintenance notes

- This is the highest-risk integration in the AI pipeline. Any change to
  auth, budget, or the route handler factory should update this test.
- If a new budget tier is added (e.g., "premium" vs "free"), add a test case
  for it here.
- The test intentionally does not exercise a real API route — it uses a
  synthetic route via `createRouteHandler`. This keeps the test focused,
  fast, and mock-isolated.
