import { beforeEach, describe, expect, test, vi } from "vitest";
import type { Question } from "@/lib/question-engine/types";
import type { QuizResultDeps } from "../quiz-result-processor/index";
import { processQuizResult } from "../quiz-result-processor/index";

function makeMockDeps(): QuizResultDeps {
  return {
    updateStreak: vi.fn(),
    addXp: vi.fn(),
    checkAndUnlockAchievements: vi.fn(),
    checkForRewardChests: vi.fn(),
    addWrongAnswer: vi.fn(),
    flashcardEngine: {
      create: vi.fn().mockResolvedValue({}),
      review: vi.fn().mockResolvedValue(null),
    },
    trackQuestionResult: vi.fn(),
    enqueue: vi.fn(),
    addStudySession: vi.fn(),
    markPlanStale: vi.fn(),
    currentStreak: 3,
    totalQuestionsAnswered: 10,
    levelInfo: { level: 2 },
  };
}

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: "q1",
    type: "multiple-choice",
    subject: "Mathematics",
    topic: "Algebra",
    difficulty: "Medium",
    bloomTaxonomy: "apply",
    points: 1,
    questionText: "What is 2+2?",
    hint: "Add the numbers",
    explanation: "2+2=4",
    body: { options: [], stem: "What is 2+2?" },
    ...overrides,
  } as Question;
}

