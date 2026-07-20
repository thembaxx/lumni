import type { BloomLevel, Difficulty, Question } from "@/lib/question-engine/types";
import type { CompetencyRecord } from "@/lib/competency-engine/types";
import { computeCompetencyLevel } from "@/lib/competency-engine/types";
import {
  mapCompetencyToBloom,
  mapCompetencyToDifficulty,
} from "@/lib/question-engine/competency-mapper";
import type { RetentionRecurrence } from "@/lib/db/types";
import type { DataAccessTable } from "@/lib/db/data-access";
import { logError } from "@/lib/shared/logger";

export interface RetentionQuestion {
  id: string;
  questionText: string;
  correctAnswer: string;
  explanation: string;
  subject: string;
  topic: string;
}

export interface QuizCompetencyData {
  topicCompetencyLevel?: "novice" | "developing" | "proficient" | "mastered";
  topicCompetencyScore?: number;
  suggestedBloomLevel?: BloomLevel;
  suggestedDifficulty?: Difficulty;
}

export interface EngineParams {
  subject: string;
  topic?: string;
  count: number;
  questionType: "any";
  pastPaperMode?: boolean;
  suggestedBloomLevel?: BloomLevel;
  suggestedDifficulty?: Difficulty;
  topicCompetencyLevel?: "novice" | "developing" | "proficient" | "mastered";
  topicCompetencyScore?: number;
}

export function buildEngineParams(
  selectedSubject: string,
  resolvedTopic: string | undefined,
  actualCount: number,
  pastPaperMode?: boolean,
  competencyData?: QuizCompetencyData,
): EngineParams {
  return {
    subject: selectedSubject.toLowerCase(),
    topic: resolvedTopic,
    count: actualCount,
    questionType: "any" as const,
    ...(pastPaperMode ? { pastPaperMode: true } : {}),
    ...(competencyData?.suggestedBloomLevel
      ? { suggestedBloomLevel: competencyData.suggestedBloomLevel }
      : {}),
    ...(competencyData?.suggestedDifficulty
      ? { suggestedDifficulty: competencyData.suggestedDifficulty }
      : {}),
    ...(competencyData?.topicCompetencyLevel
      ? { topicCompetencyLevel: competencyData.topicCompetencyLevel }
      : {}),
    ...(competencyData?.topicCompetencyScore !== undefined
      ? { topicCompetencyScore: competencyData.topicCompetencyScore }
      : {}),
  };
}

export function mapRetentionToQuestions(retentionQuestions: RetentionQuestion[]): Question[] {
  return retentionQuestions.map((rq) => ({
    id: `ret_${rq.id}`,
    type: "short-answer" as const,
    subject: rq.subject,
    topic: rq.topic,
    difficulty: "Medium" as const,
    bloomTaxonomy: "remember" as BloomLevel,
    points: 1,
    questionText: rq.questionText,
    hint: "",
    explanation: rq.explanation,
    steps: ["Review the correct answer below."],
    body: {
      modelAnswer: rq.correctAnswer,
      acceptableAnswers: [rq.correctAnswer],
      maxLength: 500,
    },
    metadata: { source: "imported" },
  }));
}

export async function loadRetentionQuestions(
  db: { retentionRecurrence: DataAccessTable<RetentionRecurrence, number> },
  normalizedSubject: string,
  now: number,
): Promise<RetentionQuestion[]> {
  const items = await db.retentionRecurrence.where("scheduledAt").belowOrEqual(now).toArray();
  const overdue = items.filter((i) => !i.completed && i.subject === normalizedSubject);
  return overdue.slice(0, 3).map((i) => ({
    id: i.questionId,
    questionText: i.questionText,
    correctAnswer: i.correctAnswer,
    explanation: i.explanation,
    subject: i.subject,
    topic: i.topic,
  }));
}

export async function markRetentionCompleted(
  db: { retentionRecurrence: DataAccessTable<RetentionRecurrence, number> },
  ids: string[],
): Promise<void> {
  try {
    await db.retentionRecurrence.where("questionId").anyOf(ids).modify({ completed: true });
  } catch (e) {
    logError("markRetentionCompleted", e);
  }
}

export function computeTopicCompetency(
  competencies: CompetencyRecord[],
  targetTopic: string,
): QuizCompetencyData {
  const topicComps = competencies.filter((c) => c.topicId === targetTopic);
  if (topicComps.length === 0) return {};

  const avgScore = topicComps.reduce((s, c) => s + c.score, 0) / topicComps.length;
  const level = computeCompetencyLevel(avgScore);
  return {
    topicCompetencyLevel: level,
    topicCompetencyScore: Math.round(avgScore),
    suggestedBloomLevel: mapCompetencyToBloom(level, avgScore),
    suggestedDifficulty: mapCompetencyToDifficulty(level),
  };
}
