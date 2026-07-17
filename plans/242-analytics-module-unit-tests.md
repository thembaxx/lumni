# Plan 242: Add analytics module unit tests — 716 lines of untested math

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: none
- **Category**: test
- **Generated at**: 2026-07-17

## Why this matters

The analytics module is responsible for trend computation, comparative analysis, and risk modelling — all of which feed the dashboard, teacher alerts, and retention features. `computeTrends` divides by `mid` (midpoint index) and `.slice(mid).length` without guarding against 0 or 1. `computeComparative` divides by `otherUsers.length` which can be 0. The risk model has 4 factor functions with complex boundary logic. A single division-by-zero or NaN propagates silently into the UI as a blank chart or incorrect alert. Despite 716 lines of untested math, there are zero tests.

## Current state

- `src/lib/analytics/analytics-service.ts` (283 lines) — `computeTrends()`, `computeComparative()`, `getSessionStats()`, no `__tests__/` directory
- `src/lib/analytics/risk-model.ts` (433 lines) — `calculateRiskScore()`, `retentionRiskFactor()`, `engagementRiskFactor()`, `performanceRiskFactor()`, `consistencyRiskFactor()`, no `__tests__/` directory
- Both files exported from `src/lib/analytics/index.ts` barrel
- `computeTrends` has a `mid = Math.floor(sessions.length / 2)` and then `sessions.slice(mid).length` — when `sessions.length` is 0 or 1, `mid` is 0 and the second half has 0 or 1 elements, producing division by 0 or a misleading trend

## Target state

Two test files covering:

- `analytics-service.test.ts`: trend with 0/1/2/3+ sessions, comparative with 0/1/multiple users, edge cases on empty data
- `risk-model.test.ts`: each risk factor tested with boundary values (0, 0.5, 1.0), null/undefined inputs, risk score composition

## Scope

- `src/lib/analytics/__tests__/analytics-service.test.ts` (new)
- `src/lib/analytics/__tests__/risk-model.test.ts` (new)
- No changes to production code unless a division-by-zero bug is found

## Steps

### 1. Create analytics service test file

Create `src/lib/analytics/__tests__/analytics-service.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import { AnalyticsService } from "../analytics-service";

describe("AnalyticsService", () => {
  describe("computeTrends", () => {
    it("returns empty trend for 0 sessions", () => {
      const result = AnalyticsService.computeTrends([]);
      expect(result.trend).toBe("stable");
      expect(result.percentage).toBe(0);
    });

    it("returns stable for 1 session (insufficient data)", () => {
      const session = { score: 70, total: 100, date: Date.now() };
      const result = AnalyticsService.computeTrends([session]);
      expect(result.trend).toBe("stable");
      expect(result.percentage).toBe(0);
    });

    it("detects improving trend with 2+ sessions", () => {
      const sessions = [
        { score: 30, total: 100, date: Date.now() - 86400000 },
        { score: 50, total: 100, date: Date.now() },
        { score: 80, total: 100, date: Date.now() + 86400000 },
      ];
      const result = AnalyticsService.computeTrends(sessions);
      expect(result.trend).toBe("improving");
      expect(result.percentage).toBeGreaterThan(0);
    });

    it("detects declining trend", () => {
      const sessions = [
        { score: 80, total: 100, date: Date.now() - 86400000 },
        { score: 50, total: 100, date: Date.now() },
        { score: 30, total: 100, date: Date.now() + 86400000 },
      ];
      const result = AnalyticsService.computeTrends(sessions);
      expect(result.trend).toBe("declining");
      expect(result.percentage).toBeLessThan(0);
    });
  });

  describe("computeComparative", () => {
    it("returns baseline for 0 other users", () => {
      const result = AnalyticsService.computeComparative(
        { userId: "u1", score: 75, total: 100 },
        [],
      );
      expect(result.percentile).toBe(50); // or whatever baseline makes sense
    });

    it("returns 50th percentile when matching single user", () => {
      const result = AnalyticsService.computeComparative({ userId: "u1", score: 75, total: 100 }, [
        { userId: "u2", avgScore: 75, sessionCount: 5 },
      ]);
      expect(result.percentile).toBe(50);
    });

    it("handles many users returning correct percentile", () => {
      const result = AnalyticsService.computeComparative({ userId: "u1", score: 90, total: 100 }, [
        { userId: "u2", avgScore: 50, sessionCount: 5 },
        { userId: "u3", avgScore: 60, sessionCount: 3 },
        { userId: "u4", avgScore: 70, sessionCount: 8 },
      ]);
      expect(result.percentile).toBeGreaterThan(50);
    });
  });
});
```

