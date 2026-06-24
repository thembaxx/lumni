import { Effect } from "effect";
import type { FlashcardSM2 } from "@/lib/flashcard-engine/types";
import type { JobType } from "@/lib/orchestrator/types";
import { formatCorrectAnswer } from "@/lib/question-engine/answer-formatter";
import type { BloomLevel, Question, QuestionType } from "@/lib/question-engine/types";
import type { StudySession } from "@/lib/utils/study-planner";

export interface WrongAnswerInput {
  questionId: string;
  questionText: string;
  subject: string;
  topic: string;
  correctAnswer: string;
  userAnswer: string;
  explanation: string;
}

export interface TrackResultInput {
  subjectId: string;
  topicId: string;
  bloomLevel: BloomLevel;
  score: number;
  maxScore: number;
  questionType?: QuestionType;
  paperId?: string;
}

export interface FlashcardEngine {
  create(front: string, back: string, subject: string, topic?: string): Promise<FlashcardSM2>;
  review(id: string, quality: number): Promise<FlashcardSM2 | null>;
}

export interface RetentionInput {
  questionId: string;
  questionText: string;
  subject: string;
  topic: string;
  correctAnswer: string;
  explanation: string;
}

export interface QuizResultDeps {
  updateStreak: () => void;
  addXp: (amount: number, accuracy: number, streak: number) => void;
  checkAndUnlockAchievements: (
    questionsAnswered: number,
    accuracy: number,
    streak: number,
    level: number,
    perfectQuiz: boolean,
    extra?: {
      competentTopicsCount?: number;
      topicScoreImproved?: boolean;
      examScoreImproved?: boolean;
    },
  ) => void;
  checkForRewardChests: () => void;
  addWrongAnswer: (entry: Omit<WrongAnswerInput, "id">) => void;
  addRetentionItem?: (entry: RetentionInput) => void;
  flashcardEngine: FlashcardEngine;
  trackQuestionResult: (params: TrackResultInput) => void;
  // oxlint-disable-next-line typescript/no-explicit-any
  enqueue: (type: JobType, payload: any) => void;
  addStudySession: (session: Omit<StudySession, "id">) => void;
  markPlanStale: () => void;
  currentStreak: number;
  totalQuestionsAnswered: number;
  levelInfo: { level: number };
}

type BoltResult = {
  question: Question;
  correct: boolean;
};

type QuizResults = {
  questions: Question[];
  correctness: boolean[];
  correctAnswers: number;
  totalQuestions: number;
  elapsedTime: number;
};

type ExamPartResult = {
  partId: string;
  correct: boolean;
  score: number;
  sectionId: string;
  questionId: string;
  part: {
    text?: string | null;
    type: string;
    marks?: number | string | null;
    options?: { id: string; isCorrect: boolean; text?: string }[] | null;
  };
  userAnswer?: string;
  correctAnswerText?: string;
};

type FlashcardItem = {
  id: string;
  front: string;
  back: string;
  topic: string;
  rawQuestion: Question;
};

export type QuizResultInput =
  | { source: "bolt"; question: BoltResult }
  | { source: "quiz"; results: QuizResults }
  | {
      source: "exam";
      parts: ExamPartResult[];
      subject: string;
      paperId?: string;
    }
  | {
      source: "flashcard";
      cards: FlashcardItem[];
      qualities: Map<string, number>;
      subject: string;
      isSm2: boolean;
    };

function flashcardCreateEffect(
  deps: QuizResultDeps,
  front: string,
  back: string,
  subject: string,
  topic?: string,
): Effect.Effect<void> {
  return Effect.tryPromise(() => deps.flashcardEngine.create(front, back, subject, topic)).pipe(
    Effect.catchAll(() => Effect.void),
  );
}

function flashcardReviewEffect(
  deps: QuizResultDeps,
  id: string,
  quality: number,
): Effect.Effect<void> {
  return Effect.tryPromise(() => deps.flashcardEngine.review(id, quality)).pipe(
    Effect.catchAll(() => Effect.void),
  );
}

