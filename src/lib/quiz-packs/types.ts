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
  visualAssetsGenerated: boolean;
  visualAssetsCount: number;
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
  visualAssetId?: string;
  visualAssetType?: string;
}

export interface QuizPackVisualAsset {
  packId: string;
  questionIndex: number;
  assetId: string;
  assetType: string;
  assetData: string;
  createdAt: number;
}

export interface PackGenerationRequest {
  subject: string;
  topic?: string;
  count: number;
}

export const PACK_EXPIRY_DAYS = 30;
export const MAX_PACK_STORAGE_BYTES = 100 * 1024 * 1024;
export const MAX_PACK_QUESTIONS = 100;
export const DEFAULT_PACK_QUESTIONS = 50;
