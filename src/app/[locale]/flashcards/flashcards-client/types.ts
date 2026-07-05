import type { Question } from "@/lib/question-engine/types";

export interface FlashcardItem {
  id: string;
  front: string;
  back: string;
  topic: string;
  difficulty: string;
  hint?: string;
  rawQuestion: Question;
}

export type FlashcardSource = "ai" | "mistakes" | "vocabulary";

export interface SessionState {
  selectedSubject: string;
  source: FlashcardSource;
  isActive: boolean;
  sessionComplete: boolean;
}

export type SessionAction =
  | {
      type: "START_SESSION";
      payload: { subject: string; source: FlashcardSource };
    }
  | { type: "STOP_SESSION" }
  | { type: "COMPLETE_SESSION" }
  | { type: "RESTART" };

export interface CardsState {
  mistakeCards: FlashcardItem[];
  sm2Cards: FlashcardItem[];
  qualityMap: Map<string, number>;
}

export type CardsAction =
  | { type: "SET_MISTAKE_CARDS"; payload: FlashcardItem[] }
  | { type: "SET_SM2_CARDS"; payload: FlashcardItem[] }
  | { type: "RESET" }
  | { type: "SET_QUALITY"; payload: { cardId: string; quality: number } };