function processBoltEffect(result: BoltResult, deps: QuizResultDeps): Effect.Effect<void> {
  return Effect.gen(function* () {
    const { question, correct } = result;
    const accuracy = correct ? 100 : 0;
    deps.updateStreak();
    deps.addXp(1, accuracy, deps.currentStreak);
    deps.checkAndUnlockAchievements(
      deps.totalQuestionsAnswered + 1,
      accuracy,
      deps.currentStreak,
      deps.levelInfo.level,
      correct,
    );
    deps.checkForRewardChests();
    deps.trackQuestionResult({
      subjectId: question.subject,
      topicId: question.topic,
      bloomLevel: question.bloomTaxonomy,
      score: correct ? 1 : 0,
      maxScore: 1,
    });
    if (!correct) {
      const correctAnswer = formatCorrectAnswer(question);
      deps.addWrongAnswer({
        questionId: question.id,
        questionText: question.questionText,
        subject: question.subject,
        topic: question.topic,
        correctAnswer,
        userAnswer: "(see quiz history)",
        explanation: question.explanation,
      });
      deps.addRetentionItem?.({
        questionId: question.id,
        questionText: question.questionText,
        subject: question.subject,
        topic: question.topic,
        correctAnswer,
        explanation: question.explanation,
      });
      yield* flashcardCreateEffect(
        deps,
        question.questionText,
        correctAnswer,
        question.subject,
        question.topic,
      );
    }
    deps.enqueue("analytics-sync", {
      events: [
        {
          event: "grade",
          timestamp: Date.now(),
          subject: question.subject,
          questionType: question.type,
          success: correct,
          duration: 0,
        },
      ],
    });
  });
}

export function processQuizResultEffect(
  input: QuizResultInput,
  deps: QuizResultDeps,
): Effect.Effect<void> {
  switch (input.source) {
    case "bolt":
      return processBoltEffect(input.question, deps);
    case "quiz":
      return processQuizEffect(input.results, deps);
    case "exam":
      return processExamEffect(input.parts, input.subject, input.paperId, deps);
    case "flashcard":
      return processFlashcardEffect(input.cards, input.qualities, input.subject, input.isSm2, deps);
  }
}

function processQuizEffect(results: QuizResults, deps: QuizResultDeps): Effect.Effect<void> {
  return Effect.gen(function* () {
    const accuracy =
      results.totalQuestions > 0
        ? Math.round((results.correctAnswers / results.totalQuestions) * 100)
        : 0;
    deps.updateStreak();
    deps.addXp(results.totalQuestions, accuracy, deps.currentStreak);
    deps.checkAndUnlockAchievements(
      deps.totalQuestionsAnswered + results.totalQuestions,
      accuracy,
      deps.currentStreak,
      deps.levelInfo.level,
      accuracy === 100,
    );
    deps.checkForRewardChests();
    const flashcardEffects: Effect.Effect<void>[] = [];
    for (const [i, question] of results.questions.entries()) {
      const correct = results.correctness[i] ?? false;
      deps.trackQuestionResult({
        subjectId: question.subject,
        topicId: question.topic,
        bloomLevel: question.bloomTaxonomy,
        score: correct ? 1 : 0,
        maxScore: 1,
      });
      if (!correct) {
        const correctAnswer = formatCorrectAnswer(question);
        deps.addWrongAnswer({
          questionId: question.id,
          questionText: question.questionText,
          subject: question.subject,
          topic: question.topic,
          correctAnswer,
          userAnswer: "(see quiz history)",
          explanation: question.explanation,
        });
        deps.addRetentionItem?.({
          questionId: question.id,
          questionText: question.questionText,
          subject: question.subject,
          topic: question.topic,
          correctAnswer,
          explanation: question.explanation,
        });
        flashcardEffects.push(
          flashcardCreateEffect(
            deps,
            question.questionText,
            correctAnswer,
            question.subject,
            question.topic,
          ),
        );
      }
    }
    yield* Effect.all(flashcardEffects, { concurrency: "unbounded" });
    deps.markPlanStale();
    const weakCount = results.questions.filter((_, i) => !results.correctness[i]).length;
    if (weakCount > 0) {
      const subject = results.questions[0]?.subject ?? "unknown";
      deps.addStudySession({
        subject,
        type: "quiz",
        scheduledAt: Date.now() + 24 * 60 * 60 * 1000,
        duration: Math.min(weakCount * 5, 45),
        completed: false,
      });
    }
    deps.enqueue("analytics-sync", {
      events: results.questions.map((q, i) => ({
        event: "grade",
        timestamp: Date.now(),
        subject: q.subject,
        questionType: q.type,
        success: results.correctness[i] ?? false,
        duration: 0,
      })),
    });
  });
}

function getCorrectAnswerText(part: ExamPartResult["part"]): string {
  if (part.options) {
    const correct = part.options.find((o) => o.isCorrect);
    return correct ? `${correct.id}. ${correct.text}` : "";
  }
  return "";
}

