import type { BloomLevel, Difficulty, Question } from "@/lib/question-engine/types";

export interface QuizCompleteResult {
  reason: "completed" | "quit";
  questions: Question[];
  correctness: boolean[];
  correctAnswers: number;
  totalQuestions: number;
  elapsedTime: number;
}

export interface RetentionQuestion {
  id: string;
  questionText: string;
  correctAnswer: string;
  explanation: string;
  subject: string;
  topic: string;
}

export interface UseQuizParams {
  subject: string;
  topic?: string;
  count?: number;
  questionType?: string;
  maxTime?: number;
  enabled?: boolean;
  pastPaperMode?: boolean;
  preloadedQuestions?: Question[];
  retentionQuestions?: RetentionQuestion[];
  suggestedBloomLevel?: BloomLevel;
  suggestedDifficulty?: Difficulty;
  topicCompetencyLevel?: "novice" | "developing" | "proficient" | "mastered";
  topicCompetencyScore?: number;
  onComplete?: (result: QuizCompleteResult) => void;
}
