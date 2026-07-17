import { describe, it, expect, vi, beforeEach } from "vitest";
import { InMemoryDataAccess } from "@/lib/db/in-memory-data-access";
import { __setDepsForTesting } from "../deps";
import { searchAll } from "../index";

vi.mock("@/lib/flashcard-engine", () => ({
  flashcardEngine: {
    getAll: vi.fn().mockResolvedValue([
      {
        id: "fc-1",
        front: "Algebra formula",
        back: "x = (-b ± √(b² - 4ac)) / 2a",
        subject: "Mathematics",
        topic: "Algebra",
        createdAt: Date.now(),
      },
    ]),
  },
}));

function seedDb(): InMemoryDataAccess {
  const db = new InMemoryDataAccess();

  db.questions.seed([
    {
      id: 1,
      subject: "Mathematics",
      topic: "Algebra",
      questions: JSON.stringify([
        { id: "q1", questionText: "What is the quadratic formula?", topic: "Algebra" },
        { id: "q2", questionText: "Factorise x² + 5x + 6", topic: "Algebra" },
      ]),
      cachedAt: Date.now() - 10000,
    },
  ]);

  db.wrongAnswers.seed([
    {
      id: 1,
      questionId: "qa-wa1",
      questionText: "What is 2+2?",
      subject: "Mathematics",
      topic: "Algebra",
      correctAnswer: "4",
      userAnswer: "5",
      explanation: "Addition error",
      createdAt: Date.now() - 86400000,
      reviewed: false,
    },
  ]);

  db.quizAttempts.seed([
    {
      id: 1,
      odSubject: "Mathematics",
      score: 8,
      totalQuestions: 10,
      completedAt: Date.now() - 86400000,
      userId: "u1",
      difficulty: "Medium",
      odTopic: "Algebra",
      duration: 300,
      mode: "quiz",
    },
  ]);

  db.examSessions.seed([
    {
      id: 1,
      paperId: "maths-p1",
      answers: "{}",
      flags: "[]",
      currentPartId: null,
      timeRemaining: 3600,
      startedAt: Date.now(),
      lastSavedAt: Date.now(),
      completed: false,
    },
  ]);

  db.progress.seed([
    {
      id: 1,
      odSubjectId: "Mathematics",
      userId: "u1",
      questionsAttempted: 50,
      correctCount: 40,
      currentStreak: 5,
      longestStreak: 12,
      updatedAt: Date.now() - 3600000,
    },
  ]);

  db.studyGuides.seed([
    {
      key: "Mathematics:Algebra",
      sections: [],
      summary: "",
      createdAt: Date.now() - 86400000,
      expiresAt: Date.now() + 2592000000,
    },
  ]);

  db.dictionaryCache.seed([
    {
      key: "algebra",
      word: "algebra",
      result: {
        definitions: [{ definition: "A branch of mathematics dealing with symbols and rules" }],
      },
      cachedAt: Date.now() - 100000,
      expiresAt: Date.now() + 86400000,
    },
  ]);

  db.storyCache.seed([
    {
      id: "story-1",
      story: {
        id: "st-1",
        title: "The Algebra Adventure",
        content: "Once upon a time there was a quadratic equation...",
        author: "AI",
        subjects: ["Mathematics"],
        topics: ["Algebra"],
      },
      createdAt: Date.now() - 50000,
      expiresAt: Date.now() + 86400000 * 30,
    },
  ]);

  db.lessonCache.seed([
    {
      id: "lesson-1",
      lesson: {
        id: "l-1",
        title: "Introduction to Algebra",
        sections: [{ content: "Algebra is the study of mathematical symbols...", keyPoints: [] }],
        subjectId: "Mathematics",
        topicId: "Algebra",
      },
      createdAt: Date.now() - 20000,
      expiresAt: Date.now() + 86400000 * 30,
    },
  ]);

  db.vocabularyList.seed([
    {
      id: 1,
      userId: "u1",
      word: "variable",
      definition: "A symbol representing a quantity",
      language: "en",
      sourceType: "manual",
      sourceId: "dictionary",
      lessonId: "l-1",
      addedAt: Date.now() - 100000,
    },
  ]);

  db.notes.seed([
    {
      id: 1,
      uuid: "note-1",
      title: "Algebra Notes",
      content: "Key formulas and techniques in algebra",
      subject: "Mathematics",
      topic: "Algebra",
      createdAt: Date.now() - 200000,
      updatedAt: Date.now() - 100000,
    },
  ]);

  return db;
}

describe("searchAll", () => {
  beforeEach(() => {
    const db = seedDb();
    __setDepsForTesting({ db });
  });

  it("returns empty array for queries under 2 chars", async () => {
    expect(await searchAll("a")).toEqual([]);
    expect(await searchAll("")).toEqual([]);
  });

  it("finds questions matching the query", async () => {
    const results = await searchAll("quadratic");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.type === "question")).toBe(true);
  });

  it("finds wrong answers matching the query", async () => {
    const results = await searchAll("2+2");
    expect(results.some((r) => r.type === "wrong-answer")).toBe(true);
  });

  it("finds quiz attempts matching the query", async () => {
    const results = await searchAll("Mathematics");
    expect(results.some((r) => r.type === "quiz-attempt")).toBe(true);
  });

  it("finds exam sessions matching the query", async () => {
    const results = await searchAll("maths-p1");
    expect(results.some((r) => r.type === "exam-session")).toBe(true);
  });

  it("finds progress matching the query", async () => {
    const results = await searchAll("Mathematics");
    expect(results.some((r) => r.type === "progress")).toBe(true);
  });

  it("finds study guides matching the query", async () => {
    const results = await searchAll("Algebra");
    expect(results.some((r) => r.type === "study-set")).toBe(true);
  });

  it("finds dictionary entries matching the query", async () => {
    const results = await searchAll("algebra");
    expect(results.some((r) => r.type === "dictionary")).toBe(true);
  });

  it("finds stories matching the query", async () => {
    const results = await searchAll("Algebra Adventure");
    expect(results.some((r) => r.type === "story")).toBe(true);
  });

  it("finds lessons matching the query", async () => {
    const results = await searchAll("Introduction to Algebra");
    expect(results.some((r) => r.type === "lesson")).toBe(true);
  });

  it("finds vocabulary matching the query", async () => {
    const results = await searchAll("variable");
    expect(results.some((r) => r.type === "vocabulary")).toBe(true);
  });

  it("finds notes matching the query", async () => {
    const results = await searchAll("Algebra Notes");
    expect(results.some((r) => r.type === "note")).toBe(true);
  });

  it("finds flashcards matching the query", async () => {
    const results = await searchAll("Algebra formula");
    expect(results.some((r) => r.type === "flashcard")).toBe(true);
  });

  it("caps results at 25", async () => {
    const db2 = new InMemoryDataAccess();
    for (let i = 0; i < 30; i++) {
      db2.quizAttempts.seed([
        {
          id: i,
          odSubject: "Subject " + i,
          score: 5,
          totalQuestions: 10,
          completedAt: Date.now(),
          userId: "u1",
          difficulty: "Easy",
          odTopic: "T" + i,
          duration: 100,
          mode: "quiz",
        },
      ]);
    }
    __setDepsForTesting({ db: db2 });
    const results = await searchAll("Subject");
    expect(results.length).toBeLessThanOrEqual(25);
  });
});
