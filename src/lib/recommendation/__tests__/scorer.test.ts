import { describe, expect, it } from "vitest";
import { getRankedRecommendations } from "../scorer";

function mockDeps(overrides: Record<string, unknown> = {}) {
  return {
    getDueCardsCount: async () => (overrides.dueCards as number) ?? 0,
    getWeakestTopic: async () =>
      overrides.weakest != null
        ? (overrides.weakest as { subject: string; topic: string; score: number })
        : null,
    getUpcomingExam: async () =>
      overrides.exam != null
        ? (overrides.exam as { subject: string; daysUntil: number })
        : null,
    getStudyPlanAdherence: async () => (overrides.adherence as number) ?? 0,
    getHoursSinceLastPractice: async () => (overrides.hoursSince as number) ?? 48,
  };
}

describe("getRankedRecommendations", () => {
  it("returns exam-practice when exam is within 30 days", async () => {
    const recs = await getRankedRecommendations("user1", mockDeps({ exam: { subject: "Math", daysUntil: 5 } }));
    expect(recs.length).toBeGreaterThan(0);
    expect(recs.some((r) => r.kind === "exam-practice")).toBe(true);
    expect(recs[0].kind).toBe("exam-practice");
  });

  it("does not include exam-practice when exam is over 30 days away", async () => {
    const recs = await getRankedRecommendations("user1", mockDeps({ exam: { subject: "Math", daysUntil: 45 } }));
    expect(recs.every((r) => r.kind !== "exam-practice")).toBe(true);
  });

  it("returns weakest-topic when topic score is below 60", async () => {
    const recs = await getRankedRecommendations(
      "user1",
      mockDeps({ weakest: { subject: "Physics", topic: "Waves", score: 40 } }),
    );
    expect(recs.some((r) => r.kind === "weakest-topic")).toBe(true);
  });

  it("does not include weakest-topic when score is 60+", async () => {
    const recs = await getRankedRecommendations(
      "user1",
      mockDeps({ weakest: { subject: "Physics", topic: "Waves", score: 70 } }),
    );
    expect(recs.every((r) => r.kind !== "weakest-topic")).toBe(true);
  });

  it("returns due-cards when count > 0", async () => {
    const recs = await getRankedRecommendations("user1", mockDeps({ dueCards: 8 }));
    expect(recs.some((r) => r.kind === "due-cards")).toBe(true);
  });

  it("ranks exam-practice above due-cards when exam is near", async () => {
    const recs = await getRankedRecommendations(
      "user1",
      mockDeps({ exam: { subject: "Math", daysUntil: 3 }, dueCards: 5, weakest: { subject: "Physics", topic: "Optics", score: 35 } }),
    );
    expect(recs.length).toBeGreaterThanOrEqual(2);
    expect(recs[0].kind).toBe("exam-practice");
  });

  it("returns empty array when no signals are present", async () => {
    const recs = await getRankedRecommendations("user1", mockDeps({ dueCards: 0, hoursSince: 0 }));
    expect(recs).toHaveLength(0);
  });

  it("respects the limit parameter", async () => {
    const recs = await getRankedRecommendations(
      "user1",
      mockDeps({
        exam: { subject: "Math", daysUntil: 10 },
        weakest: { subject: "Physics", topic: "Kinematics", score: 30 },
        dueCards: 15,
        hoursSince: 72,
      }),
      2,
    );
    expect(recs.length).toBeLessThanOrEqual(2);
  });

  it("sorts results by descending score", async () => {
    const recs = await getRankedRecommendations(
      "user1",
      mockDeps({
        exam: { subject: "Bio", daysUntil: 2 },
        weakest: { subject: "Chem", topic: "Bonding", score: 55 },
        dueCards: 3,
        hoursSince: 24,
      }),
    );
    for (let i = 1; i < recs.length; i++) {
      expect(recs[i].score).toBeLessThanOrEqual(recs[i - 1].score);
    }
  });
});
