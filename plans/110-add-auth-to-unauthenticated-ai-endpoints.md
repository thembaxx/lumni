# Plan 110: Add auth guards to unauthenticated AI-cost API endpoints

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat d3446bd7..HEAD -- src/app/api/engine/ src/app/api/search/web/ src/app/api/chat/image/`
> If any in-scope file changed, compare the "Current state" excerpts against
> the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW (adding auth guard before AI calls — additive, not modifying)
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `d3446bd7`, 2026-07-06

## Why this matters

13+ API endpoints route to AI providers (Gemini, Nvidia, Groq, Deepgram,
ElevenLabs, Exa) without requiring authentication. Some have daily budget
tracking (generate, solve, generate-element-fact), but many have none (voice,
transcribe, visual, knowledge-graph, study-guide, generate-story, hint, grade,
web-search, chat/image). An attacker with a script can drain AI/API credits
at a cost of dollars per minute, causing denial of service for real users.

## Current state

All endpoints listed below use `auth: "none"` in their `createRouteHandler`
config or are plain handlers without auth. None call `getAuthenticatedUserId()`
before triggering paid API calls.

Files to change:

| File                                             | Route                           | Budget? |
| ------------------------------------------------ | ------------------------------- | ------- |
| `src/app/api/engine/voice/route.ts:5`            | POST /api/engine/voice          | No      |
| `src/app/api/engine/transcribe/route.ts:6`       | POST /api/engine/transcribe     | No      |
| `src/app/api/engine/visual/route.ts:5`           | POST /api/engine/visual         | No      |
| `src/app/api/engine/knowledge-graph/route.ts:46` | GET /api/engine/knowledge-graph | No      |
| `src/app/api/engine/study-guide/route.ts:9`      | POST /api/engine/study-guide    | No      |
| `src/app/api/engine/generate-story/route.ts:7`   | POST /api/engine/generate-story | No      |
| `src/app/api/engine/hint/route.ts:7`             | POST /api/engine/hint           | No      |
| `src/app/api/engine/grade/route.ts:6`            | POST /api/engine/grade          | No      |
| `src/app/api/search/web/route.ts:5`              | POST /api/search/web            | No      |
| `src/app/api/chat/image/route.ts:10`             | POST /api/chat/image            | No      |

Endpoints that ALREADY have auth or budget (do NOT touch):

- `src/app/api/engine/generate/route.ts` — has `budget` tracking
- `src/app/api/solve/route.ts` — has `budget` tracking
- `src/app/api/generate-element-fact/route.ts` — has `budget` tracking
- `src/app/api/chat/route.ts` — already has auth guard (Plan 107)

The repo convention for adding auth: call `getAuthenticatedUserId()` from
`@/lib/server/auth` at the top of the handler and return 401 if null. See
`src/app/api/chat/route.ts:28-33` for the exact pattern.

## Commands you will need

| Purpose   | Command                  | Expected on success |
| --------- | ------------------------ | ------------------- |
| Typecheck | `pnpm run typecheck`     | exit 0              |
| Tests     | `pnpm run test`          | all pass            |
| Lint      | `pnpm exec oxlint --fix` | exit 0              |

## Scope

**In scope**:

- The 10 route files listed above — add auth guard before AI API calls

**Out of scope**:

- Endpoints with existing budget tracking (generate, solve, generate-element-fact)
- Any non-AI endpoints
- The budget tracking system itself

## Steps

### Step 1: Add auth guard to each route

For each of the 10 files, add the following pattern at the top of the handler
function, before any AI provider call:

```ts
import { getAuthenticatedUserId } from "@/lib/server/auth";

// At top of handler:
const sessionUserId = await getAuthenticatedUserId();
if (!sessionUserId) {
  return NextResponse.json({ error: "Authentication required" }, { status: 401 });
}
```

For routes that use `createRouteHandler` (check if the file has a `handler`
export wrapping `createRouteHandler`), change the `auth` config from
`"none"` to `"required"` instead of adding the inline guard. This is cleaner.

Files using `createRouteHandler`:

- Check each file's export pattern — if it uses `createRouteHandler(...)` with
  an `auth` option, change `auth: "none"` to `auth: "required"`
- If it's a plain `async function GET/POST`, add the inline guard above

### Step 2: Fix tests

Some routes may have test files that call them without auth. Run:

```bash
pnpm run test
```

If any tests fail with 401, update the test to mock `getAuthenticatedUserId`:

```ts
import { getAuthenticatedUserId } from "@/lib/server/auth";
vi.mock("@/lib/server/auth");
vi.mocked(getAuthenticatedUserId).mockResolvedValue("test-user-id");
```

**Verify**: `pnpm run test` → all pass

## Test plan

- No new tests required — existing route tests should pass after adding auth mocks
- If a route has no test file, no action needed
- Verify budget-only endpoints (generate, solve, generate-element-fact) still
  work without auth (they have their own budget guard but no auth requirement)

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm exec oxlint --fix` exits 0
- [ ] `pnpm run test` exits 0
- [ ] No files outside in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

- More than 5 tests fail — stop and investigate auth mock approach
- Any route has complex handler logic that makes insertion non-trivial — stop and report
- A route legitimately needs to be callable without auth (e.g., shared public question
  hints) — skip that route and note the exception

## Maintenance notes

- New AI-cost endpoints should default to `auth: "required"` or include the
  `getAuthenticatedUserId()` guard — add this to the route template/review checklist
- Budget tracking is a complementary layer — some endpoints have budget but no auth;
  ideally both should be present, but auth is the cheaper and stronger protection
