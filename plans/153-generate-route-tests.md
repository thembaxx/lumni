# Plan 153: Add tests for AI generate route handler

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 82a850d3..HEAD -- src/app/api/engine/generate/`
> If any file under that path changed since this plan was written, compare
> the "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `82a850d3`, 2026-07-10

## Why this matters

`POST /api/engine/generate` is the core product route — it creates the
questions users study. It integrates auth + budget checking + rate limiting +
Zod validation + orchestration + error handling. Despite being the highest-value
route in the codebase, it has zero route-level tests. The engine class itself
has tests (158 lines in `question-engine.test.ts`), but the route handler's
wiring of auth, budget, validation, and error paths is untested.

## Current state

`src/app/api/engine/generate/route.ts` (~52 lines):

```typescript
// Line ~5-15
export const POST = createRouteHandler({
  auth: "required",
  budget: "generate",
  useRateLimit: true,
  errorLabel: "GenerateQuestions",
  validate: (body) => {
    if (!body.subject) return "subject is required";
    if (!body.count) return "count is required";
    if (body.count > 50) return "count must be <= 50";
    return null;
  },
  execute: async ({ userId, body }) => {
    const { subject, topic, count, questionType, difficulty } = body;
    // ...calls orchestrator, returns { questions, sources, warning }
  },
});
```

The route handler is cleanly factored using `createRouteHandler`. The most
valuable tests are on:

1. Validation — missing subject, missing count, count > 50
2. Auth rejection — returns 401 when unauthenticated
3. Budget rejection — returns 429 when budget exceeded
4. Successful response — returns the expected shape

Test pattern to follow: look at existing route tests in
`src/app/api/engine/generate/` or sibling directories like
`src/app/api/engine/__tests__/` for existing test structure.

## Scope

**In scope**:

- `src/app/api/engine/generate/__tests__/route.test.ts` (create new file)

**Out of scope**:

- Do NOT change `route.ts` itself
- Do NOT test the `LearningOrchestrator` (it has its own tests)
- Do NOT test the `QuestionEngine` directly (it has its own tests)
- Do NOT test the `daily-call-tracker` budget system (tested elsewhere)

## Git workflow

- Branch: `advisor/153-generate-route-tests`
- Commit message: `test: add route-level tests for generate endpoint`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Create the test file

Create `src/app/api/engine/generate/__tests__/route.test.ts`.

Use `POST` from the route module and create `NextRequest` objects. Model the
test structure after existing route tests in the codebase — e.g.,
`src/app/api/engine/hint/__tests__/route.test.ts` or
`src/app/api/engine/grade/__tests__/route.test.ts`.

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";

// Mock dependencies that the route handler uses
vi.mock("@/lib/server/auth", () => ({
  getAuthenticatedUserId: vi.fn(() => "test-user-id"),
}));

vi.mock("@/lib/ai/with-budget", () => ({
  checkBudget: vi.fn(() => ({ allowed: true, userId: "test-user-id" })),
  trackUsage: vi.fn(),
}));

// Mock the orchestrator
vi.mock("@/lib/orchestrator/learning-orchestrator", () => ({
  LearningOrchestrator: vi.fn().mockImplementation(() => ({
    generateQuestionSet: vi.fn().mockResolvedValue({
      questions: [{ id: "q1", type: "multiple-choice", text: "Test?" }],
      sources: [],
    }),
  })),
}));

// Helper to create a POST request
function createPostRequest(body: Record<string, unknown>) {
  return new Request("http://localhost:3000/api/engine/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/engine/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Tests here
});
```

### Step 2: Write validation tests

Write tests for each validation case:

```typescript
it("returns 200 with valid minimal request", async () => {
  const res = await POST(createPostRequest({ subject: "mathematics", count: 5 }));
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data).toHaveProperty("questions");
  expect(data).toHaveProperty("sources");
});

it("returns validation error when subject is missing", async () => {
  const res = await POST(createPostRequest({ count: 5 }));
  expect(res.status).toBe(400);
  const data = await res.json();
  expect(data).toContain("subject");
});

it("returns validation error when count is missing", async () => {
  const res = await POST(createPostRequest({ subject: "mathematics" }));
  expect(res.status).toBe(400);
});

it("returns validation error when count > 50", async () => {
  const res = await POST(createPostRequest({ subject: "mathematics", count: 100 }));
  expect(res.status).toBe(400);
  expect(data).toContain("50");
});

it("returns validation error when count is 0", async () => {
  // Note: the validator checks `!body.count`, so 0 may be treated as missing.
  // Write the test that captures current behaviour.
  const res = await POST(createPostRequest({ subject: "mathematics", count: 0 }));
  expect(res.status).toBe(400);
});
```

### Step 3: Write auth rejection test

```typescript
it("returns 401 when unauthenticated", async () => {
  // Override auth mock to return null (unauthenticated)
  const auth = await import("@/lib/server/auth");
  vi.mocked(auth.getAuthenticatedUserId).mockResolvedValueOnce(null);

  const res = await POST(createPostRequest({ subject: "mathematics", count: 5 }));
  expect(res.status).toBe(401);
});
```

### Step 4: Write budget rejection test

```typescript
it("returns 429 when budget exceeded", async () => {
  const budget = await import("@/lib/ai/with-budget");
  vi.mocked(budget.checkBudget).mockResolvedValueOnce({
    allowed: false,
    userId: "test-user-id",
    response: new Response(JSON.stringify({ error: "Budget exceeded" }), { status: 429 }),
  });

  const res = await POST(createPostRequest({ subject: "mathematics", count: 5 }));
  expect(res.status).toBe(429);
});
```

**Verify**: `pnpm run test -- src/app/api/engine/generate/` → all tests pass.

## Test plan

- 5-6 tests as described above
- Model after existing route tests (e.g., `src/app/api/engine/hint/__tests__/`)
- Use `vi.mock` at the top level for the 3 dependencies
- Each test controls mock return values individually

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test -- src/app/api/engine/generate/` exits 0, 5+ new tests pass
- [ ] `pnpm exec oxlint` — zero warnings on the test file
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- The `POST` handler is not directly exportable for testing (is wrapped in
  middleware or closure). If it's wrapped, test the inner handler or adjust
  the mock approach.
- The `createRouteHandler` factory has changed how it exposes the route
  handler (e.g., it returns `{ POST }`). Adjust imports accordingly.

## Maintenance notes

- These tests capture the route handler's contract. If validation rules
  change (e.g., max count changes from 50 to 100), update the relevant test.
- If a new feature adds optional fields to the request body, add a test that
  verifies it's passed through to the orchestrator.
