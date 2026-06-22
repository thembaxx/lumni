import type { Question, UserAnswer } from "@/lib/question-engine/types";

export interface QuizSessionConfig {
  maxTime?: number;
}

export interface AnswerDetail {
  selectedAnswer: string;
  correctAnswer: string;
  answer: UserAnswer;
}

export interface QuizSessionState {
  currentQuestion: Question | null;
  questions: Question[];
  questionNumber: number;
  totalQuestions: number;
  elapsedTime: number;
  isComplete: boolean;
  correctAnswers: number;
  correctness: boolean[];
  userAnswers: UserAnswer[];
}

export interface QuizSessionActions {
  start(): void;
  recordAnswer(correct: boolean, detail?: AnswerDetail): void;
  next(): void;
  previous(): void;
  stop(): void;
  restart(): void;
}
