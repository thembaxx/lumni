import { describe, expect, test } from "vitest";

const { schemaConfig } = await import("../ensure-schema");

describe("ensure-schema", () => {
  test("exports schemaConfig with expected collections", () => {
    const collections = Object.keys(schemaConfig);
    expect(collections).toContain("subjects");
    expect(collections).toContain("topics");
    expect(collections).toContain("questions");
    expect(collections).toContain("user_subjects");
    expect(collections).toContain("user_progress");
    expect(collections).toContain("study_sessions");
    expect(collections).toContain("exam_papers");
    expect(collections).toContain("visuals");
    expect(collections).toContain("competencies");
    expect(collections).toContain("exam_sessions");
    expect(collections).toContain("referral_codes");
    expect(collections).toContain("referrals");
    expect(collections).toContain("study_plans");
    expect(collections).toContain("question_flags");
    expect(collections).toContain("analytics");
  });

  test("each collection has attributes and indexes", () => {
    for (const [, config] of Object.entries(schemaConfig)) {
      expect(config.attributes).toBeDefined();
      expect(config.indexes).toBeDefined();
      expect(Array.isArray(config.indexes)).toBe(true);
      expect(typeof config.attributes).toBe("object");
    }
  });

  test("subjects has unique code index", () => {
    const subjects = schemaConfig.subjects;
    expect(subjects.attributes.name.required).toBe(true);
    expect(subjects.attributes.code.required).toBe(true);
    expect(subjects.indexes).toContainEqual({
      key: "idx_subjects_code",
      type: "unique",
      attributes: ["code"],
    });
  });

  test("competencies has userId required", () => {
    const competencies = schemaConfig.competencies;
    expect(competencies.attributes.userId.required).toBe(true);
  });

  test("exam_sessions has examPaperId required", () => {
    const sessions = schemaConfig.exam_sessions;
    expect(sessions.attributes.examPaperId.required).toBe(true);
    expect(sessions.indexes).toContainEqual({
      key: "idx_exam_sessions_paper",
      type: "key",
      attributes: ["examPaperId"],
    });
  });

  test("analytics has timestamp index", () => {
    const analytics = schemaConfig.analytics;
    expect(analytics.indexes).toContainEqual({
      key: "idx_analytics_timestamp",
      type: "key",
      attributes: ["timestamp"],
    });
  });
});