Adjust function signatures to match the actual exports — read `analytics-service.ts` first to confirm.

### 2. Create risk model test file

Create `src/lib/analytics/__tests__/risk-model.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  calculateRiskScore,
  retentionRiskFactor,
  engagementRiskFactor,
  performanceRiskFactor,
  consistencyRiskFactor,
} from "../risk-model";

describe("retentionRiskFactor", () => {
  it("returns high risk for 0-day streak", () => {
    const risk = retentionRiskFactor({ streak: 0, daysSinceLastVisit: 7 });
    expect(risk.level).toBe("high");
    expect(risk.score).toBeGreaterThan(0.7);
  });

  it("returns low risk for long streak", () => {
    const risk = retentionRiskFactor({ streak: 30, daysSinceLastVisit: 0 });
    expect(risk.level).toBe("low");
    expect(risk.score).toBeLessThan(0.3);
  });

  it("handles null/undefined gracefully", () => {
    expect(retentionRiskFactor(null as any).score).toBeDefined();
    expect(retentionRiskFactor(undefined as any).score).toBeDefined();
  });
});

describe("engagementRiskFactor", () => {
  it("returns high risk for 0 sessions this week", () => {
    const risk = engagementRiskFactor({ sessionsThisWeek: 0, sessionsLastWeek: 5 });
    expect(risk.level).toBe("high");
  });

  it("returns low risk for consistent sessions", () => {
    const risk = engagementRiskFactor({ sessionsThisWeek: 5, sessionsLastWeek: 5 });
    expect(risk.level).toBe("low");
  });
});

describe("performanceRiskFactor", () => {
  it("returns high risk for declining scores", () => {
    const risk = performanceRiskFactor({ currentAvg: 40, previousAvg: 70 });
    expect(risk.level).toBe("high");
  });
});

describe("consistencyRiskFactor", () => {
  it("returns high risk for irregular study pattern", () => {
    const risk = consistencyRiskFactor({ gapDays: [3, 1, 14, 2, 21], targetIntervalDays: 2 });
    expect(risk.level).toBe("high");
  });
});

describe("calculateRiskScore", () => {
  it("aggregates all factors into a composite score", () => {
    const score = calculateRiskScore({
      streak: 0,
      daysSinceLastVisit: 7,
      sessionsThisWeek: 1,
      sessionsLastWeek: 5,
      currentAvg: 40,
      previousAvg: 70,
      gapDays: [14, 7, 21],
      targetIntervalDays: 2,
    });
    expect(score).toHaveProperty("overall");
    expect(score).toHaveProperty("factors");
    expect(score.overall).toBeGreaterThanOrEqual(0);
    expect(score.overall).toBeLessThanOrEqual(1);
  });

  it("handles null data gracefully", () => {
    const score = calculateRiskScore(null as any);
    expect(score.overall).toBeDefined();
    expect(Number.isFinite(score.overall)).toBe(true);
  });
});
```

### 3. Verify

```bash
pnpm test -- src/lib/analytics/__tests__/
pnpm run typecheck
pnpm exec biome check src/lib/analytics/__tests__/
```

## Test plan

~15 test cases across 2 files:

**analytics-service.test.ts (5-6 cases)**:

1. `computeTrends` with 0 sessions
2. `computeTrends` with 1 session (insufficient data)
3. `computeTrends` with improving trend
4. `computeTrends` with declining trend
5. `computeComparative` with 0 other users
6. `computeComparative` with multiple users

**risk-model.test.ts (7-9 cases)**:

1. `retentionRiskFactor` high/low/null
2. `engagementRiskFactor` high/low
3. `performanceRiskFactor` high
4. `consistencyRiskFactor` high
5. `calculateRiskScore` aggregate with data
6. `calculateRiskScore` with null data
7. Edge: all risk factors with boundary scores

## Done criteria

- [ ] `pnpm test -- src/lib/analytics/__tests__/` passes (15+ tests)
- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm exec biome check` passes on new files
- [ ] `plans/README.md` status row updated

## STOP conditions

- If division-by-zero is discovered in `computeTrends` or `computeComparative` when processing real data (not just test edge cases), switch to Plan P1 bugfix mode: fix the production code first, then add tests
- If the function signatures have different parameters than described (especially if they're class methods with DI), adjust test approach to instantiate the class properly
- If `risk-model.ts` depends on Dexie queries internally (rather than being pure functions taking data), the unit testing approach needs revision

## Estimated time

3-4 hours
