import { describe, it, expect, vi, beforeEach } from "vitest";
import { InMemoryDataAccess } from "@/lib/db/in-memory-data-access";
import { ExportService } from "../export-service";
import type { CompetencyRecord } from "@/lib/competency-engine/types";
import type { QuizAttempt, ExamSessionSnapshot } from "@/lib/db/schema";
import type { WrongAnswerEntry } from "@/hooks/use-wrong-answer-journal";
import type { StoredGamification, StoredAchievement } from "@/lib/gamification-engine/types";

vi.mock("@/lib/flashcard-engine", () => ({
  flashcardEngine: {
    getAll: vi
      .fn()
      .mockResolvedValue([{ id: "fc-1", front: "Hello", back: "World", dueDate: Date.now() }]),
  },
}));

function seedDataAccess(): InMemoryDataAccess {
  const db = new InMemoryDataAccess();
  const now = Date.now();

  db.gamification.seed([
    {
      id: 1,
      userId: "user-1",
      currentXp: 500,
      totalXp: 1500,
      level: 3,
      loginStreak: 5,
      lastActiveDate: new Date().toISOString(),
      chestProgress: {},
      unlockedChests: [],
      currentChestTier: 0,
      achievements: [
        { id: "first_quiz", earnedAt: new Date(now - 86400000).toISOString(), rarity: "common" },
        {
          id: "streak_5",
          earnedAt: new Date(now - 43200000).toISOString(),
          name: "On Fire",
          rarity: "rare",
        },
      ] as StoredAchievement[],
      data: {},
      syncedAt: now,
      consecutiveCorrectFlashcards: 0,
      wrongAnswersReviewed: 0,
      studyPlanDaysCompleted: 0,
      learnerId: "user-1",
    } as StoredGamification,
  ]);

  db.quizAttempts.seed([
    {
      id: 1,
      odSubject: "Mathematics",
      score: 8,
      totalQuestions: 10,
      duration: 300,
      completedAt: now - 86400000,
      odTopic: "Algebra",
      userId: "user-1",
      difficulty: "Medium",
      mode: "quiz" as const,
      accuracy: 80,
    } as QuizAttempt,
    {
      id: 2,
      odSubject: "Physical Sciences",
      score: 15,
      totalQuestions: 20,
      duration: 600,
      completedAt: now - 43200000,
      odTopic: "Newton's Laws",
      userId: "user-1",
      difficulty: "Hard",
      mode: "quiz" as const,
      accuracy: 75,
    } as QuizAttempt,
  ]);

  db.competencies.seed([
    { id: 1, subjectId: "Mathematics", topicId: "Algebra", score: 75, userId: "user-1" },
    { id: 2, subjectId: "Mathematics", topicId: "Geometry", score: 60, userId: "user-1" },
    {
      id: 3,
      subjectId: "Physical Sciences",
      topicId: "Newton's Laws",
      score: 80,
      userId: "user-1",
    },
  ] as CompetencyRecord[]);

  db.examSessions.seed([
    {
      id: 1,
      paperId: "maths-p1",
      startedAt: now - 172800000,
      completed: true,
      userId: "user-1",
      answers: [],
      score: 42,
      totalQuestions: 50,
      startedAtISO: new Date(now - 172800000).toISOString(),
    } as ExamSessionSnapshot,
  ]);

  db.wrongAnswers.seed([
    {
      id: 1,
      questionText: "What is 2+2?",
      yourAnswer: "5",
      correctAnswer: "4",
      subjectId: "Mathematics",
      topicId: "Algebra",
      userId: "user-1",
      createdAt: now - 86400000,
      errorType: "misconception",
    } as WrongAnswerEntry,
  ]);

  return db;
}

describe("ExportService", () => {
  let db: InMemoryDataAccess;
  let service: ExportService;

  beforeEach(() => {
    db = seedDataAccess();
    service = new ExportService(db);
  });

  it("builds a full report with all sections", async () => {
    const report = await service.buildFullReport();

    expect(report.exportedAt).toBeDefined();
    expect(report.gamification).not.toBeNull();
    expect(report.achievements).toHaveLength(2);
    expect(report.quizHistory).toHaveLength(2);
    expect(report.examSessions).toHaveLength(1);
    expect(report.wrongAnswers).toHaveLength(1);
    expect(report.flashcards).toHaveLength(1);
  });

  it("computes quiz accuracy correctly", async () => {
    const report = await service.buildFullReport();
    const maths = report.quizHistory.find((q) => q.subject === "Mathematics");

    expect(maths).toBeDefined();
    expect(maths!.accuracy).toBe(80);
  });

  it("groups competencies by subject", async () => {
    const report = await service.buildFullReport();

    expect(report.competency["Mathematics"]).toBeDefined();
    expect(report.competency["Mathematics"].topics).toBe(2);
    expect(report.competency["Mathematics"].averageScore).toBeCloseTo(67.5, 1);
    expect(report.competency["Physical Sciences"]).toBeDefined();
    expect(report.competency["Physical Sciences"].topics).toBe(1);
  });

  it("returns empty arrays when no data exists", async () => {
    const emptyDb = new InMemoryDataAccess();
    const emptyService = new ExportService(emptyDb);
    const report = await emptyService.buildFullReport();

    expect(report.gamification).toBeNull();
    expect(report.achievements).toEqual([]);
    expect(report.quizHistory).toEqual([]);
    expect(report.competency).toEqual({});
    expect(report.examSessions).toEqual([]);
    expect(report.wrongAnswers).toEqual([]);
    expect(report.flashcards).toHaveLength(1);
  });

  it("generates CSV from quiz attempts and exam sessions", () => {
    const csv = service.toCSV(
      [
        {
          id: 1,
          odSubject: "Math",
          score: 8,
          totalQuestions: 10,
          duration: 300,
          completedAt: Date.now(),
          odTopic: "Algebra",
          userId: "user-1",
          difficulty: "Medium",
          mode: "quiz",
          accuracy: 80,
        } as QuizAttempt,
      ],
      [
        {
          id: 1,
          paperId: "phys-p1",
          startedAt: Date.now(),
          completed: true,
        } as ExamSessionSnapshot,
      ],
    );

    expect(csv).toContain("Type,Subject,Score,TotalQuestions,Accuracy,Duration,Date");
    expect(csv).toContain("Quiz,Math,8,10");
    expect(csv).toContain("Exam,phys-p1");
  });

  it("generates JSON from report", () => {
    const mockReport = {
      exportedAt: "2026-01-01T00:00:00.000Z",
      gamification: null,
      achievements: [],
      quizHistory: [],
      competency: {},
      examSessions: [],
      wrongAnswers: [],
      flashcards: [],
    };

    const json = service.toJSON(mockReport);
    const parsed = JSON.parse(json);
    expect(parsed.exportedAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("handles gamification with no achievements", async () => {
    const db2 = new InMemoryDataAccess();
    db2.gamification.seed([
      {
        id: 1,
        userId: "user-2",
        currentXp: 100,
        totalXp: 100,
        level: 1,
        loginStreak: 0,
        lastActiveDate: new Date().toISOString(),
        chestProgress: {},
        unlockedChests: [],
        currentChestTier: 0,
        achievements: [],
        data: {},
        syncedAt: Date.now(),
        consecutiveCorrectFlashcards: 0,
        wrongAnswersReviewed: 0,
        studyPlanDaysCompleted: 0,
        learnerId: "user-2",
      } as unknown as StoredGamification,
    ]);

    const svc = new ExportService(db2);
    const report = await svc.buildFullReport();
    expect(report.gamification).not.toBeNull();
    expect(report.achievements).toEqual([]);
  });
});
