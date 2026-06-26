import type { Question } from "@/lib/question-engine/types";

export interface BoltResult {
  question: Question;
  correct: boolean;
}
