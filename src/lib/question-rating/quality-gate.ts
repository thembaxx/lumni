import { dexieDataAccess } from "@/lib/db";
import type { DataAccessTable } from "@/lib/db/data-access";
import type { CachedQuestion } from "@/lib/db/schema";
import { logError } from "@/lib/shared/logger";

export interface QualityGateConfig {
  minRatings: number;
  threshold: number;
}

export interface QualityGateResult {
  questionId: string;
  avgRating: number;
  ratingCount: number;
  action: "keep" | "deprecate";
}

const DEFAULT_CONFIG: QualityGateConfig = {
  minRatings: 10,
  threshold: 2.5,
};

export function checkQuestionQuality(
  ratings: { rating: number; questionId: string }[],
  config?: Partial<QualityGateConfig>,
): QualityGateResult {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const qId = ratings.length > 0 ? ratings[0].questionId : "unknown";

  if (ratings.length < cfg.minRatings) {
    return { questionId: qId, avgRating: 0, ratingCount: ratings.length, action: "keep" };
  }

  const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

  return {
    questionId: qId,
    avgRating,
    ratingCount: ratings.length,
    action: avgRating >= cfg.threshold ? "keep" : "deprecate",
  };
}

export async function deprecateLowQualityQuestion(
  questionId: string,
  db?: { deprecatedQuestions: DataAccessTable<{ questionId: string; deprecatedAt: number }, string> },
): Promise<void> {
  const store = db ?? dexieDataAccess;
  try {
    await store.deprecatedQuestions.put({ questionId, deprecatedAt: Date.now() });
  } catch (err) {
    logError("QualityGate.deprecate", err);
  }
}

export async function batchDeprecateLowQuality(
  ratings: { questionId: string; rating: number }[],
  config?: Partial<QualityGateConfig>,
): Promise<{ deprecated: string[]; kept: string[] }> {
  const byQuestion = new Map<string, { rating: number }[]>();
  for (const r of ratings) {
    if (!byQuestion.has(r.questionId)) byQuestion.set(r.questionId, []);
    byQuestion.get(r.questionId)!.push({ rating: r.rating });
  }

  const deprecated: string[] = [];
  const kept: string[] = [];

  for (const [questionId, questionRatings] of byQuestion) {
    const result = checkQuestionQuality(
      questionRatings.map((r) => ({ ...r, questionId })),
      config,
    );
    if (result.action === "deprecate") {
      await deprecateLowQualityQuestion(result.questionId);
      deprecated.push(result.questionId);
    } else {
      kept.push(result.questionId);
    }
  }

  return { deprecated, kept };
}
