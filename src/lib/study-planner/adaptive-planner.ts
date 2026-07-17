import { dexieDataAccess } from "@/lib/db";
import type { CompetencyDataAccess } from "@/lib/db/data-access";
import { fetchGraph } from "@/lib/knowledge-graph/service";
import type { CompetencyRecord, CompetencyLevel } from "@/lib/competency-engine/types";
import type { BloomLevel } from "@/lib/question-engine/types";
import { logError } from "@/lib/shared/logger";

export const SUBJECT_WEIGHTS: Record<string, number> = {
  mathematics: 0.15,
  "physical-sciences": 0.12,
  "life-sciences": 0.1,
  geography: 0.08,
  history: 0.08,
  accounting: 0.08,
  "business-studies": 0.07,
  economics: 0.07,
  english: 0.08,
  afrikaans: 0.08,
  "isi-zulu": 0.08,
  "isi-xhosa": 0.07,
  sepedi: 0.07,
  sesotho: 0.07,
  setswana: 0.07,
  "tshi-venda": 0.05,
  xitsonga: 0.05,
  "si-swati": 0.05,
  isindebele: 0.05,
  "computer-applications-technology": 0.05,
  "information-technology": 0.05,
  "engineering-graphics-and-design": 0.04,
  "agricultural-sciences": 0.06,
  "agricultural-management-practices": 0.04,
  "agricultural-technology": 0.04,
  "dramatic-arts": 0.03,
  "visual-arts": 0.03,
  music: 0.03,
  design: 0.03,
  tourism: 0.04,
  "hospitality-studies": 0.04,
  "consumer-studies": 0.04,
  "religion-studies": 0.03,
};

const SUBJECT_NAMES: Record<string, string> = {
  mathematics: "Mathematics",
  "physical-sciences": "Physical Sciences",
  "life-sciences": "Life Sciences",
  geography: "Geography",
  history: "History",
  accounting: "Accounting",
  "business-studies": "Business Studies",
  economics: "Economics",
  english: "English Home Language",
  afrikaans: "Afrikaans Huistaal",
  "isi-zulu": "isiZulu Home Language",
  "isi-xhosa": "isiXhosa Home Language",
  sepedi: "Sepedi Home Language",
  sesotho: "Sesotho Home Language",
  setswana: "Setswana Home Language",
  "tshi-venda": "Tshivenda Home Language",
  xitsonga: "Xitsonga Home Language",
  "si-swati": "Siswati Home Language",
  isindebele: "isiNdebele Home Language",
  "computer-applications-technology": "CAT",
  "information-technology": "IT",
  "engineering-graphics-and-design": "EGD",
  "agricultural-sciences": "Agricultural Sciences",
  "agricultural-management-practices": "Agricultural Management",
  "agricultural-technology": "Agricultural Technology",
  "dramatic-arts": "Dramatic Arts",
  "visual-arts": "Visual Arts",
  music: "Music",
  design: "Design",
  tourism: "Tourism",
  "hospitality-studies": "Hospitality Studies",
  "consumer-studies": "Consumer Studies",
  "religion-studies": "Religion Studies",
};

export interface AdaptivePlanRequest {
  targetAps: number;
  dailyMinutes: number;
  horizonDays: number;
  weakTopicsOnly?: boolean;
  subjectIds?: string[];
}

export interface AdaptivePlanResponse {
  sessions: StudySession[];
  competencyGaps: CompetencyGap[];
  projectedAps: number;
  confidence: number;
  generatedAt: string;
}

export interface StudySession {
  id: string;
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  scheduledDate: string;
  durationMinutes: number;
  bloomLevel: "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create";
  difficulty: "Easy" | "Medium" | "Hard";
  questionCount: number;
  isWeakTopic: boolean;
}

export interface TopicGap {
  subjectId: string;
  topicId: string;
  currentScore: number;
  gap: number;
}

export interface CompetencyGap {
  subjectId: string;
  subjectName: string;
  avgScore: number;
  topicCount: number;
  weakTopics: TopicGap[];
}

