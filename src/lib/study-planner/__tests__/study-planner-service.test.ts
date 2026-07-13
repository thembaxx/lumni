import { describe, expect, test, vi } from "vitest";
import type { CompetencyRecord } from "@/lib/competency-engine/types";
import { StudyPlannerService } from "../study-planner-service";
import type { StudyPlanSettings } from "../types";

function makeRecord(score: number, level: CompetencyRecord["level"]): CompetencyRecord {
  return {
    subjectId: "mathematics",
    topicId: "algebra",
    bloomLevel: "apply",
    score,
    attempts: 1,
    lastAssessed: Date.now(),
    level,
  };
}

describe("StudyPlannerService", () => {
  test("calls getCompetencies once per subject and not getMasterySummary", async () => {
    const mockRecords: CompetencyRecord[] = [
      makeRecord(75, "proficient"),
      makeRecord(45, "developing"),
    ];

    const mockCompetencyService = {
      getCompetencies: vi.fn().mockResolvedValue(mockRecords),
      getMasterySummary: vi.fn(),
      getMasterySummaryFrom: vi.fn().mockReturnValue({
        total: 2,
        novice: 0,
        developing: 1,
        proficient: 1,
        mastered: 0,
        averageScore: 60,
      }),
    };

    const service = new StudyPlannerService(
      mockCompetencyService as unknown as import("@/lib/competency-engine/competency-service").CompetencyService,
    );

    const settings: StudyPlanSettings = {
      targetAps: 25,
      dailyStudyMinutes: 60,
      preferredStudyTime: "morning",
      studyDays: [1, 2, 3, 4, 5],
      startDate: "2026-01-05",
      endDate: "2026-01-09",
    };

    await service.generateStudyPlan(settings);

    expect(mockCompetencyService.getCompetencies).toHaveBeenCalledTimes(9);
    expect(mockCompetencyService.getMasterySummary).not.toHaveBeenCalled();
  });

  test("returns a valid study plan", async () => {
    const mockRecords: CompetencyRecord[] = [makeRecord(85, "mastered")];

    const mockCompetencyService = {
      getCompetencies: vi.fn().mockResolvedValue(mockRecords),
      getMasterySummary: vi.fn(),
      getMasterySummaryFrom: vi.fn().mockReturnValue({
        total: 1,
        novice: 0,
        developing: 0,
        proficient: 0,
        mastered: 1,
        averageScore: 85,
      }),
    };

    const service = new StudyPlannerService(
      mockCompetencyService as unknown as import("@/lib/competency-engine/competency-service").CompetencyService,
    );

    const settings: StudyPlanSettings = {
      targetAps: 25,
      dailyStudyMinutes: 60,
      preferredStudyTime: "morning",
      studyDays: [1, 2, 3, 4, 5],
      startDate: "2026-01-05",
      endDate: "2026-01-09",
    };

    const plan = await service.generateStudyPlan(settings);

    expect(plan).toHaveProperty("settings");
    expect(plan).toHaveProperty("subjects");
    expect(plan).toHaveProperty("topics");
    expect(plan.subjects).toHaveLength(9);
  });
});
