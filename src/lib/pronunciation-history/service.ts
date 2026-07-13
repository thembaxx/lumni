import { dexieDataAccess } from "@/lib/db";
import type { PronunciationDataAccess } from "@/lib/db/data-access";
import { logError } from "@/lib/shared/logger";

export interface PronunciationScoreRecord {
  id?: number;
  userId: string;
  word: string;
  overallScore: number;
  wordAccuracy: number;
  phonemeAccuracy: number;
  fluencyScore: number;
  language: string;
  attemptedAt: number;
}

const DEFAULT_DEPS = Object.freeze({ db: dexieDataAccess });
let _deps: { db: PronunciationDataAccess } = DEFAULT_DEPS;

export function __setDepsForTesting(deps: { db: PronunciationDataAccess }) {
  _deps = Object.freeze({ ...deps });
}

export async function savePronunciationScore(
  userId: string,
  word: string,
  overallScore: number,
  wordAccuracy: number,
  phonemeAccuracy: number,
  fluencyScore: number,
  language: string,
): Promise<void> {
  try {
    const entry: Omit<PronunciationScoreRecord, "id"> = {
      userId,
      word,
      overallScore,
      wordAccuracy,
      phonemeAccuracy,
      fluencyScore,
      language,
      attemptedAt: Date.now(),
    };
    await _deps.db.pronunciationHistory.add(entry);
  } catch (err) {
    logError("PronunciationHistory.save", err);
  }
}

export async function getPronunciationHistory(
  userId: string,
  limit = 50,
): Promise<PronunciationScoreRecord[]> {
  try {
    const all = await _deps.db.pronunciationHistory.where("userId").equals(userId).toArray();
    all.sort((a, b) => b.attemptedAt - a.attemptedAt);
    return all.slice(0, limit);
  } catch (err) {
    logError("PronunciationHistory.get", err);
    return [];
  }
}

export async function getPronunciationStats(userId: string): Promise<{
  totalAttempts: number;
  averageScore: number;
  recentScores: { date: string; score: number }[];
  topWords: { word: string; count: number; avgScore: number }[];
}> {
  try {
    const all = await _deps.db.pronunciationHistory.where("userId").equals(userId).toArray();

    if (all.length === 0) {
      return { totalAttempts: 0, averageScore: 0, recentScores: [], topWords: [] };
    }

    const totalScore = all.reduce((sum, e) => sum + e.overallScore, 0);
    const averageScore = Math.round(totalScore / all.length);

    // Last 20 scores by day for the chart
    const recent = all
      .toSorted((a, b) => b.attemptedAt - a.attemptedAt)
      .slice(0, 20)
      .toReversed()
      .map((e) => ({
        date: new Date(e.attemptedAt).toLocaleDateString("en-ZA", {
          month: "short",
          day: "numeric",
        }),
        score: e.overallScore,
      }));

    // Top practiced words
    const wordMap = new Map<string, { count: number; totalScore: number }>();
    for (const e of all) {
      const existing = wordMap.get(e.word) ?? { count: 0, totalScore: 0 };
      existing.count++;
      existing.totalScore += e.overallScore;
      wordMap.set(e.word, existing);
    }
    const topWords = [...wordMap.entries()]
      .map(([word, data]) => ({
        word,
        count: data.count,
        avgScore: Math.round(data.totalScore / data.count),
      }))
      .toSorted((a, b) => b.count - a.count)
      .slice(0, 5);

    return { totalAttempts: all.length, averageScore, recentScores: recent, topWords };
  } catch (err) {
    logError("PronunciationHistory.stats", err);
    return { totalAttempts: 0, averageScore: 0, recentScores: [], topWords: [] };
  }
}
