import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ReEngagementService } from "../re-engagement-service";
import { InMemoryDataAccess } from "@/lib/db/in-memory-data-access";

function makeService() {
  const db = new InMemoryDataAccess();
  return { service: new ReEngagementService({ db }), db };
}

describe("ReEngagementService", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-10T14:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getInactiveSubjects", () => {
    it("returns empty array when no events exist", async () => {
      const { service } = makeService();
      expect(await service.getInactiveSubjects("u1")).toEqual([]);
    });

    it("returns empty when user was active recently", async () => {
      const { service, db } = makeService();
      const twoDaysAgo = Date.now() - 2 * 86_400_000;
      db.analyticsEvents.seed([
        {
          id: 1,
          userId: "u1",
          eventType: "session_start",
          metadata: JSON.stringify({ subject: "Mathematics" }),
          timestamp: twoDaysAgo,
        },
      ]);
      expect(await service.getInactiveSubjects("u1")).toEqual([]);
    });

    it("returns inactive subjects when no activity in 3+ days", async () => {
      const { service, db } = makeService();
      const fiveDaysAgo = Date.now() - 5 * 86_400_000;
      db.analyticsEvents.seed([
        {
          id: 1,
          userId: "u1",
          eventType: "session_start",
          metadata: JSON.stringify({ subject: "Mathematics" }),
          timestamp: fiveDaysAgo,
        },
      ]);
      const result = await service.getInactiveSubjects("u1");
      expect(result).toHaveLength(1);
      expect(result[0].subject).toBe("Mathematics");
      expect(result[0].daysSinceLastActive).toBe(5);
    });

    it("ignores events older than 30 days", async () => {
      const { service, db } = makeService();
      db.analyticsEvents.seed([
        {
          id: 1,
          userId: "u1",
          eventType: "session_start",
          metadata: JSON.stringify({ subject: "Mathematics" }),
          timestamp: Date.now() - 35 * 86_400_000,
        },
      ]);
      expect(await service.getInactiveSubjects("u1")).toEqual([]);
    });

    it("filters by userId", async () => {
      const { service, db } = makeService();
      const fiveDaysAgo = Date.now() - 5 * 86_400_000;
      db.analyticsEvents.seed([
        {
          id: 1,
          userId: "u1",
          eventType: "session_start",
          metadata: JSON.stringify({ subject: "Math" }),
          timestamp: fiveDaysAgo,
        },
        {
          id: 2,
          userId: "u2",
          eventType: "session_start",
          metadata: JSON.stringify({ subject: "Science" }),
          timestamp: Date.now() - 1,
        },
      ]);
      const result = await service.getInactiveSubjects("u1");
      expect(result).toHaveLength(1);
      expect(result[0].subject).toBe("Math");
    });
  });

  describe("getOptimalSendTime", () => {
    it("returns evening when all hours have equal activity", () => {
      const { service } = makeService();
      const events = Array.from({ length: 24 }, (_, h) => ({
        id: h,
        userId: "u1",
        eventType: "session_start" as const,
        timestamp: new Date(`2026-07-10T${h.toString().padStart(2, "0")}:00:00Z`).getTime(),
      }));
      expect(service.getOptimalSendTime(events)).toBe("evening");
    });

    it("defaults to morning for empty events", () => {
      const { service } = makeService();
      expect(service.getOptimalSendTime([])).toBe("morning");
    });

    it("ignores non-session events", () => {
      const { service } = makeService();
      const events = [
        {
          id: 1,
          userId: "u1",
          eventType: "day_active" as const,
          timestamp: new Date("2026-07-10T08:00:00Z").getTime(),
        },
      ];
      expect(service.getOptimalSendTime(events)).toBe("morning");
    });
  });

  describe("generateMessage", () => {
    it("returns morning-streak when morning and streak > 3", () => {
      vi.setSystemTime(new Date("2026-07-10T09:00:00Z"));
      const { service } = makeService();
      const result = service.generateMessage("u1", "Mathematics", 5, 5);
      expect(result.templateKey).toBe("morning-streak");
    });

    it("returns afternoon-weakest when afternoon and low competency", () => {
      vi.setSystemTime(new Date("2026-07-10T14:00:00Z"));
      const { service } = makeService();
      const result = service.generateMessage("u1", "Mathematics", 5, 0, "Algebra", 45);
      expect(result.templateKey).toBe("afternoon-weakest");
    });

    it("returns evening-challenge when evening", () => {
      vi.setSystemTime(new Date("2026-07-10T19:00:00Z"));
      const { service } = makeService();
      const result = service.generateMessage("u1", "Mathematics", 5);
      expect(result.templateKey).toBe("evening-challenge");
    });

    it("returns dormant-two-weeks for > 14 days", () => {
      vi.setSystemTime(new Date("2026-07-10T03:00:00Z"));
      const { service } = makeService();
      const result = service.generateMessage("u1", "Mathematics", 15);
      expect(result.templateKey).toBe("dormant-two-weeks");
    });

    it("returns dormant-week for > 7 days", () => {
      vi.setSystemTime(new Date("2026-07-10T03:00:00Z"));
      const { service } = makeService();
      const result = service.generateMessage("u1", "Mathematics", 10);
      expect(result.templateKey).toBe("dormant-week");
    });

    it("returns generic-reminder as fallback", () => {
      vi.setSystemTime(new Date("2026-07-10T03:00:00Z"));
      const { service } = makeService();
      const result = service.generateMessage("u1", "Mathematics", 3);
      expect(result.templateKey).toBe("generic-reminder");
    });
  });

  describe("checkAndNotify", () => {
    it("returns notified: false when no inactive subjects", async () => {
      const { service } = makeService();
      const result = await service.checkAndNotify("u1");
      expect(result.notified).toBe(false);
    });

    it("returns notified: true with message when subject inactive", async () => {
      const { service, db } = makeService();
      vi.setSystemTime(new Date("2026-07-10T03:00:00Z"));
      db.analyticsEvents.seed([
        {
          id: 1,
          userId: "u1",
          eventType: "session_start",
          metadata: JSON.stringify({ subject: "Mathematics" }),
          timestamp: Date.now() - 10 * 86_400_000,
        },
      ]);
      const result = await service.checkAndNotify("u1");
      expect(result.notified).toBe(true);
      expect(result.message).toBeTruthy();
      expect(result.deepLink).toBeTruthy();
    });
  });
});
