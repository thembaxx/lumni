# Plan P010: Add AI Provider Chain Characterization Tests

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `advisor-plans/README.md`.
>
> **Drift check**: `git diff --stat e02ad4fc..HEAD -- src/lib/ai/`
> If any file changed, compare the current state against the live code.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: P007 (AIResult discriminant) — recommended, not required for testability
- **Category**: tests
- **Planned at**: commit `e02ad4fc`, 2026-07-03

## Why this matters

The `src/lib/ai/` directory contains 8 modules (310-line `client.ts`, 299-line `daily-call-tracker.ts`, 158-line `latency-tracker.ts`, 108-line `cached-ai-generator.ts`, and `with-budget.ts`, `parse-response.ts`, `call-context.ts`, `chat-context.ts`) with zero tests. This is the most critical business logic in the app — the AI gateway for quiz generation, grading, hinting, and solving. A regression in the fallback chain (Gemini → Nvidia → Groq), consent gating, rate-limit detection, or token tracking would silently degrade all AI features. Only caught in production.

## Current state

**`src/lib/ai/` directory** — no `*.test.ts` files exist. The modules:

- `client.ts` (310 lines) — `AIClient` class, `callWithFallback`, provider chain, `initAI`, `CHAT_SYSTEM_PROMPT`
- `daily-call-tracker.ts` (299 lines) — `DailyCallTracker`, Appwrite + in-memory dual-path, per-user/per-type limits, global 2000/day limit
- `latency-tracker.ts` (158 lines) — localStorage read/write, cost estimation, aggregated stats, per-provider latency
- `cached-ai-generator.ts` (108 lines) — generic `CachedAIGenerator<T>`, Dexie lookup → stale? → AI generate → cache
- `with-budget.ts` (52 lines) — `checkBudget`, `trackUsage`
- `parse-response.ts` (36 lines) — `parseAIResponse`, `getTextResponse`
- `call-context.ts` (30 lines) — `runWithAICallContext`, consent gating
- `chat-context.ts` — build context from Dexie data

**Test conventions**: This codebase uses vitest with happy-dom. Tests live in `__tests__/` directories alongside their modules. Existing pattern for mocking AI: `src/lib/question-engine/__tests__/` uses `vi.mock(...)` for AI imports.

## Commands you will need

| Purpose   | Command               | Expected on success |
| --------- | --------------------- | ------------------- |
| Test      | `pnpm run test -- ai` | all pass            |
| Typecheck | `pnpm run typecheck`  | exit 0, no errors   |
| Lint      | `pnpm exec oxlint`    | exit 0              |

## Scope

**In scope** (create these test files):

- `src/lib/ai/__tests__/client.test.ts` — AIClient provider chain tests
- `src/lib/ai/__tests__/daily-call-tracker.test.ts` — DailyCallTracker tests
- `src/lib/ai/__tests__/parse-response.test.ts` — parseAIResponse tests
- `src/lib/ai/__tests__/cached-ai-generator.test.ts` — CachedAIGenerator tests
- `src/lib/ai/__tests__/call-context.test.ts` — call-context tests
- `src/lib/ai/__tests__/with-budget.test.ts` — budget check tests

**Out of scope**:

- `latency-tracker.ts` — localStorage dependency makes unit testing complex; defer
- Integration tests with actual AI SDK (use mocks throughout)
- Changes to any production code

## Git workflow

- Branch: `advisor/P010-ai-tests`
- Commit message: `test: add characterization tests for AI provider chain modules`
- Do NOT push or open a PR

## Steps

### Step 1: Create `__tests__/` directory and test for `parse-response.ts`

Create `src/lib/ai/__tests__/parse-response.test.ts` with tests that cover:

- `parseAIResponse` with valid JSON response containing `content` and `provider`
- `parseAIResponse` with null/undefined input (returns fallback)
- `parseAIResponse` with malformed JSON (returns fallback)
- `getTextResponse` with valid response object
- `getTextResponse` with null/undefined

Each module function should be importable from `@/lib/ai/parse-response`.

### Step 2: Test `call-context.ts`

Create `src/lib/ai/__tests__/call-context.test.ts`:

- `runWithAICallContext` with `consentGranted: true` — calls the provided function
- `runWithAICallContext` with `consentGranted: false` — returns fallback/empty
- Error propagation through the context wrapper

### Step 3: Test `daily-call-tracker.ts`

Create `src/lib/ai/__tests__/daily-call-tracker.test.ts`. The tracker has two paths (Appwrite and in-memory fallback). Mock Appwrite by not setting `APPWRITE_DATABASE_ID` (environment-driven fallback).

Test the in-memory fallback path:

- `check()` returns `allowed: true` when under limit
- `check()` returns `allowed: false` when over limit
- `increment()` increases the count
- `getUsage()` returns accurate counts
- `getGlobalUsage()` returns global totals
- Date boundary resets the tracker (`ensureDate` behavior)

### Step 4: Test `with-budget.ts`

Create `src/lib/ai/__tests__/with-budget.test.ts`:

- `checkBudget` with valid request returns `{ allowed: true }` or similar
- Budget enforcement when limits are reached

### Step 5: Test `cached-ai-generator.ts`

Create `src/lib/ai/__tests__/cached-ai-generator.test.ts`. Use mock DataAccess and mock AI client:

- `generate()` returns cached data when available and fresh
- `generate()` calls AI when cache is stale/missing
- `generate()` stores AI results in cache
- Error handling when both cache and AI fail
- Custom `buildCacheEntry` and `extractData` config functions work

### Step 6: Test `client.ts`

Create `src/lib/ai/__tests__/client.test.ts`. This is the most complex test file — mock the `ai` SDK's `generateText`:

- `callWithFallback` uses the first provider when it succeeds
- `callWithFallback` falls through to second provider when first fails
- `callWithFallback` returns `AIFailure` when all providers fail
- Provider chain ordering matches the config
- Model ref lookup works

### Step 7: Verify

**Verify**: `pnpm run test -- ai` → 15-25 new tests pass. `pnpm run typecheck` → exit 0. `pnpm exec oxlint` → exit 0.

## Test plan

All new tests follow the vitest patterns established in the codebase. Use `vi.mock()` for external dependencies (AI SDK, Appwrite, localStorage). Each test file should be self-contained with no shared state.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm exec oxlint` exits 0
- [ ] `pnpm run test` all pass (including 15-25 new tests)
- [ ] Test files exist for at least 5 of the 6 planned modules
- [ ] No production code modified
- [ ] `advisor-plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- Any module's function signatures are hard to mock (e.g., module-level singletons, dynamic imports that are difficult to mock with vitest) — report the difficulty rather than writing fragile tests
- The `daily-call-tracker.test.ts` Appwrite double-write path can't be tested without setting env vars — test only the in-memory fallback path

## Maintenance notes

- These characterization tests capture the current behavior. When the AI provider chain changes (adding a provider, changing fallback logic), update these tests first.
- The `daily-call-tracker` has two behavioral paths (Appwrite and in-memory). Tests only cover the in-memory path. Add Appwrite integration tests when a test Appwrite instance is available.
