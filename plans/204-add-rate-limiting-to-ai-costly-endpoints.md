# Plan 204: Add rate limiting to 9 AI-costly POST endpoints

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: MEDIUM
- **Depends on**: none
- **Category**: security
- **Generated at**: 2026-07-17

## Why this matters

Nine POST endpoints that trigger AI generation or expensive computation are missing rate limiting. An attacker (or buggy client) could hammer these endpoints and exhaust the AI budget, leading to denied service for legitimate users or unexpected costs. The `createRouteHandler` factory already supports `useRateLimit: true` — these routes just need the opt-in flag and appropriate per-endpoint thresholds.

## Current state

The following routes use `createRouteHandler` (or equivalent) without `useRateLimit: true`:

1. `src/app/api/engine/knowledge-graph/route.ts`
2. `src/app/api/engine/study-guide/route.ts`
3. `src/app/api/engine/generate-story/route.ts`
4. `src/app/api/engine/import-story/route.ts`
5. `src/app/api/engine/adaptive-plan/route.ts`
6. `src/app/api/search/web/route.ts`
7. `src/app/api/jobs/process/route.ts`
8. `src/app/api/payfast/itn/route.ts`
9. `src/app/api/admin/notifications/send/route.ts`

## Target state

All 9 routes have `useRateLimit: true` in their route config with appropriate per-endpoint limits.

## Scope

- All 9 route files listed above

**Out of scope**:

- GET endpoints (covered by a separate audit)
- The rate limiter implementation itself (`src/lib/shared/with-rate-limit.ts`)

## Steps

### 1. Audit each route file

Read each route file to confirm it uses `createRouteHandler` and find the options object where `useRateLimit: true` needs to be added.

### 2. Add `useRateLimit: true` with custom limits

For each route, add `useRateLimit: true` to the handler config. If the factory supports custom limit configuration, set per-endpoint thresholds:

| Endpoint                          | Suggested limit | Rationale                        |
| --------------------------------- | --------------- | -------------------------------- |
| `knowledge-graph` (POST)          | 10/min          | Expensive AI call, cachable      |
| `study-guide` (POST)              | 5/min           | Very expensive (long generation) |
| `generate-story` (POST)           | 5/min           | Expensive AI story generation    |
| `import-story` (POST)             | 10/min          | Moderate cost                    |
| `adaptive-plan` (POST)            | 10/min          | Moderate cost                    |
| `search/web` (POST)               | 30/min          | External API call, per-user      |
| `jobs/process` (POST)             | 20/min          | Background processing            |
| `payfast/itn` (POST)              | 10/min per IP   | Payment callback                 |
| `admin/notifications/send` (POST) | 3/min           | Push notification blast          |

If the factory does not support per-endpoint limits, use the default (whatever `useRateLimit: true` applies).

### 3. Verify

```bash
pnpm run typecheck
pnpm exec oxlint --fix
pnpm run test
```

Run a quick rate-limit test by hitting one of the endpoints 15 times rapidly and confirming the 16th returns 429.

## Stop conditions

- If any route does NOT use `createRouteHandler` and uses a completely different handler pattern — stop and report for that specific route.
- If the `createRouteHandler` factory does not support per-endpoint custom limits — just use `useRateLimit: true` with the default and report.

## Estimated time

45 minutes – 1 hour