describe("processQuizResult", () => {
  let deps: QuizResultDeps;

  beforeEach(() => {
    deps = makeMockDeps();
  });

  describe("bolt source", () => {
    test("calls updateStreak, addXp, and checkForRewardChests for correct answer", async () => {
      const question = makeQuestion();
      await processQuizResult({ source: "bolt", question: { question, correct: true } }, deps);

      expect(deps.updateStreak).toHaveBeenCalledOnce();
      expect(deps.addXp).toHaveBeenCalledWith(1, 100, 3);
      expect(deps.checkAndUnlockAchievements).toHaveBeenCalledOnce();
      expect(deps.checkForRewardChests).toHaveBeenCalledOnce();
    });

    test("records score 0 for incorrect bolt answer", async () => {
      const question = makeQuestion();
      await processQuizResult({ source: "bolt", question: { question, correct: false } }, deps);

      expect(deps.addXp).toHaveBeenCalledWith(1, 0, 3);
      expect(deps.trackQuestionResult).toHaveBeenCalledWith(
        expect.objectContaining({ score: 0, maxScore: 1 }),
      );
    });

    test("records score 1 for correct bolt answer", async () => {
      const question = makeQuestion();
      await processQuizResult({ source: "bolt", question: { question, correct: true } }, deps);

      expect(deps.trackQuestionResult).toHaveBeenCalledWith(
        expect.objectContaining({ score: 1, maxScore: 1 }),
      );
    });

    test("tracks wrong answer and creates flashcard for incorrect bolt", async () => {
      const question = makeQuestion({ id: "q2", questionText: "Q2" });
      await processQuizResult({ source: "bolt", question: { question, correct: false } }, deps);

      expect(deps.addWrongAnswer).toHaveBeenCalledWith(
        expect.objectContaining({
          questionId: "q2",
          subject: "Mathematics",
          topic: "Algebra",
        }),
      );
      expect(deps.flashcardEngine.create).toHaveBeenCalledWith(
        "Q2",
        "2+2=4",
        "Mathematics",
        "Algebra",
      );
    });

    test("does not create flashcard for correct bolt answer", async () => {
      const question = makeQuestion();
      await processQuizResult({ source: "bolt", question: { question, correct: true } }, deps);

      expect(deps.addWrongAnswer).not.toHaveBeenCalled();
      expect(deps.flashcardEngine.create).not.toHaveBeenCalled();
    });

    test("enqueues analytics-sync event", async () => {
      const question = makeQuestion({ type: "short-answer" });
      await processQuizResult({ source: "bolt", question: { question, correct: true } }, deps);

      expect(deps.enqueue).toHaveBeenCalledWith(
        "analytics-sync",
        expect.objectContaining({
          events: [
            expect.objectContaining({
              event: "grade",
              subject: "Mathematics",
              questionType: "short-answer",
              success: true,
            }),
          ],
        }),
      );
    });
  });

  describe("quiz source", () => {
    test("calculates accuracy and calls gamification hooks", async () => {
      const q1 = makeQuestion({ id: "q1" });
      const q2 = makeQuestion({ id: "q2" });
      await processQuizResult(
        {
          source: "quiz",
          results: {
            questions: [q1, q2],
            correctness: [true, false],
            correctAnswers: 1,
            totalQuestions: 2,
            elapsedTime: 30,
          },
        },
        deps,
      );

      expect(deps.updateStreak).toHaveBeenCalledOnce();
      expect(deps.addXp).toHaveBeenCalledWith(2, 50, 3);
      expect(deps.checkForRewardChests).toHaveBeenCalledOnce();
      expect(deps.markPlanStale).toHaveBeenCalledOnce();
    });

    test("batch creates flashcards for wrong answers", async () => {
      const q1 = makeQuestion({ id: "q1", explanation: "exp1" });
      const q2 = makeQuestion({ id: "q2", explanation: "exp2" });
      await processQuizResult(
        {
          source: "quiz",
          results: {
            questions: [q1, q2],
            correctness: [true, false],
            correctAnswers: 1,
            totalQuestions: 2,
            elapsedTime: 30,
          },
        },
        deps,
      );

      expect(deps.addWrongAnswer).toHaveBeenCalledOnce();
      expect(deps.flashcardEngine.create).toHaveBeenCalledOnce();
      expect(deps.addWrongAnswer).toHaveBeenCalledWith(
        expect.objectContaining({ questionId: "q2" }),
      );
    });

    test("schedules study session when weak answers exist", async () => {
      const q1 = makeQuestion();
      await processQuizResult(
        {
          source: "quiz",
          results: {
            questions: [q1],
            correctness: [false],
            correctAnswers: 0,
            totalQuestions: 1,
            elapsedTime: 10,
          },
        },
        deps,
      );

      expect(deps.addStudySession).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: "Mathematics",
          type: "quiz",
          completed: false,
        }),
      );
    });

    test("no study session when all correct", async () => {
      const q1 = makeQuestion();
      await processQuizResult(
        {
          source: "quiz",
          results: {
            questions: [q1],
            correctness: [true],
            correctAnswers: 1,
            totalQuestions: 1,
            elapsedTime: 10,
          },
        },
        deps,
      );

      expect(deps.addStudySession).not.toHaveBeenCalled();
    });

    test("enqueues analytics events for each question", async () => {
      const q1 = makeQuestion({ id: "q1" });
      const q2 = makeQuestion({ id: "q2" });
      await processQuizResult(
        {
          source: "quiz",
          results: {
            questions: [q1, q2],
            correctness: [true, false],
            correctAnswers: 1,
            totalQuestions: 2,
            elapsedTime: 30,
          },
        },
        deps,
      );

      expect(deps.enqueue).toHaveBeenCalledWith(
        "analytics-sync",
        expect.objectContaining({
          events: expect.arrayContaining([
            expect.objectContaining({ success: true }),
            expect.objectContaining({ success: false }),
          ]),
        }),
      );
    });
  });

  describe("exam source", () => {
    test("resolves marks correctly from numeric marks field", async () => {
      await processQuizResult(
        {
          source: "exam",
          subject: "Physical Sciences",
          paperId: "paper1",
          parts: [
            {
              partId: "p1",
              correct: true,
              score: 5,
              sectionId: "section-a",
              questionId: "q1",
              part: { text: "Part A", type: "multiple-choice", marks: 5 },
            },
          ],
        },
        deps,
      );

      expect(deps.trackQuestionResult).toHaveBeenCalledWith(
        expect.objectContaining({
          subjectId: "Physical Sciences",
          topicId: "section-a",
          maxScore: 5,
          paperId: "paper1",
        }),
      );
    });

    test("resolves marks from score when marks field is missing", async () => {
      await processQuizResult(
        {
          source: "exam",
          subject: "Mathematics",
          parts: [
            {
              partId: "p1",
              correct: true,
              score: 3,
              sectionId: "algebra",
              questionId: "q1",
              part: { text: "Part A", type: "short-answer" },
            },
          ],
        },
        deps,
      );

      expect(deps.trackQuestionResult).toHaveBeenCalledWith(
        expect.objectContaining({ maxScore: 3 }),
      );
    });

    test("handles multi-part questions with mixed results", async () => {
      await processQuizResult(
        {
          source: "exam",
          subject: "Mathematics",
          parts: [
            {
              partId: "p1",
              correct: true,
              score: 5,
              sectionId: "algebra",
              questionId: "q1",
              part: { text: "Part A", type: "multiple-choice", marks: 5 },
            },
            {
              partId: "p2",
              correct: false,
              score: 0,
              sectionId: "geometry",
              questionId: "q2",
              part: {
                text: "Part B",
                type: "multiple-choice",
                marks: 3,
                options: [
                  { id: "a", isCorrect: false, text: "Wrong" },
                  { id: "b", isCorrect: true, text: "Right" },
                ],
              },
              userAnswer: "a",
            },
          ],
        },
        deps,
      );

      expect(deps.addWrongAnswer).toHaveBeenCalledOnce();
      expect(deps.addWrongAnswer).toHaveBeenCalledWith(
        expect.objectContaining({ questionId: "p2" }),
      );
      expect(deps.flashcardEngine.create).toHaveBeenCalledOnce();
      expect(deps.addStudySession).toHaveBeenCalledWith(expect.objectContaining({ type: "exam" }));
      expect(deps.trackQuestionResult).toHaveBeenCalledTimes(2);
    });

    test("no study session when all correct", async () => {
      await processQuizResult(
        {
          source: "exam",
          subject: "Mathematics",
          parts: [
            {
              partId: "p1",
              correct: true,
              score: 5,
              sectionId: "algebra",
              questionId: "q1",
              part: { text: "Part A", type: "multiple-choice", marks: 5 },
            },
          ],
        },
        deps,
      );

      expect(deps.addStudySession).not.toHaveBeenCalled();
    });
  });

  describe("flashcard source", () => {
    const makeCard = (id: string, overrides: Record<string, unknown> = {}) => ({
      id,
      front: `Front ${id}`,
      back: `Back ${id}`,
      topic: "topic-a",
      rawQuestion: makeQuestion({ id }),
      ...overrides,
    });

    test("SM-2 mode reviews existing cards", async () => {
      const cards = [makeCard("c1"), makeCard("c2")];
      const qualities = new Map([
        ["c1", 5],
        ["c2", 2],
      ]);

      await processQuizResult(
        {
          source: "flashcard",
          cards,
          qualities,
          subject: "Biology",
          isSm2: true,
        },
        deps,
      );

      expect(deps.flashcardEngine.review).toHaveBeenCalledTimes(2);
      expect(deps.flashcardEngine.review).toHaveBeenCalledWith("c1", 5);
      expect(deps.flashcardEngine.review).toHaveBeenCalledWith("c2", 2);
    });

    test("non-SM-2 mode tracks question results", async () => {
      const cards = [makeCard("c1")];
      const qualities = new Map([["c1", 4]]);

      await processQuizResult(
        {
          source: "flashcard",
          cards,
          qualities,
          subject: "Biology",
          isSm2: false,
        },
        deps,
      );

      expect(deps.trackQuestionResult).toHaveBeenCalledWith(
        expect.objectContaining({
          subjectId: "Biology",
          topicId: "topic-a",
          score: 1,
          maxScore: 1,
        }),
      );
    });

    test("creates new card for low quality in non-SM-2 mode", async () => {
      const cards = [makeCard("c1")];
      const qualities = new Map([["c1", 1]]);

      await processQuizResult(
        {
          source: "flashcard",
          cards,
          qualities,
          subject: "Biology",
          isSm2: false,
        },
        deps,
      );

      expect(deps.addWrongAnswer).toHaveBeenCalledOnce();
      expect(deps.flashcardEngine.create).toHaveBeenCalledWith(
        "Front c1",
        "Back c1",
        "Biology",
        "topic-a",
      );
    });

    test("tracks wrong answer for low quality in SM-2 mode", async () => {
      const cards = [makeCard("c1")];
      const qualities = new Map([["c1", 1]]);

      await processQuizResult(
        {
          source: "flashcard",
          cards,
          qualities,
          subject: "Biology",
          isSm2: true,
        },
        deps,
      );

      expect(deps.addWrongAnswer).toHaveBeenCalledOnce();
      expect(deps.flashcardEngine.create).not.toHaveBeenCalled();
    });

    test("enqueues analytics events per card", async () => {
      const cards = [makeCard("c1"), makeCard("c2")];
      const qualities = new Map([
        ["c1", 5],
        ["c2", 1],
      ]);

      await processQuizResult(
        {
          source: "flashcard",
          cards,
          qualities,
          subject: "Biology",
          isSm2: true,
        },
        deps,
      );

      expect(deps.enqueue).toHaveBeenCalledWith(
        "analytics-sync",
        expect.objectContaining({
          events: expect.arrayContaining([
            expect.objectContaining({ success: true }),
            expect.objectContaining({ success: false }),
          ]),
        }),
      );
    });
  });
});
