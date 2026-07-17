import { describe, expect, it } from "vitest";
import type { CompetencyRecord } from "@/lib/competency-engine/types";
import {
  detectWeakTopics,
  computeCompetencyGaps,
  projectAps,
  calculateConfidence,
  generateSessions,
  type TopicGap,
  type CompetencyGap,
} from "../adaptive-planner";

function makeCompetency(
  overrides: Partial<CompetencyRecord> & { subjectId: string; topicId: string },
): CompetencyRecord {
  return {
    score: 50,
    attempts: 1,
    lastAssessed: Date.now(),
    level: "developing",
    bloomLevel: "apply" as const,
    ...overrides,
  };
}

describe("detectWeakTopics", () => {
  it("returns empty array for empty competencies", () => {
    expect(detectWeakTopics([])).toEqual([]);
  });

  it("marks topics below target score as weak", () => {
    const competences = [
      makeCompetency({ subjectId: "math", topicId: "algebra", score: 30, level: "novice" }),
    ];
    const gaps = detectWeakTopics(competences);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].topicId).toBe("algebra");
    expect(gaps[0].gap).toBe(40);
  });

  it("skips topics meeting target score", () => {
    const competences = [
      makeCompetency({ subjectId: "math", topicId: "algebra", score: 90, level: "mastered" }),
    ];
    expect(detectWeakTopics(competences)).toHaveLength(0);
  });

  it("skips entries without topicId", () => {
    const competences = [
      {
        subjectId: "math",
        topicId: "",
        score: 30,
        attempts: 1,
        lastAssessed: Date.now(),
        level: "novice" as const,
        bloomLevel: "apply" as const,
      },
    ];
    expect(detectWeakTopics(competences)).toHaveLength(0);
  });

  it("sorts by gap descending", () => {
    const competences = [
      makeCompetency({ subjectId: "math", topicId: "calc", score: 60, level: "proficient" }),
      makeCompetency({ subjectId: "math", topicId: "trig", score: 20, level: "novice" }),
      makeCompetency({ subjectId: "math", topicId: "stats", score: 45, level: "developing" }),
    ];
    const gaps = detectWeakTopics(competences);
    expect(gaps.map((g) => g.topicId)).toEqual(["trig", "stats", "calc"]);
  });
});

describe("computeCompetencyGaps", () => {
  it("groups by subject and computes average", () => {
    const competences = [
      makeCompetency({ subjectId: "math", topicId: "a", score: 50 }),
      makeCompetency({ subjectId: "math", topicId: "b", score: 70 }),
      makeCompetency({ subjectId: "eng", topicId: "c", score: 80 }),
    ];
    const gaps = computeCompetencyGaps(competences, []);
    const mathGap = gaps.find((g) => g.subjectId === "math");
    expect(mathGap?.avgScore).toBe(60);
    const engGap = gaps.find((g) => g.subjectId === "eng");
    expect(engGap?.avgScore).toBe(80);
  });

  it("sorts by avgScore ascending", () => {
    const competences = [
      makeCompetency({ subjectId: "eng", topicId: "a", score: 80 }),
      makeCompetency({ subjectId: "math", topicId: "b", score: 50 }),
    ];
    const gaps = computeCompetencyGaps(competences, []);
    expect(gaps[0].subjectId).toBe("math");
    expect(gaps[1].subjectId).toBe("eng");
  });
});

describe("projectAps", () => {
  it("returns weighted average of competency gaps", () => {
    const gaps: CompetencyGap[] = [
      { subjectId: "math", subjectName: "Math", avgScore: 80, topicCount: 2, weakTopics: [] },
      { subjectId: "english", subjectName: "English", avgScore: 60, topicCount: 1, weakTopics: [] },
    ];
    const aps = projectAps(gaps);
    expect(aps).toBeGreaterThan(0);
    expect(aps).toBeLessThanOrEqual(100);
  });

  it("returns 50 for no data", () => {
    expect(projectAps([])).toBe(50);
  });
});

describe("calculateConfidence", () => {
  it("returns 0 for no competencies", () => {
    expect(calculateConfidence([])).toBe(0);
  });

  it("increases with more competencies", () => {
    const oneCompetency = [makeCompetency({ subjectId: "m", topicId: "t", score: 50 })];
    const tenCompetencies = Array.from({ length: 10 }, (_, i) =>
      makeCompetency({ subjectId: "m", topicId: `t${i}`, score: 50 }),
    );
    expect(calculateConfidence(tenCompetencies)).toBeGreaterThan(
      calculateConfidence(oneCompetency),
    );
  });
});

describe("generateSessions", () => {
  it("allocates sessions for weak topics across weekdays", () => {
    const gaps: TopicGap[] = [
      { subjectId: "math", topicId: "algebra", currentScore: 30, gap: 40 },
      { subjectId: "eng", topicId: "grammar", currentScore: 40, gap: 30 },
    ];
    const competencyGaps: CompetencyGap[] = [
      { subjectId: "math", subjectName: "Math", avgScore: 30, topicCount: 1, weakTopics: gaps },
    ];
    const startDate = new Date("2026-07-20");
    const sessions = generateSessions(gaps, competencyGaps, 30, 5, startDate);

    expect(sessions.length).toBeGreaterThan(0);
    for (const s of sessions) {
      expect(s.durationMinutes).toBeGreaterThan(0);
      expect(s.subjectId).toBeTruthy();
      expect(s.topicId).toBeTruthy();
    }
  });

  it("returns empty sessions for empty gaps", () => {
    const sessions = generateSessions([], [], 30, 5, new Date());
    expect(sessions).toHaveLength(0);
  });

  it("respects weekdays-only scheduling", () => {
    const gaps: TopicGap[] = [{ subjectId: "math", topicId: "algebra", currentScore: 30, gap: 40 }];
    const startDate = new Date("2026-07-18");
    const sessions = generateSessions(gaps, [], 30, 3, startDate);
    const saturdaySessions = sessions.filter((s) => {
      const d = new Date(s.scheduledDate);
      return d.getDay() === 6 || d.getDay() === 0;
    });
    expect(saturdaySessions).toHaveLength(0);
  });
});
