export type CardStatus = "active" | "buried" | "suspended";
export type SRSAlgorithm = "sm2" | "fsrs";

export interface SRSettings {
  learningSteps: number[];
  dailyNewLimit: number;
  dailyReviewLimit: number;
  leechThreshold: number;
  leechAction: "suspend" | "bury" | "tag-only";
  easeHellPasses: number;
  easeHellBoost: number;
}

export const DEFAULT_SR_SETTINGS: SRSettings = {
  learningSteps: [1, 10, 1440],
  dailyNewLimit: 20,
  dailyReviewLimit: 200,
  leechThreshold: 8,
  leechAction: "suspend",
  easeHellPasses: 3,
  easeHellBoost: 0.15,
};

export const SR_SETTINGS_KEY = "lumni_sr_settings";

export interface FlashcardSM2 {
  id: string;
  front: string;
  back: string;
  subject: string;
  topic?: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: number;
  lastReview: number | null;
  createdAt: number;
  updatedAt: number;
  algorithm: SRSAlgorithm;
  stability: number;
  difficulty: number;
  status: CardStatus;
  lapses: number;
  learningStep: number;
  leeched: boolean;
}

export interface FlashcardReview {
  id?: number;
  cardId: string;
  quality: number;
  algorithm: SRSAlgorithm;
  easeFactor: number;
  stability: number;
  difficulty: number;
  interval: number;
  reviewedAt: number;
}

export interface SM2Quality {
  quality: number;
  label: string;
  description: string;
}

export const SM2_QUALITIES: SM2Quality[] = [
  {
    quality: 0,
    label: "Complete Blackout",
    description: "Couldn't recall at all",
  },
  {
    quality: 1,
    label: "Incorrect - Remembered",
    description: "Got it wrong but remembered after",
  },
  {
    quality: 2,
    label: "Incorrect - Easy",
    description: "Got it wrong, answer seemed easy after",
  },
  {
    quality: 3,
    label: "Correct - Hard",
    description: "Got it right with serious difficulty",
  },
  {
    quality: 4,
    label: "Correct - Good",
    description: "Got it right with some hesitation",
  },
  {
    quality: 5,
    label: "Correct - Easy",
    description: "Got it right instantly and easily",
  },
];

export interface FlashcardStats {
  total: number;
  due: number;
  learning: number;
  mature: number;
  new: number;
  avgEaseFactor: number;
}

export interface FlashcardRepository {
  getDueCards(subject?: string): Promise<FlashcardSM2[]>;
  getNewCards(subject?: string, limit?: number): Promise<FlashcardSM2[]>;
  getAll(subject?: string): Promise<FlashcardSM2[]>;
  getById(id: string): Promise<FlashcardSM2 | null>;
  create(front: string, back: string, subject: string, topic?: string): Promise<FlashcardSM2>;
  update(id: string, updates: Partial<FlashcardSM2>): Promise<void>;
  delete(id: string): Promise<void>;
  review(id: string, quality: number): Promise<FlashcardSM2 | null>;
  getStats(): Promise<FlashcardStats>;
  getGrouped(): Promise<Record<string, FlashcardSM2[]>>;
  bury(id: string): Promise<void>;
  suspend(id: string): Promise<void>;
  activate(id: string): Promise<void>;
  getReviewHistory(cardId: string): Promise<FlashcardReview[]>;
}
