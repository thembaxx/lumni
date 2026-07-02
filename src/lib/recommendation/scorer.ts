import type { ActionKind } from "@/lib/retention-loop/next-action";

export interface ScoredRecommendation {
  kind: ActionKind;
  title: string;
  reason: string;
  ctaHref: string;
  ctaLabel: string;
  score: number;
  subject?: string;
  topic?: string;
}

export interface ScorerDeps {
  getDueCardsCount?: (userId: string) => Promise<number>;
  getWeakestTopic?: (
    userId: string,
  ) => Promise<{ subject: string; topic: string; score: number } | null>;
  getUpcomingExam?: (userId: string) => Promise<{ subject: string; daysUntil: number } | null>;
  getStudyPlanAdherence?: (userId: string) => Promise<number>;
  getHoursSinceLastPractice?: (userId: string) => Promise<number>;
}

const WEIGHT_EXAM = 0.35;
const WEIGHT_WEAK = 0.3;
const WEIGHT_CARDS = 0.2;
const WEIGHT_RECENCY = 0.15;

function examScore(daysUntil: number): number {
  if (daysUntil <= 30) {
    return ((30 - Math.max(0, daysUntil)) / 30) * 100;
  }
  return 0;
}

function weakTopicScore(score: number): number {
  if (score < 60) {
    return (60 - score) * 1.67;
  }
  return 0;
}

function dueCardsScore(count: number): number {
  return Math.min(count * 10, 100);
}

function recencyScore(hoursSince: number): number {
  return Math.min((hoursSince / 24) * 20, 100);
}

export async function getRankedRecommendations(
  userId: string,
  deps: ScorerDeps,
  limit: number = 5,
): Promise<ScoredRecommendation[]> {
  const [dueCount, weakest, exam, hoursSince] = await Promise.all([
    deps.getDueCardsCount?.(userId) ?? 0,
    deps.getWeakestTopic?.(userId) ?? null,
    deps.getUpcomingExam?.(userId) ?? null,
    deps.getHoursSinceLastPractice?.(userId) ?? 0,
  ]);

  const candidates: ScoredRecommendation[] = [];

  if (exam && exam.daysUntil <= 30) {
    const s = examScore(exam.daysUntil);
    if (s > 0) {
      candidates.push({
        kind: "exam-practice",
        title: `${exam.subject} exam in ${exam.daysUntil} days`,
        reason: `Your ${exam.subject} exam is in ${exam.daysUntil} days — time to drill past papers`,
        ctaHref: `/quiz?subject=${encodeURIComponent(exam.subject)}&count=10`,
        ctaLabel: "Practice now",
        score: s * WEIGHT_EXAM,
        subject: exam.subject,
      });
    }
  }

  if (weakest && weakest.score < 60) {
    const s = weakTopicScore(weakest.score) * WEIGHT_WEAK;
    candidates.push({
      kind: "weakest-topic",
      title: `Strengthen ${weakest.topic}`,
      reason: `${weakest.topic} in ${weakest.subject} is at ${weakest.score}% — targeted practice will help`,
      ctaHref: `/quiz?subject=${encodeURIComponent(weakest.subject)}&topic=${encodeURIComponent(weakest.topic)}&count=10`,
      ctaLabel: "Practice topic",
      score: s,
      subject: weakest.subject,
      topic: weakest.topic,
    });
  }

  if (dueCount > 0) {
    const s = dueCardsScore(dueCount) * WEIGHT_CARDS;
    candidates.push({
      kind: "due-cards",
      title: `${dueCount} flashcards due`,
      reason: `You have ${dueCount} cards waiting — a quick review keeps retention`,
      ctaHref: "/flashcards",
      ctaLabel: "Review cards",
      score: s,
    });
  }

  if (hoursSince > 0) {
    const s = recencyScore(hoursSince) * WEIGHT_RECENCY;
    const h = Math.round(hoursSince);
    candidates.push({
      kind: "review-mistakes",
      title: h >= 12 ? "Time to practice" : "Quick review available",
      reason:
        h >= 24
          ? `It's been ${Math.floor(h / 24)} day${Math.floor(h / 24) > 1 ? "s" : ""} since your last practice`
          : `You last practiced ${h} hour${h > 1 ? "s" : ""} ago`,
      ctaHref: "/quiz",
      ctaLabel: "Start practice",
      score: s,
    });
  }

  return candidates.toSorted((a, b) => b.score - a.score).slice(0, limit);
}
