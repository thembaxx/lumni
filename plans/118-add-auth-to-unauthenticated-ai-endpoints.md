# Plan 118: Add authentication to five unauthenticated AI-generating endpoints

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a79c0e7c..HEAD -- src/app/api/solve/route.ts src/app/api/engine/generate/route.ts src/app/api/generate-element-fact/route.ts src/app/api/curated-problems/route.ts src/app/api/engine/test/route.ts`

## Status

- **Priority**: P0
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `a79c0e7c`, 2026-07-06

## Why this matters

Five endpoints that invoke Gemini/Nvidia/Groq completions use `auth: "none"`. Any unauthenticated client can consume AI credits at scale. The rate limiting in place is keyed on spoofable headers (finding #5), so daily caps provide no real protection.

## Current state

All five routes already use `createRouteHandler` but with `auth: "none"`:

- `src/app/api/solve/route.ts:14` — `auth: "none"`
- `src/app/api/engine/generate/route.ts:7` — `auth: "none"`
- `src/app/api/generate-element-fact/route.ts:13` — `auth: "none"` (need to verify exact line)
- `src/app/api/curated-problems/route.ts:11` — `auth: "none"` (need to verify exact line)
- `src/app/api/engine/test/route.ts:8` — `auth: "none"` (health check — may stay unauthenticated)

The `createRouteHandler` factory supports `auth: "required"` which calls `getAuthenticatedUserId()` and rejects unauthenticated requests.

## Commands you will need

| Purpose   | Command              | Expected on success       |
| --------- | -------------------- | ------------------------- |
| Typecheck | `pnpm run typecheck` | exit 0, no errors         |
| Tests     | `pnpm run test`      | all pass                  |
| Lint      | `pnpm exec oxlint`   | 0 errors on changed files |

## Steps

### Step 1: Add auth to solve, generate, element-fact, and curated-problems

Change `auth: "none"` to `auth: "required"` in each of these four routes. The `engine/test` route is a health check and should remain `auth: "none"`.

Files to modify:

- `src/app/api/solve/route.ts:14` — change to `auth: "required"`
- `src/app/api/engine/generate/route.ts:7` — change to `auth: "required"`
- `src/app/api/generate-element-fact/route.ts` — change to `auth: "required"`
- `src/app/api/curated-problems/route.ts` — change to `auth: "required"`

**Verify**: `grep -rn 'auth: "none"' src/app/api/solve/ src/app/api/engine/generate/ src/app/api/generate-element-fact/ src/app/api/curated-problems/` → 0 matches

### Step 2: Verify the execute callbacks handle userId correctly

Each route's `execute` callback receives `{ body, userId }`. Confirm that `userId` is already being passed to the service layer (it should be, since budget tracking already uses it). If any route ignores `userId`, thread it through.

**Verify**: `pnpm run typecheck` → exit 0

### Step 3: Run tests

**Verify**: `pnpm run test` → all pass
**Verify**: `pnpm exec oxlint src/app/api/solve/route.ts src/app/api/engine/generate/route.ts src/app/api/generate-element-fact/route.ts src/app/api/curated-problems/route.ts` → 0 errors

## Done criteria

- [ ] Four routes changed from `auth: "none"` to `auth: "required"`
- [ ] `engine/test` remains `auth: "none"` (health check)
- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] `plans/README.md` status row updated

## STOP conditions

- The anonymous-budget fallback in `with-budget.ts` requires `auth: "none"` to function
- Changing auth breaks the daily bolt (quick quiz) flow which may not have a session
