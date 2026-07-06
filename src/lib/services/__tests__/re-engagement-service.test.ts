import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { InMemoryDataAccess } from "@/lib/db";
import { ReEngagementService } from "@/lib/services/re-engagement-service";

vi.mock("@/lib/shared/logger", () => ({ logError: () => {} }));

describe("ReEngagementService", () => {
  let db: InMemoryDataAccess;
  let service: ReEngagementService;

  beforeEach(() => {
    db = new InMemoryDataAccess();
    service = new ReEngagementService({ db });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getInactiveSubjects", () => {
    test("returns empty array when user has no events", async () => {
      const result = await service.getInactiveSubjects("user-1");
      expect(result).toEqual([]);
    });

    test("returns empty array when user is active within 3 days", async () => {
      const now = Date.now();
      db.analyticsEvents.seed([
        {
          id: 1,
          eventType: "session_start",
          userId: "user-1",
          metadata: JSON.stringify({ subject: "Mathematics" }),
          timestamp: now - 86_400_000,
        },
        {
          id: 2,
          eventType: "session_start",
          userId: "user-1",
          metadata: JSON.stringify({ subject: "Physics" }),
          timestamp: now - 2 * 86_400_000,
        },
      ]);

      const result = await service.getInactiveSubjects("user-1");
      expect(result).toEqual([]);
    });

    test("returns subjects not studied in 3+ days", async () => {
      const now = Date.now();
      db.analyticsEvents.seed([
        {
          id: 1,
          eventType: "session_start",
          userId: "user-1",
          metadata: JSON.stringify({ subject: "Active" }),
          timestamp: now - 86_400_000,
        },
        {
          id: 2,
          eventType: "session_start",
          userId: "user-1",
          metadata: JSON.stringify({ subject: "Dormant" }),
          timestamp: now - 5 * 86_400_000,
        },
      ]);

      const result = await service.getInactiveSubjects("user-1");
      expect(result).toHaveLength(1);
      expect(result[0].subject).toBe("Dormant");
      expect(result[0].daysSinceLastActive).toBeGreaterThanOrEqual(5);
    });

    test("filters to session_start events only", async () => {
      const now = Date.now();
      db.analyticsEvents.seed([
        {
          id: 1,
          eventType: "session_end",
          userId: "user-1",
          metadata: JSON.stringify({ subject: "Old" }),
          timestamp: now - 10 * 86_400_000,
        },
        {
          id: 2,
          eventType: "day_active",
          userId: "user-1",
          metadata: undefined,
          timestamp: now - 86_400_000,
        },
      ]);

      const result = await service.getInactiveSubjects("user-1");
      expect(result).toEqual([]);
    });
  });

  describe("getOptimalSendTime", () => {
    test("returns morning when most sessions are in morning hours", () => {
      const events = Array.from({ length: 5 }, (_, i) => ({
        id: i,
        eventType: "session_start" as const,
        userId: "user-1",
        timestamp: new Date(2026, 0, 1, 9, 0, 0).getTime(),
      }));

      const result = service.getOptimalSendTime(events);
      expect(result).toBe("morning");
    });

    test("returns afternoon when most sessions are in afternoon", () => {
      const events = Array.from({ length: 5 }, (_, i) => ({
        id: i,
        eventType: "session_start" as const,
        userId: "user-1",
        timestamp: new Date(2026, 0, 1, 14, 0, 0).getTime(),
      }));

      const result = service.getOptimalSendTime(events);
      expect(result).toBe("afternoon");
    });

    test("returns evening when most sessions are in evening", () => {
      const events = Array.from({ length: 5 }, (_, i) => ({
        id: i,
        eventType: "session_start" as const,
        userId: "user-1",
        timestamp: new Date(2026, 0, 1, 20, 0, 0).getTime(),
      }));

      const result = service.getOptimalSendTime(events);
      expect(result).toBe("evening");
    });
  });

  describe("generateMessage", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    test("returns morning-streak template when morning and streak > 3", () => {
      vi.setSystemTime(new Date(2026, 0, 1, 9, 0, 0));
      const result = service.generateMessage("user-1", "Mathematics", 5, 10);
      expect(result.templateKey).toBe("morning-streak");
      expect(result.message).toContain("Mathematics");
    });

    test("returns afternoon-weakest template when afternoon and competency < 60%", () => {
      vi.setSystemTime(new Date(2026, 0, 1, 14, 0, 0));
      const result = service.generateMessage("user-1", "Mathematics", 3, 1, "Algebra", 45);
      expect(result.templateKey).toBe("afternoon-weakest");
      expect(result.message).toContain("Algebra");
    });

    test("returns evening-challenge template in evening", () => {
      vi.setSystemTime(new Date(2026, 0, 1, 19, 0, 0));
      const result = service.generateMessage("user-1", "Mathematics", 3);
      expect(result.templateKey).toBe("evening-challenge");
      expect(result.message).toBe("Today's challenge is ready");
    });

    test("returns dormant-week template for 7+ days inactive", () => {
      vi.setSystemTime(new Date(2026, 0, 1, 1, 0, 0));
      const result = service.generateMessage("user-1", "Mathematics", 8);
      expect(result.templateKey).toBe("dormant-week");
      expect(result.message).toContain("Mathematics");
    });

    test("returns dormant-two-weeks template for 14+ days inactive", () => {
      vi.setSystemTime(new Date(2026, 0, 1, 1, 0, 0));
      const result = service.generateMessage("user-1", "Mathematics", 15);
      expect(result.templateKey).toBe("dormant-two-weeks");
    });

    test("returns generic-reminder when no template matches", () => {
      vi.setSystemTime(new Date(2026, 0, 1, 1, 0, 0));
      const result = service.generateMessage("user-1", "Mathematics", 4);
      expect(result.templateKey).toBe("generic-reminder");
    });
  });

  describe("checkAndNotify", () => {
    test("returns notified=false when user is active", async () => {
      const now = Date.now();
      db.analyticsEvents.seed([
        {
          id: 1,
          eventType: "session_start",
          userId: "user-1",
          metadata: JSON.stringify({ subject: "Math" }),
          timestamp: now - 86_400_000,
        },
      ]);

      const result = await service.checkAndNotify("user-1");
      expect(result.notified).toBe(false);
    });

    test("returns notified=true with message for inactive user", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 0, 1, 1, 0, 0));
      const fakeNow = Date.now();

      db.analyticsEvents.seed([
        {
          id: 1,
          eventType: "session_start",
          userId: "user-1",
          metadata: JSON.stringify({ subject: "Math" }),
          timestamp: fakeNow - 5 * 86_400_000,
        },
      ]);

      const result = await service.checkAndNotify("user-1");
      expect(result.notified).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.deepLink).toBeDefined();

      vi.useRealTimers();
    });
  });
});