function computeCompetencyLevel(score: number): CompetencyLevel {
  if (score >= 85) return "mastered";
  if (score >= 65) return "proficient";
  if (score >= 40) return "developing";
  return "novice";
}

function competencyLevelToWeight(level: CompetencyLevel): number {
  switch (level) {
    case "novice":
      return 4;
    case "developing":
      return 3;
    case "proficient":
      return 2;
    case "mastered":
      return 1;
    default: {
      const _exhaustive: never = level;
      logError("adaptive-planner", new Error(`Unknown competency level: ${_exhaustive}`));
      return 2;
    }
  }
}

function bloomLevelToDifficulty(level: string): "Easy" | "Medium" | "Hard" {
  const lower = level.toLowerCase();
  if (["remember", "understand"].includes(lower)) return "Easy";
  if (["apply"].includes(lower)) return "Medium";
  return "Hard";
}

function bloomLevelToQuestionCount(difficulty: "Easy" | "Medium" | "Hard"): number {
  switch (difficulty) {
    case "Easy":
      return 8;
    case "Medium":
      return 6;
    case "Hard":
      return 4;
    default:
      return 6;
  }
}

interface ExtendedCompetencyRecord extends CompetencyRecord {
  userId?: string;
  difficulty?: "Easy" | "Medium" | "Hard";
}

async function fetchCompetencies(
  db: CompetencyDataAccess,
  userId: string | null,
  subjectIds?: string[],
): Promise<ExtendedCompetencyRecord[]> {
  const subjects = subjectIds ?? Object.keys(SUBJECT_WEIGHTS);
  const allRecords: ExtendedCompetencyRecord[] = [];

  for (const subject of subjects) {
    const records = await db.competencies.where("subjectId").equals(subject).toArray();

    if (userId) {
      for (const r of records) {
        if (
          (r as ExtendedCompetencyRecord).userId === userId ||
          !(r as ExtendedCompetencyRecord).userId
        ) {
          allRecords.push(r as ExtendedCompetencyRecord);
        }
      }
    } else {
      allRecords.push(...(records as ExtendedCompetencyRecord[]));
    }
  }

  return allRecords;
}

export function detectWeakTopics(competencies: ExtendedCompetencyRecord[]): TopicGap[] {
  const gaps: TopicGap[] = [];

  for (const c of competencies) {
    if (!c.topicId) continue;

    const targetScore = c.level === "mastered" ? 90 : c.level === "proficient" ? 80 : 70;
    if (c.score < targetScore) {
      gaps.push({
        subjectId: c.subjectId,
        topicId: c.topicId,
        currentScore: c.score,
        gap: targetScore - c.score,
      });
    }
  }

  return gaps.toSorted((a, b) => b.gap - a.gap);
}

export function computeCompetencyGaps(
  competencies: ExtendedCompetencyRecord[],
  weakTopics: TopicGap[],
): CompetencyGap[] {
  const bySubject = new Map<string, ExtendedCompetencyRecord[]>();

  for (const c of competencies) {
    if (!bySubject.has(c.subjectId)) {
      bySubject.set(c.subjectId, []);
    }
    bySubject.get(c.subjectId)!.push(c);
  }

  const gaps: CompetencyGap[] = [];

  for (const [subjectId, subjectCompetencies] of bySubject) {
    const weakTopicsForSubject = weakTopics.filter((t) => t.subjectId === subjectId);
    const avgScore =
      subjectCompetencies.length > 0
        ? subjectCompetencies.reduce((sum, c) => sum + c.score, 0) / subjectCompetencies.length
        : 50;

    gaps.push({
      subjectId,
      subjectName: SUBJECT_NAMES[subjectId] ?? subjectId,
      avgScore: Math.round(avgScore),
      topicCount: subjectCompetencies.length,
      weakTopics: weakTopicsForSubject,
    });
  }

  return gaps.toSorted((a, b) => a.avgScore - b.avgScore);
}

