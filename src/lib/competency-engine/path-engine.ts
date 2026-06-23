import { curriculumRegistry } from "@/curriculum";
import type { KnowledgeGraph } from "@/lib/knowledge-graph/types";
import type { CompetencyLevel, CompetencyRecord } from "./types";

export interface TopicRecommendation {
  topicId: string;
  name: string;
  level: CompetencyLevel | "unknown";
  reason:
    | "prerequisite-not-met"
    | "ready-to-start"
    | "needs-practice"
    | "needs-review"
    | "mastered";
  action: "study" | "practice" | "review" | "skip";
  estimatedMinutes: number;
}

export interface StudyPlanDay {
  day: number;
  date: string;
  sessions: {
    subjectId: string;
    topicId: string;
    name: string;
    action: "study" | "practice" | "review";
    minutes: number;
  }[];
}

export interface NextAction {
  subjectId: string;
  topicId: string;
  name: string;
  action: "study" | "practice" | "review";
  reason: string;
}

export class PathEngine {
  async getNextTopics(
    subjectId: string,
    competencies: Map<string, CompetencyRecord>,
  ): Promise<TopicRecommendation[]> {
    const subject = await curriculumRegistry.getSubject(subjectId);
    if (!subject) return [];

    const masteredTopics = new Set<string>();
    for (const [key, record] of competencies) {
      const [, topicId] = key.split(":");
      if (topicId && record.level === "mastered") {
        masteredTopics.add(topicId);
      }
    }

    const recommendations: TopicRecommendation[] = [];

    const topicLevels = await Promise.all(
      subject.topics.map((topic) => this.getTopicLevel(subjectId, topic.id, competencies)),
    );

    for (const [idx, topic] of subject.topics.entries()) {
      const prereqsMet = topic.prerequisites.every((p) => masteredTopics.has(p));
      if (!prereqsMet) {
        recommendations.push({
          topicId: topic.id,
          name: topic.name,
          level: "unknown",
          reason: "prerequisite-not-met",
          action: "skip",
          estimatedMinutes: 0,
        });
        continue;
      }

      const level = topicLevels[idx];

      if (level === "mastered") {
        recommendations.push({
          topicId: topic.id,
          name: topic.name,
          level,
          reason: "mastered",
          action: "skip",
          estimatedMinutes: 0,
        });
        continue;
      }

      if (level === "proficient") {
        recommendations.push({
          topicId: topic.id,
          name: topic.name,
          level,
          reason: "needs-review",
          action: "review",
          estimatedMinutes: 15,
        });
        continue;
      }

      if (level === "developing") {
        recommendations.push({
          topicId: topic.id,
          name: topic.name,
          level,
          reason: "needs-practice",
          action: "practice",
          estimatedMinutes: 30,
        });
        continue;
      }

      recommendations.push({
        topicId: topic.id,
        name: topic.name,
        level: level ?? "unknown",
        reason: "ready-to-start",
        action: "study",
        estimatedMinutes: 45,
      });
    }

    const priorityOrder: Record<string, number> = {
      study: 0,
      practice: 1,
      review: 2,
      skip: 3,
    };

    return recommendations.toSorted((a, b) => priorityOrder[a.action] - priorityOrder[b.action]);
  }

  async getNextAction(
    subjects: string[],
    competencyMap: Map<string, CompetencyRecord>,
  ): Promise<NextAction | null> {
    const allRecommendations: {
      subjectId: string;
      rec: TopicRecommendation;
    }[] = [];

    const subjectRecs = await Promise.all(
      subjects.map((subjectId) =>
        this.getNextTopics(subjectId, competencyMap).then((recs) =>
          recs.flatMap((rec) => (rec.action !== "skip" ? [{ subjectId, rec }] : [])),
        ),
      ),
    );
    for (const recs of subjectRecs) {
      allRecommendations.push(...recs);
    }

    if (allRecommendations.length === 0) return null;

    const best = allRecommendations[0];
    return {
      subjectId: best.subjectId,
      topicId: best.rec.topicId,
      name: best.rec.name,
      action: best.rec.action as "study" | "practice" | "review",
      reason: best.rec.reason,
    };
  }

  async generateStudyPlan(
    subjects: string[],
    competencyMap: Map<string, CompetencyRecord>,
    days = 7,
    dailyGoalMinutes = 30,
  ): Promise<StudyPlanDay[]> {
    const today = new Date();

    const dayResults = await Promise.all(
      Array.from({ length: days }, async (_, d) => {
        const date = new Date(today);
        date.setDate(date.getDate() + d);

        const sessions: StudyPlanDay["sessions"] = [];
        let minutesUsed = 0;

        const subjectRecs = await Promise.all(
          subjects.map((subjectId) =>
            this.getNextTopics(subjectId, competencyMap).then((recs) => ({
              subjectId,
              recs,
            })),
          ),
        );
        for (const { subjectId, recs } of subjectRecs) {
          if (minutesUsed >= dailyGoalMinutes) break;
          for (const rec of recs) {
            if (minutesUsed >= dailyGoalMinutes) break;
            if (rec.action === "skip") continue;

            const minutes = Math.min(rec.estimatedMinutes, dailyGoalMinutes - minutesUsed);
            sessions.push({
              subjectId,
              topicId: rec.topicId,
              name: rec.name,
              action: rec.action as "study" | "practice" | "review",
              minutes,
            });
            minutesUsed += minutes;
          }
        }

        return {
          day: d + 1,
          date: date.toISOString().split("T")[0],
          sessions,
        };
      }),
    );

    return dayResults.toSorted((a, b) => a.day - b.day);
  }

  getAdvancedFromGraph(
    graph: KnowledgeGraph,
    masteredLabels: string[],
    maxResults = 3,
  ): { label: string; type: string }[] {
    const masteredSet = new Set(masteredLabels.map((l) => l.toLowerCase()));
    const advanced: { label: string; type: string }[] = [];

    const relevantEdges = graph.edges.filter(
      (e) => masteredSet.has(e.from.toLowerCase()) && e.relation === "leads_to",
    );

    const nodeMap = new Map<string, (typeof graph.nodes)[0]>();
    for (const n of graph.nodes) {
      if (n.type === "advanced" || n.type === "core") {
        nodeMap.set(n.id, n);
      }
    }

    for (const edge of relevantEdges) {
      const node = nodeMap.get(edge.to);
      if (node && !masteredSet.has(node.label.toLowerCase())) {
        advanced.push({ label: node.label, type: node.type });
        if (advanced.length >= maxResults) break;
      }
    }

    return advanced;
  }

  private async getTopicLevel(
    subjectId: string,
    topicId: string,
    competencies: Map<string, CompetencyRecord>,
  ): Promise<CompetencyLevel | null> {
    const allRecords: CompetencyRecord[] = [];
    for (const [, record] of competencies) {
      if (record.subjectId === subjectId && record.topicId === topicId) {
        allRecords.push(record);
      }
    }

    if (allRecords.length === 0) return null;

    const avg = allRecords.reduce((s, r) => s + r.score, 0) / allRecords.length;

    const { computeCompetencyLevel } = await import("./types");
    return computeCompetencyLevel(avg);
  }
}

export const pathEngine = new PathEngine();
