import { Effect } from "effect";
import { dexieDataAccess as _dexieDa } from "@/lib/db";
import type { DataAccess } from "@/lib/db/data-access";
import { getCurrentSession } from "@/lib/exam-dates/types";
import { logError } from "@/lib/shared/logger";
import {
  getRankedRecommendations,
  type ScoredRecommendation,
  type ScorerDeps,
} from "@/lib/recommendation";

const DEFAULT_DEPS = Object.freeze({ db: _dexieDa });
let _deps = DEFAULT_DEPS;

export function __setDepsForTesting(deps: { db: DataAccess }) {
  _deps = Object.freeze({ ...deps });
}

export type ActionKind =
  | "weakest-topic"
  | "exam-practice"
  | "due-cards"
  | "study-plan"
  | "flashcards"
  | "review-mistakes";

export interface NextAction {
  kind: ActionKind;
  reason: string;
  ctaHref: string;
  ctaLabel: string;
  title: string;
  subject?: string;
  topic?: string;
  expiresAt: number;
}

const DISMISS_KEY = "lumni_next_action_dismiss";

function getDismissed(): Map<string, number> {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    return raw ? new Map(JSON.parse(raw)) : new Map();
  } catch {
    return new Map();
  }
}

function setDismissed(kind: ActionKind, durationMs: number): void {
  try {
    const map = getDismissed();
    map.set(kind, Date.now() + durationMs);
    localStorage.setItem(DISMISS_KEY, JSON.stringify([...map]));
  } catch {
    // Silent
  }
}

function isDismissed(kind: ActionKind): boolean {
  const map = getDismissed();
  const until = map.get(kind);
  return until != null && until > Date.now();
}

export function dismissAction(kind: ActionKind): void {
  setDismissed(kind, 24 * 60 * 60 * 1000);
}

export function dismissActionEffect(kind: ActionKind): Effect.Effect<void> {
  return Effect.sync(() => setDismissed(kind, 24 * 60 * 60 * 1000));
}

function getTimeOfDay(): "morning" | "afternoon" | "evening" {
  const h = new Date().getHours();
  if (h < 12) {
    return "morning";
  }
  if (h < 17) {
    return "afternoon";
  }
  return "evening";
}

function getDueCardCountEffect(): Effect.Effect<number> {
  return Effect.tryPromise(async () => {
    const now = Date.now();
    const allCards = await _deps.db.flashcards.toArray();
    return allCards.filter((c) => c.nextReview <= now).length;
  }).pipe(Effect.catchAll(() => Effect.succeed(0)));
}

function getOverdueRetentionItemsEffect(): Effect.Effect<{ subject: string; topic: string }[]> {
  return Effect.tryPromise(async () => {
    const now = Date.now();
    const items = await _deps.db.retentionRecurrence
      .where("scheduledAt")
      .belowOrEqual(now)
      .toArray();
    const result: { subject: string; topic: string }[] = [];
    for (const i of items) {
      if (!i.completed) {
        result.push({ subject: i.subject, topic: i.topic });
      }
    }
    return result;
  }).pipe(Effect.catchAll(() => Effect.succeed([])));
}

function getWeakestTopicEffect(_userId?: string): Effect.Effect<{
  subject: string;
  topic: string;
  score: number;
} | null> {
  return Effect.tryPromise(async () => {
    const competencies = await _deps.db.competencies.toArray();
    if (competencies.length === 0) {
      return null;
    }

    let weakest: { subjectId: string; topicId: string; score: number } | null = null;
    for (const c of competencies) {
      const score = typeof c.score === "number" ? c.score : 0;
      if (!weakest || score < weakest.score) {
        weakest = { score, subjectId: c.subjectId, topicId: c.topicId };
      }
    }
    if (!weakest) {
      return null;
    }

    const subject = await _deps.db.subjects.where("code").equals(weakest.subjectId).first();
    const subjectName = subject?.name ?? weakest.subjectId;
    const topicName = weakest.topicId
      .replaceAll(/-/g, " ")
      .replaceAll(/\b\w/g, (l: string) => l.toUpperCase());

    return { score: weakest.score, subject: subjectName, topic: topicName };
  }).pipe(Effect.catchAll(() => Effect.succeed(null)));
}

