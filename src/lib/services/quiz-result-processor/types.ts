import type { FlashcardSM2 } from "@/lib/flashcard-engine/types";
import type { JobPayloadByType, JobType } from "@/lib/orchestrator/types";
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
  enqueue: <T extends JobType>(type: T, payload: JobPayloadByType[T]) => void;
  addStudySession: (session: Omit<StudySession, "id">) => void;
  markPlanStale: () => void;
  currentStreak: number;
  totalQuestionsAnswered: number;
  levelInfo: { level: number };
}

export interface BoltResult {
  question: Question;
  correct: boolean;
}

export interface QuizResults {
  questions: Question[];
  correctness: boolean[];
  correctAnswers: number;
  totalQuestions: number;
  elapsedTime: number;
}

export interface ExamPartResult {
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
}

export interface FlashcardItem {
  id: string;
  front: string;
  back: string;
  topic: string;
  rawQuestion: Question;
}

export interface HandlerResult {
  accuracy: number;
  totalCount: number;
  wrongCount: number;
  perfectQuiz: boolean;
  trackItems: TrackResultInput[];
  wrongItems: WrongAnswerInput[];
  retentionItems: RetentionInput[];
  flashcardItems: Array<{ front: string; back: string; subject: string; topic?: string }>;
  flashcardReviews: Array<{ id: string; quality: number }>;
  events: Array<{
    event: string;
    timestamp: number;
    subject: string;
    questionType: string;
    success: boolean;
    duration: number;
  }>;
  shouldMarkPlanStale: boolean;
}

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