export function projectAps(competencyGaps: CompetencyGap[]): number {
  let totalWeightedScore = 0;
  let totalWeight = 0;

  for (const gap of competencyGaps) {
    const weight = SUBJECT_WEIGHTS[gap.subjectId] ?? 0.05;
    totalWeightedScore += gap.avgScore * weight;
    totalWeight += weight;
  }

  const aps = totalWeight > 0 ? totalWeightedScore / totalWeight : 50;
  return Math.round(Math.min(100, Math.max(0, aps)));
}

export function calculateConfidence(
  competencies: ExtendedCompetencyRecord[],
  totalTopicsEstimate = 150,
): number {
  const assessedTopics = competencies.length;
  if (assessedTopics === 0) return 0;

  const coverage = assessedTopics / totalTopicsEstimate;
  const recentThreshold = Date.now() - 14 * 24 * 60 * 60 * 1000;
  const recentAssessments = competencies.filter((c) => c.lastAssessed > recentThreshold).length;
  const recency = assessedTopics > 0 ? recentAssessments / assessedTopics : 0;

  return Math.round((coverage * 0.6 + recency * 0.4) * 100) / 100;
}

export function generateSessions(
  weakTopics: TopicGap[],
  competencyGaps: CompetencyGap[],
  dailyMinutes: number,
  horizonDays: number,
  startDate: Date,
): StudySession[] {
  const sessions: StudySession[] = [];

  const topicQueue: Array<{ gap: TopicGap; weight: number }> = [];

  for (const gap of weakTopics) {
    const weight = competencyLevelToWeight(computeCompetencyLevel(gap.currentScore));
    topicQueue.push({ gap, weight });
  }

  topicQueue.sort((a, b) => b.weight - a.weight);

  let dayOffset = 0;
  let currentDate = new Date(startDate);
  const studyDays = new Set([1, 2, 3, 4, 5]);
  let topicIndex = 0;
  const totalTopics = topicQueue.length;

  while (dayOffset < horizonDays && topicIndex < totalTopics) {
    const dayOfWeek = currentDate.getDay();
    if (!studyDays.has(dayOfWeek)) {
      currentDate.setDate(currentDate.getDate() + 1);
      dayOffset++;
      continue;
    }

    const minutesAvailable = dailyMinutes;
    let minutesUsed = 0;
    const subjectsToday = new Set<string>();

    while (minutesUsed < minutesAvailable && topicIndex < totalTopics && subjectsToday.size < 3) {
      const { gap, weight } = topicQueue[topicIndex];

      if (subjectsToday.has(gap.subjectId)) {
        topicIndex++;
        continue;
      }

      const difficulty = bloomLevelToDifficulty(computeCompetencyLevel(gap.currentScore));
      const questionCount = bloomLevelToQuestionCount(difficulty);
      const sessionMinutes = Math.min(30, minutesAvailable - minutesUsed);
      const bloomLevel =
        difficulty === "Easy" ? "understand" : difficulty === "Medium" ? "apply" : "analyze";

      sessions.push({
        id: `session_${Date.now()}_${topicIndex}`,
        subjectId: gap.subjectId,
        subjectName: SUBJECT_NAMES[gap.subjectId] ?? gap.subjectId,
        topicId: gap.topicId,
        topicName: gap.topicId.replace(/-/g, " "),
        scheduledDate: currentDate.toISOString().split("T")[0],
        durationMinutes: sessionMinutes,
        bloomLevel,
        difficulty,
        questionCount,
        isWeakTopic: true,
      });

      minutesUsed += sessionMinutes;
      subjectsToday.add(gap.subjectId);
      topicIndex++;
    }

    currentDate.setDate(currentDate.getDate() + 1);
    dayOffset++;
  }

  return sessions;
}