export function resolveNextActionEffect(userId?: string): Effect.Effect<NextAction | null> {
  return Effect.gen(function* () {
    const tod = getTimeOfDay();

    const dueCount = yield* getDueCardCountEffect();
    if (dueCount > 5 && !isDismissed("due-cards")) {
      return {
        ctaHref: "/flashcards",
        ctaLabel: `Review ${dueCount} cards`,
        expiresAt: Date.now() + 3600000,
        kind: "due-cards" as ActionKind,
        reason: `You have ${dueCount} cards waiting — a quick review keeps your streak alive`,
        title: `${dueCount} flashcards due!`,
      };
    }

    const overdueItems = yield* getOverdueRetentionItemsEffect();
    if (overdueItems.length > 0 && !isDismissed("review-mistakes")) {
      const { subject } = overdueItems[0];
      return {
        ctaHref: "/review",
        ctaLabel: "Review mistakes",
        expiresAt: Date.now() + 3600000,
        kind: "review-mistakes" as ActionKind,
        reason: "You have overdue review items",
        subject,
        title: "Review mistakes",
      };
    }

    const weakest = yield* getWeakestTopicEffect(userId);
    if (weakest && !isDismissed("weakest-topic")) {
      const session = getCurrentSession();
      const daysUntil = session ? getDaysUntilExam(session, weakest.subject) : null;
      const daysSuffix = daysUntil != null ? ` · ${daysUntil} days to exam` : "";
      return {
        ctaHref: `/quiz?subject=${encodeURIComponent(weakest.subject)}&topic=${encodeURIComponent(weakest.topic)}&count=10`,
        ctaLabel: tod === "morning" ? "Drill 10 questions" : "Practice now",
        expiresAt: Date.now() + 3600000,
        kind: "weakest-topic" as ActionKind,
        reason: `${weakest.topic} in ${weakest.subject} is your weakest area at ${weakest.score}%${daysSuffix}`,
        subject: weakest.subject,
        title: `Strengthen ${weakest.topic}`,
        topic: weakest.topic,
      };
    }

    if (dueCount > 0 && !isDismissed("flashcards")) {
      return {
        ctaHref: "/flashcards",
        ctaLabel: "Review cards",
        expiresAt: Date.now() + 3600000,
        kind: "flashcards" as ActionKind,
        reason: "Quick card review — pick up where you left off",
        title: `${dueCount} flashcards due`,
      };
    }

    if (tod === "evening" && !isDismissed("study-plan")) {
      return {
        ctaHref: "/study-plan",
        ctaLabel: "Open study planner",
        expiresAt: Date.now() + 7200000,
        kind: "study-plan" as ActionKind,
        reason: "Evenings are great for planning tomorrow's study session",
        title: "Plan your next session",
      };
    }

    return null;
  });
}

export function resolveNextAction(userId?: string): Promise<NextAction | null> {
  return Effect.runPromise(resolveNextActionEffect(userId));
}

export function getFeed(
  userId: string,
  deps?: Partial<ScorerDeps>,
  limit?: number,
): Promise<ScoredRecommendation[]> {
  const scorerDeps: ScorerDeps = {
    getDueCardsCount: async () => {
      const now = Date.now();
      const allCards = await _deps.db.flashcards.toArray();
      return allCards.filter((c) => c.nextReview <= now).length;
    },
    getWeakestTopic: async () => {
      const all = await _deps.db.competencies.toArray();
      if (all.length === 0) return null;
      let weakest: { subjectId: string; topicId: string; score: number } | null = null;
      for (const c of all) {
        const s = typeof c.score === "number" ? c.score : 0;
        if (!weakest || s < weakest.score) weakest = { score: s, subjectId: c.subjectId, topicId: c.topicId };
      }
      if (!weakest) return null;
      const sub = await _deps.db.subjects.where("code").equals(weakest.subjectId).first();
      return { score: weakest.score, subject: sub?.name ?? weakest.subjectId, topic: weakest.topicId.replaceAll(/-/g, " ").replaceAll(/\b\w/g, (l: string) => l.toUpperCase()) };
    },
    getUpcomingExam: async (_uid: string) => {
      try {
        const slots = localStorage.getItem("lumni_exam_dates");
        if (!slots) return null;
        const parsed = JSON.parse(slots);
        const session = getCurrentSession();
        if (!session) return null;
        const yearSlots = parsed?.[String(session.year)];
        if (!yearSlots) return null;
        const allSlots = Object.values(yearSlots).flat() as Record<string, unknown>[];
        let nearest: { subject: string; date: string } | null = null;
        const now = new Date();
        for (const s of allSlots) {
          if (!s.date) continue;
          const d = new Date(s.date as string);
          const diff = Math.ceil((d.getTime() - now.getTime()) / 86_400_000);
          if (diff < 0) continue;
          if (!nearest || diff < Math.ceil((new Date(nearest.date).getTime() - now.getTime()) / 86_400_000)) {
            nearest = { subject: String(s.subject), date: String(s.date) };
          }
        }
        if (!nearest) return null;
        return { subject: nearest.subject, daysUntil: Math.ceil((new Date(nearest.date).getTime() - now.getTime()) / 86_400_000) };
      } catch { return null; }
    },
    getHoursSinceLastPractice: async () => {
      try {
        const attempts = await _deps.db.quizAttempts.orderBy("completedAt").reverse().first();
        if (!attempts?.completedAt) return 24;
        return (Date.now() - new Date(attempts.completedAt).getTime()) / 3_600_000;
      } catch { return 0; }
    },
    ...deps,
  };
  return getRankedRecommendations(userId, scorerDeps, limit);
}

function getDaysUntilExam(
  session: { year: number; session: string },
  subject: string,
): number | null {
  try {
    const slots = localStorage.getItem("lumni_exam_dates");
    if (!slots) {
      return null;
    }
    const parsed = JSON.parse(slots);
    const yearSlots = parsed?.[String(session.year)];
    if (!yearSlots) {
      return null;
    }
    const allSlots = Object.values(yearSlots).flat() as Record<string, unknown>[];
    const subjectSlots = allSlots.find(
      (s) => String(s.subject).toLowerCase() === subject.toLowerCase(),
    ) as { date: string } | undefined;
    if (!subjectSlots?.date) {
      return null;
    }
    const examDate = new Date(subjectSlots.date);
    const now = new Date();
    return Math.max(0, Math.ceil((examDate.getTime() - now.getTime()) / 86_400_000));
  } catch (error) {
    logError("GetDaysUntilExam", error);
    return null;
  }
}
