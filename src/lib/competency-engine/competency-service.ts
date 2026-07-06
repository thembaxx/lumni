import { dexieDataAccess } from "@/lib/db";
import type { CompetencyDataAccess } from "@/lib/db/data-access";
import { enqueue } from "@/lib/orchestrator/job-queue";
import type { BloomLevel } from "@/lib/question-engine/types";
import { logError } from "@/lib/shared/logger";
import { enqueueOutbox } from "@/lib/sync/outbox";
import {
  type CompetencyLevel,
  type CompetencyRecord,
  computeCompetencyLevel,
  computeWeightedScore,
} from "./types";

export interface CompetencyDeps {
  db: CompetencyDataAccess;
  enqueue: (type: string, payload: Record<string, unknown>) => Promise<unknown>;
}

const DEFAULT_DEPS: CompetencyDeps = {
  db: dexieDataAccess,
  enqueue: enqueue as unknown as CompetencyDeps["enqueue"],
};

export class CompetencyService {
  private db: CompetencyDeps["db"];
  private enqueueFn: CompetencyDeps["enqueue"];

  constructor(deps?: Partial<CompetencyDeps>) {
    this.db = deps?.db ?? DEFAULT_DEPS.db;
    this.enqueueFn = deps?.enqueue ?? DEFAULT_DEPS.enqueue;
  }

  async update(
    subjectId: string,
    topicId: string,
    bloomLevel: BloomLevel,
    questionScore: number,
    weight: number,
    paperId?: string,
  ): Promise<void> {
    const existing = paperId
      ? await this.db.competencies
          .where("subjectId")
          .equals(subjectId)
          .filter(
            (c) => c.topicId === topicId && c.bloomLevel === bloomLevel && c.paperId === paperId,
          )
          .first()
      : await this.db.competencies
          .where("subjectId")
          .equals(subjectId)
          .filter((c) => c.topicId === topicId && c.bloomLevel === bloomLevel)
          .first();

    const newScore = existing
      ? computeWeightedScore(existing.score, existing.attempts, questionScore, weight)
      : questionScore;

    const newAttempts = (existing?.attempts ?? 0) + 1;
    const level = computeCompetencyLevel(newScore);
    const now = Date.now();

    if (existing?.id) {
      await this.db.competencies.update(existing.id, {
        score: newScore,
        attempts: newAttempts,
        lastAssessed: now,
        level,
      });
      enqueueOutbox("competencies", `${subjectId}:${topicId}:${bloomLevel}`, "update", {
        subjectId,
        topicId,
        bloomLevel,
        score: newScore,
        attempts: newAttempts,
        lastAssessed: now,
        level,
        paperId,
      }).catch((err) => logError("CompetencyService", err));
    } else {
      const record: CompetencyRecord = {
        subjectId,
        topicId,
        bloomLevel,
        score: newScore,
        attempts: newAttempts,
        lastAssessed: now,
        level,
      };
      if (paperId) record.paperId = paperId;
      await this.db.competencies.add(record);
      enqueueOutbox(
        "competencies",
        `${subjectId}:${topicId}:${bloomLevel}`,
        "create",
        record,
      ).catch((err) => logError("CompetencyService", err));
    }

    await this.enqueueFn("appwrite-competency-sync", {
      subjectId,
      topicId,
      bloomLevel,
      proficiency: newScore,
      attempts: newAttempts,
      lastAssessed: now,
      level,
      ...(paperId ? { paperId } : {}),
    });
  }

  async getCompetencies(subjectId: string): Promise<CompetencyRecord[]> {
    try {
      return this.db.competencies.where("subjectId").equals(subjectId).toArray();
    } catch (err) {
      logError("GetCompetencies", err);
      return [];
    }
  }

  async getCompetency(
    subjectId: string,
    topicId: string,
    bloomLevel: BloomLevel,
    paperId?: string,
  ): Promise<CompetencyRecord | null> {
    try {
      let coll = this.db.competencies
        .where("subjectId")
        .equals(subjectId)
        .filter((c) => c.topicId === topicId && c.bloomLevel === bloomLevel);
      if (paperId) {
        coll = coll.filter((c) => c.paperId === paperId);
      }
      return (await coll.first()) ?? null;
    } catch (err) {
      logError("GetCompetency", err);
      return null;
    }
  }

  async getMasterySummary(subjectId: string): Promise<{
    total: number;
    novice: number;
    developing: number;
    proficient: number;
    mastered: number;
    averageScore: number;
  }> {
    const records = await this.getCompetencies(subjectId);
    const count = (level: CompetencyLevel) => records.filter((r) => r.level === level).length;
    const avg = records.length > 0 ? records.reduce((s, r) => s + r.score, 0) / records.length : 0;

    return {
      total: records.length,
      novice: count("novice"),
      developing: count("developing"),
      proficient: count("proficient"),
      mastered: count("mastered"),
      averageScore: Math.round(avg * 100) / 100,
    };
  }

  async getCompetencyLevel(subjectId: string, topicId: string): Promise<CompetencyLevel | null> {
    const all = await this.getCompetencies(subjectId);
    const topicRecords = all.filter((r) => r.topicId === topicId);
    if (topicRecords.length === 0) return null;
    const avgScore = topicRecords.reduce((s, r) => s + r.score, 0) / topicRecords.length;
    return computeCompetencyLevel(avgScore);
  }

  async getCompetentTopicsCount(): Promise<number> {
    try {
      const records = await this.db.competencies.toArray();
      const topicScores = new Map<string, number[]>();
      for (const r of records) {
        const key = `${r.subjectId}:${r.topicId}`;
        const scores = topicScores.get(key) ?? [];
        scores.push(r.score);
        topicScores.set(key, scores);
      }
      return Array.from(topicScores.values()).filter(
        (scores) => scores.reduce((a, b) => a + b, 0) / scores.length >= 70,
      ).length;
    } catch (err) {
      logError("getCompetentTopicsCount", err);
      return 0;
    }
  }
}

export const competencyService = new CompetencyService();