function processExamEffect(
  parts: ExamPartResult[],
  subject: string,
  paperId: string | undefined,
  deps: QuizResultDeps,
): Effect.Effect<void> {
  return Effect.gen(function* () {
    const correctCount = parts.filter((r) => r.correct).length;
    const totalCount = parts.length;
    const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
    deps.updateStreak();
    deps.addXp(totalCount, accuracy, deps.currentStreak);
    deps.checkAndUnlockAchievements(
      deps.totalQuestionsAnswered + totalCount,
      accuracy,
      deps.currentStreak,
      deps.levelInfo.level,
      accuracy === 100,
    );
    deps.checkForRewardChests();
    const flashcardEffects: Effect.Effect<void>[] = [];
    for (const result of parts) {
      const topic = result.sectionId;
      const maxScore = typeof result.part.marks === "number" ? result.part.marks : result.score;
      deps.trackQuestionResult({
        subjectId: subject,
        topicId: topic,
        bloomLevel: "apply",
        score: result.score,
        maxScore,
        paperId,
      });
      if (!result.correct) {
        const partText = result.part.text ?? `Question ${result.questionId}`;
        const correctAnswer = result.correctAnswerText ?? getCorrectAnswerText(result.part);
        deps.addWrongAnswer({
          questionId: result.partId,
          questionText: partText,
          subject,
          topic,
          correctAnswer,
          userAnswer: result.userAnswer ?? "",
          explanation: "",
        });
        deps.addRetentionItem?.({
          questionId: result.partId,
          questionText: partText,
          subject,
          topic,
          correctAnswer,
          explanation: "",
        });
        flashcardEffects.push(
          flashcardCreateEffect(
            deps,
            partText,
            getCorrectAnswerText(result.part) || "Review this topic",
            subject,
          ),
        );
      }
    }
    yield* Effect.all(flashcardEffects, { concurrency: "unbounded" });
    deps.markPlanStale();
    const weakCount = parts.filter((r) => !r.correct).length;
    if (weakCount > 0) {
      deps.addStudySession({
        subject,
        type: "exam",
        scheduledAt: Date.now() + 24 * 60 * 60 * 1000,
        duration: Math.min(weakCount * 5, 45),
        completed: false,
      });
    }
    deps.enqueue("analytics-sync", {
      events: parts.map((r) => ({
        event: "grade",
        timestamp: Date.now(),
        subject,
        questionType: "multiple-choice" as QuestionType,
        success: r.correct,
        duration: 0,
      })),
    });
  });
}

function processFlashcardEffect(
  cards: FlashcardItem[],
  qualities: Map<string, number>,
  subject: string,
  isSm2: boolean,
  deps: QuizResultDeps,
): Effect.Effect<void> {
  return Effect.gen(function* () {
    const totalCards = cards.length;
    const passedCount = Array.from(qualities.values()).filter((q) => q >= 3).length;
    const accuracy = totalCards > 0 ? Math.round((passedCount / totalCards) * 100) : 0;
    deps.updateStreak();
    deps.addXp(totalCards, accuracy, deps.currentStreak);
    deps.checkAndUnlockAchievements(
      deps.totalQuestionsAnswered + totalCards,
      accuracy,
      deps.currentStreak,
      deps.levelInfo.level,
      accuracy === 100,
    );
    deps.checkForRewardChests();
    const cardEffects: Effect.Effect<void>[] = [];
    for (const card of cards) {
      const quality = qualities.get(card.id) ?? 0;
      const isKnown = quality >= 3;
      if (isSm2) {
        cardEffects.push(flashcardReviewEffect(deps, card.id, quality));
      } else {
        deps.trackQuestionResult({
          subjectId: subject,
          topicId: card.topic,
          bloomLevel: card.rawQuestion.bloomTaxonomy,
          score: isKnown ? 1 : 0,
          maxScore: 1,
        });
      }
      if (!isKnown) {
        deps.addWrongAnswer({
          questionId: card.id,
          questionText: card.front,
          subject,
          topic: card.topic,
          correctAnswer: card.back,
          userAnswer: "",
          explanation: card.back,
        });
        deps.addRetentionItem?.({
          questionId: card.id,
          questionText: card.front,
          subject,
          topic: card.topic,
          correctAnswer: card.back,
          explanation: card.back,
        });
        if (!isSm2) {
          cardEffects.push(flashcardCreateEffect(deps, card.front, card.back, subject, card.topic));
        }
      }
    }
    yield* Effect.all(cardEffects, { concurrency: "unbounded" });
    deps.enqueue("analytics-sync", {
      events: cards.map((card) => ({
        event: "grade",
        timestamp: Date.now(),
        subject,
        questionType: "multiple-choice" as QuestionType,
        success: (qualities.get(card.id) ?? 0) >= 3,
        duration: 0,
      })),
    });
  });
}

export async function processQuizResult(
  input: QuizResultInput,
  deps: QuizResultDeps,
): Promise<void> {
  return Effect.runPromise(processQuizResultEffect(input, deps));
}
