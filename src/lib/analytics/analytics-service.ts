import { Query } from "appwrite";
import type { StudySession } from "@/lib/db/client";
import { COLLECTIONS, listDocuments } from "@/lib/db/client";

const PAGE_LIMIT = 100;
const MAX_SESSIONS = 10000;

export interface TrendResult {
  dates: string[];
  accuracies: number[];
  trend: "improving" | "declining" | "stable";
}

export interface ComparativeResult {
  userPercentile: number;
  subjectRankings: Record<string, number>;
  globalAverage: number;
  userAverage: number;
}

export interface SessionStore {
  fetchSessions(userId: string, subject: string): Promise<StudySession[]>;
  fetchAllSessions(): Promise<StudySession[]>;
}

export class AppwriteSessionStore implements SessionStore {
  async fetchSessions(userId: string, subject: string): Promise<StudySession[]> {
    return listDocuments<StudySession>(COLLECTIONS.STUDY_SESSIONS, [
      Query.equal("userId", userId),
      Query.equal("subjectId", subject),
    ]);
  }

  async fetchAllSessions(): Promise<StudySession[]> {
    const allSessions: StudySession[] = [];
    let offset = 0;

    while (allSessions.length < MAX_SESSIONS) {
      const page = await listDocuments<StudySession>(COLLECTIONS.STUDY_SESSIONS, [
        Query.limit(PAGE_LIMIT),
        Query.offset(offset),
      ]);
      allSessions.push(...page);
      if (page.length < PAGE_LIMIT) break;
      offset += PAGE_LIMIT;
    }

    return allSessions;
  }
}

export class AnalyticsService {
  constructor(private readonly store: SessionStore) {}

  async computeTrends(userId: string, subject: string): Promise<TrendResult> {
    const sessions = await this.store.fetchSessions(userId, subject);

    if (sessions.length === 0) {
      return { dates: [], accuracies: [], trend: "stable" };
    }

    const monthlyGroups: Record<string, { answered: number; correct: number }> = {};
    for (const session of sessions) {
      const monthKey = session.startedAt?.slice(0, 7) || "unknown";
      if (!monthlyGroups[monthKey]) {
        monthlyGroups[monthKey] = { answered: 0, correct: 0 };
      }
      monthlyGroups[monthKey].answered += session.questionsAnswered;
      monthlyGroups[monthKey].correct += session.correctCount;
    }

    const sortedMonths = Object.keys(monthlyGroups).toSorted();
    const dates = sortedMonths.map((m) => {
      const [year, month] = m.split("-");
      const date = new Date(Number.parseInt(year, 10), Number.parseInt(month, 10) - 1);
      return date.toLocaleDateString(undefined, {
        month: "short",
        year: "2-digit",
      });
    });
    const accuracies = sortedMonths.map((m) => {
      const g = monthlyGroups[m];
      return g.answered > 0 ? Math.round((g.correct / g.answered) * 100) : 0;
    });

    let trend: "improving" | "declining" | "stable" = "stable";
    if (accuracies.length >= 2) {
      const mid = Math.ceil(accuracies.length / 2);
      const firstAvg = accuracies.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
      const secondAvg =
        accuracies.slice(mid).reduce((a, b) => a + b, 0) / accuracies.slice(mid).length;
      if (secondAvg > firstAvg + 5) trend = "improving";
      else if (secondAvg < firstAvg - 5) trend = "declining";
    }

    return { dates, accuracies, trend };
  }

  async computeComparative(userId: string): Promise<ComparativeResult> {
    const allSessions = await this.store.fetchAllSessions();

    let globalTotalAnswered = 0;
    let globalTotalCorrect = 0;
    const userTotals: Record<string, { answered: number; correct: number }> = {};

    for (const session of allSessions) {
      globalTotalAnswered += session.questionsAnswered;
      globalTotalCorrect += session.correctCount;
      if (!userTotals[session.userId]) {
        userTotals[session.userId] = { answered: 0, correct: 0 };
      }
      userTotals[session.userId].answered += session.questionsAnswered;
      userTotals[session.userId].correct += session.correctCount;
    }

    const globalAverage =
      globalTotalAnswered > 0 ? Math.round((globalTotalCorrect / globalTotalAnswered) * 100) : 65;

    const userTotal = userTotals[userId] || { answered: 0, correct: 0 };
    const userAverage = userTotal.answered > 0 ? (userTotal.correct / userTotal.answered) * 100 : 0;

    const userAccuracy = userTotal.answered > 0 ? userTotal.correct / userTotal.answered : 0;
    const otherUsers = Object.entries(userTotals).filter(([id]) => id !== userId);
    const usersBeaten = otherUsers.filter(
      ([, data]) => data.answered > 0 && data.correct / data.answered <= userAccuracy,
    ).length;
    const userPercentile =
      otherUsers.length > 0 ? Math.round((usersBeaten / otherUsers.length) * 100) : 50;

    const userSessions = allSessions.filter((s) => s.userId === userId);
    const subjectStats: Record<string, { answered: number; correct: number }> = {};
    for (const session of userSessions) {
      if (!subjectStats[session.subjectId]) {
        subjectStats[session.subjectId] = { answered: 0, correct: 0 };
      }
      subjectStats[session.subjectId].answered += session.questionsAnswered;
      subjectStats[session.subjectId].correct += session.correctCount;
    }

    const subjectRankings: Record<string, number> = {};
    for (const [subject, stats] of Object.entries(subjectStats)) {
      subjectRankings[subject] =
        stats.answered > 0 ? Math.round((stats.correct / stats.answered) * 100) : 0;
    }

    return {
      userPercentile,
      subjectRankings,
      globalAverage,
      userAverage: Math.round(userAverage * 10) / 10,
    };
  }
}

let _service: AnalyticsService | null = null;

export function getAnalyticsService(): AnalyticsService {
  if (!_service) {
    _service = new AnalyticsService(new AppwriteSessionStore());
  }
  return _service;
}
