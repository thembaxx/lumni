export type PackStatus = "generating" | "ready" | "expired" | "failed";

export interface QuizPack {
  id: string;
  subject: string;
  topic: string | null;
  title: string;
  questionCount: number;
  status: PackStatus;
  downloadProgress: number;
  storageBytes: number;
  createdAt: number;
  expiresAt: number;
  lastUsedAt: number | null;
}

export interface QuizPackQuestion {
  packId: string;
  questionIndex: number;
  questionText: string;
  options: string | null;
  correctAnswer: string;
  explanation: string | null;
  difficulty: string;
  type: string;
}

export interface PackGenerationRequest {
  subject: string;
  topic?: string;
  count: number;
}

export const PACK_EXPIRY_DAYS = 7;
export const MAX_PACK_STORAGE_BYTES = 50 * 1024 * 1024;
