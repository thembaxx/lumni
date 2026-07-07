# Plan 127: Migrate chat route to createRouteHandler

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a79c0e7c..HEAD -- src/app/api/chat/route.ts`

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `a79c0e7c`, 2026-07-06

## Why this matters

The chat route is the most user-facing AI surface but has no rate limiting, no security headers, no `sanitizeErrorMessage`, and bypasses `AIClient` entirely. It hand-rolls auth, budget, body parsing, and error handling — a pre-infrastructure artifact.

## Current state

`src/app/api/chat/route.ts:94-209` — hand-rolled POST handler with:

- Manual `getAuthenticatedUserId` for auth
- Manual `checkBudget` for budget
- Manual `req.json()` for body parsing
- No `withRateLimit`
- No `sanitizeErrorMessage`
- No security headers
- Own `getModels()` function duplicating `src/lib/ai/client.ts:55-113`
- Uses `streamText`/`generateText` directly from `ai` SDK, bypassing `AIClient`

## Commands you will need

| Purpose   | Command                 | Expected on success |
| --------- | ----------------------- | ------------------- |
| Typecheck | `pnpm run typecheck`    | exit 0, no errors   |
| Tests     | `pnpm run test -- chat` | all pass            |

## Steps

### Step 1: Extract auth/budget guard

Keep the streaming response outside `createRouteHandler` but use the auth and budget guard from the factory. Two options:

**Option A (preferred)**: Add a `streaming: true` option to `createRouteHandler` that skips the response wrapper but still applies auth, budget, rate-limit, and security headers.

**Option B (simpler)**: Keep the hand-rolled handler but wrap it with `withRateLimit` and add `sanitizeErrorMessage` to error paths. Add security headers manually.

Start with Option B to minimize risk.

### Step 2: Apply Option B

In `src/app/api/chat/route.ts`:

1. Add `import { withRateLimit } from "@/lib/shared/with-rate-limit"`
2. Wrap the POST handler with `withRateLimit({ max: 10, windowMs: 60_000 })`
3. Add `import { sanitizeErrorMessage } from "@/lib/api/create-route-handler"` (if exported)
4. In the catch block, use `sanitizeErrorMessage(error)` before returning
5. Add security headers to the response: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`

### Step 3: Remove duplicate getModels()

Replace the local `getModels()` function with the shared provider from `@/lib/ai/client`. Import `getAI()` or `createProviderModels` from the AI module.

**Verify**: `pnpm exec oxlint src/app/api/chat/route.ts` → 0 errors

### Step 4: Verify

**Verify**: `pnpm run typecheck` → exit 0
**Verify**: `pnpm run test` → all pass

## Done criteria

- [ ] Chat route uses `withRateLimit`
- [ ] Error messages sanitized before response
- [ ] Security headers present on error responses
- [ ] Duplicate `getModels()` removed
- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] `plans/README.md` status row updated

## STOP conditions

- The streaming SSE response shape is incompatible with `withRateLimit` wrapper
- `sanitizeErrorMessage` is not exported from `create-route-handler`
