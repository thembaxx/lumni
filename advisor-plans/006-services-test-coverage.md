# Advisor Plan 006: Add characterization tests for 10 untested services

> **Source**: Audit finding TEST-01
> **Priority**: P2
> **Effort**: M (medium — 1-2 days for all 10)
> **Risk**: MED — these are core business logic services; tests protect against regressions
> **Confidence**: HIGH (gap is confirmed)
> **Depends on**: none (services are independent)

## Why this matters

Services extracted in Sessions 37-38 (architectural deepening) have 0 test coverage. These are the "adjacent possible" after route consolidation — core business logic that analytics, push, study planning, and AI features depend on. Without tests, regressions in these services are only caught in E2E (slow) or production.

## The untested services (10 total)

Priority-ordered by risk × impact:

### Tier 1 — Core business logic (do first)

| #   | Service                    | Why it matters                                                                  | Risk                                               |
| --- | -------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------- |
| 1   | `analytics-service.ts`     | `SessionStore` interface powers trends + comparative routes (~50-90 lines each) | HIGH — data aggregator, wrong math = wrong charts  |
| 2   | `push-delivery.ts`         | `PushDeliveryService` with lazy VAPID init, `sendToUser()` / `sendToAll()`      | HIGH — push is user-facing, failures are invisible |
| 3   | `study-planner-service.ts` | State/sync/mutations for the study planner                                      | HIGH — generates study plans students follow       |
| 4   | `quiz-result-processor.ts` | HAS tests already (Plan 005, Session 37-38)                                     | ✅ Already covered                                 |

### Tier 2 — Medium risk (important but less fragile)

| #   | Service                   | Why it matters                                   | Risk                                                  |
| --- | ------------------------- | ------------------------------------------------ | ----------------------------------------------------- |
| 5   | `notification-service.ts` | Local + push notification scheduling, schedulers | MED — degraded UX but no data loss                    |
| 6   | `curated-problems.ts`     | Problem selection logic                          | MED — still shows problems, may show wrong ones       |
| 7   | `user-consent-service.ts` | Data sharing consent gating                      | MED — consent affects RAG pipeline privacy compliance |
| 8   | `web-search-service.ts`   | Web search result formatting                     | MED — wrapper around fetch, mostly pass-through       |

### Tier 3 — Lower risk (thin wrappers)

| #   | Service                  | Why it matters                 | Risk                                           |
| --- | ------------------------ | ------------------------------ | ---------------------------------------------- |
| 9   | `leaderboard-service.ts` | Social leaderboard computation | LOW — cosmetic feature, no data integrity risk |
| 10  | `element-fact.ts`        | Element fact generation        | LOW — educational content, no system impact    |
| 11  | `ai-planner-enricher.ts` | AI enrichment for study plans  | LOW — enrichment is optional, fails open       |
| 12  | `chat-image.ts`          | Image handling in chat         | LOW — thin wrapper                             |

## Test patterns to follow

Each service test should follow the pattern from `src/lib/services/__tests__/quiz-result-processor.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { MyService } from "../my-service";
import type { DataAccess } from "@/lib/db/data-access";

// Mock DataAccess
const mockDb = {} as DataAccess;

describe("MyService", () => {
  it("should handle success case", async () => {
    const service = new MyService({ db: mockDb });
    const result = await service.someMethod();
    expect(result).toEqual(expected);
  });

  it("should handle error case", async () => {
    // Test error handling
  });

  it("should handle empty data", async () => {
    // Test edge case
  });
});
```

## Characterization test approach

For each service:

1. **Read the file** — understand its public API (exported functions/classes)
2. **Identify main code paths** — success, error, empty, edge cases
3. **Write 3-5 tests per service** covering the main paths
4. **Use mocks for dependencies** — DataAccess, fetch, web-push, etc.
5. **Existing test infrastructure** — vitest, tsconfig.test.json

## Steps

1. Create `src/lib/services/__tests__/` if not exists (it may already have quiz-result-processor tests)
2. For each Tier 1 service (analytics, push, study-planner): write 4-6 tests
3. For each Tier 2 service: write 3-4 tests
4. For each Tier 3 service: write 2-3 tests
5. `pnpm run typecheck` → exit 0
6. `pnpm run test` → all pass (expect ~30+ new tests)

## Done criteria

- [ ] All 10 untested services have at least basic characterization tests
- [ ] Tier 1 services have 4-6 tests each covering success, error, empty paths
- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0 (all new + existing pass)
- [ ] No regressions — existing behavior is preserved
