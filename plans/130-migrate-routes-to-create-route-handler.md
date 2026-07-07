# Plan 130: Migrate 11 remaining routes to createRouteHandler

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a79c0e7c..HEAD -- src/app/api/`

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: 127 (chat route migration — do chat separately due to streaming complexity)
- **Category**: tech-debt
- **Planned at**: commit `a79c0e7c`, 2026-07-06

## Why this matters

11 API routes skip `createRouteHandler`, resulting in inconsistent error response shapes, missing security headers, and no rate limiting. The `matric-results` route is public with no rate limit — a scraping target.

## Current state

Routes not using `createRouteHandler`:

1. `src/app/api/quiz-packs/generate/route.ts`
2. `src/app/api/user/export/route.ts`
3. `src/app/api/matric-results/route.ts`
4. `src/app/api/admin/flags/route.ts` (handled by plan 116)
5. `src/app/api/cron/weekly-digest/route.ts`
6. `src/app/api/csp-violation/route.ts`
7. `src/app/api/exam-papers/classify/route.ts`
8. `src/app/api/telemetry/route.ts`
9. `src/app/api/auth/callback/route.ts`
10. `src/app/api/auth/verify/route.ts`
11. `src/app/api/chat/route.ts` (handled by plan 127)

Excluding 116 and 127, that's 9 routes to migrate.

## Commands you will need

| Purpose   | Command              | Expected on success |
| --------- | -------------------- | ------------------- |
| Typecheck | `pnpm run typecheck` | exit 0, no errors   |
| Tests     | `pnpm run test`      | all pass            |

## Steps

### Step 1: Migrate simple routes first

Start with routes that have no streaming, no special response shapes:

1. `matric-results` — add `auth: "none"`, `useRateLimit: true`
2. `user/export` — add `auth: "required"`, `useRateLimit: true`
3. `csp-violation` — already has custom logic, keep as-is but add security headers
4. `telemetry` — proxy route, add `auth: "none"` with rate limit

### Step 2: Migrate auth routes

5. `auth/callback` — complex OAuth flow, keep hand-rolled but add `sanitizeErrorMessage`
6. `auth/verify` — add auth guard

### Step 3: Migrate remaining routes

7. `quiz-packs/generate` — add `auth: "required"`, `budget: "generate"`
8. `exam-papers/classify` — add `auth: "required"`
9. `cron/weekly-digest` — add `auth: "admin"`

### Step 4: Verify

**Verify**: `grep -rn "NextResponse.json" src/app/api/ --include="*.ts" | grep -v "create-route-handler" | grep -v "__tests__"` → count reduced
**Verify**: `pnpm run typecheck` → exit 0
**Verify**: `pnpm run test` → all pass

## Done criteria

- [ ] 9 routes migrated to `createRouteHandler` (or have explicit security headers added)
- [ ] Error response shapes consistent across all routes
- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] `plans/README.md` status row updated

## STOP conditions

- A route has streaming SSE response incompatible with `createRouteHandler`
- The cron route's admin auth check works differently from the standard `auth: "admin"` path