async function sortByPrerequisites(topics: TopicGap[]): Promise<TopicGap[]> {
  const bySubject = new Map<string, TopicGap[]>();
  for (const t of topics) {
    if (!bySubject.has(t.subjectId)) {
      bySubject.set(t.subjectId, []);
    }
    bySubject.get(t.subjectId)!.push(t);
  }

  const result: TopicGap[] = [];

  for (const [subjectId, subjectTopics] of bySubject) {
    try {
      const graph = await fetchGraph(subjectId, "general");
      if (!graph || graph.edges.length === 0) {
        result.push(...subjectTopics);
        continue;
      }

      const edges = graph.edges.filter(
        (e) => e.relation === "requires" || e.relation === "prerequisite",
      );
      if (edges.length === 0) {
        result.push(...subjectTopics);
        continue;
      }

      const inDegree = new Map<string, number>();
      const adj = new Map<string, string[]>();
      const allNodes = new Set<string>();

      for (const node of graph.nodes) {
        allNodes.add(node.id);
        if (!inDegree.has(node.id)) inDegree.set(node.id, 0);
        if (!adj.has(node.id)) adj.set(node.id, []);
      }

      for (const edge of edges) {
        allNodes.add(edge.from);
        allNodes.add(edge.to);
        if (!inDegree.has(edge.from)) inDegree.set(edge.from, 0);
        if (!inDegree.has(edge.to)) inDegree.set(edge.to, 0);
        if (!adj.has(edge.from)) adj.set(edge.from, []);
        inDegree.set(edge.to, (inDegree.get(edge.to) ?? 0) + 1);
        adj.get(edge.from)!.push(edge.to);
      }

      const queue: string[] = [];
      for (const node of allNodes) {
        if ((inDegree.get(node) ?? 0) === 0) queue.push(node);
      }

      const sorted: string[] = [];
      while (queue.length > 0) {
        const node = queue.shift()!;
        sorted.push(node);
        for (const neighbor of adj.get(node) ?? []) {
          const newDegree = (inDegree.get(neighbor) ?? 1) - 1;
          inDegree.set(neighbor, newDegree);
          if (newDegree === 0) queue.push(neighbor);
        }
      }

      const topicSet = new Set(subjectTopics.map((t) => t.topicId));
      const sortedTopics = sorted.filter((id) => topicSet.has(id));
      const lookup = new Map(subjectTopics.map((t) => [t.topicId, t]));

      const ordered = sortedTopics.flatMap((id) => {
        const t = lookup.get(id);
        return t ? [t] : [];
      });

      const remaining = subjectTopics.filter((t) => !sortedTopics.includes(t.topicId));
      result.push(...ordered, ...remaining);
    } catch {
      result.push(...subjectTopics);
    }
  }

  return result;
}

export class AdaptiveStudyPlanner {
  constructor(private competencyDb: CompetencyDataAccess = dexieDataAccess) {}

  async generateAdaptivePlan(
    config: AdaptivePlanRequest,
    userId: string | null,
  ): Promise<AdaptivePlanResponse> {
    const competencies = await fetchCompetencies(this.competencyDb, userId, config.subjectIds);

    const weakTopics = await sortByPrerequisites(this.detectWeakTopics(competencies));

    const topicsToSchedule = config.weakTopicsOnly ? weakTopics : weakTopics;

    const competencyGaps = this.computeCompetencyGaps(competencies, weakTopics);

    const projectedAps = this.projectAps(competencyGaps);

    const confidence = this.calculateConfidence(competencies);

    const startDate = new Date();
    const sessions = this.generateSessions(
      topicsToSchedule,
      competencyGaps,
      config.dailyMinutes,
      config.horizonDays,
      startDate,
    );

    return {
      sessions,
      competencyGaps,
      projectedAps,
      confidence,
      generatedAt: new Date().toISOString(),
    };
  }

  private detectWeakTopics = detectWeakTopics;
  private computeCompetencyGaps = computeCompetencyGaps;
  private projectAps = projectAps;
  private calculateConfidence = calculateConfidence;
  private generateSessions = generateSessions;
}

export const adaptiveStudyPlanner = new AdaptiveStudyPlanner();
