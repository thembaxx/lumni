import { dexieDataAccess } from "@/lib/db";
import type { CommunityDataAccess } from "@/lib/db/data-access";
import type { CompetitionScoreRecord } from "@/lib/db/schema";
import { logError } from "@/lib/shared/logger";
import { getWeekRange } from "@/lib/study-groups/challenge-types";

export interface LeaderboardEntry {
  userId: string;
  xpEarned: number;
  rank: number;
  subjectId?: string;
}

const DEFAULT_DEPS = Object.freeze({ db: dexieDataAccess });
let _deps: { db: CommunityDataAccess } = DEFAULT_DEPS;

export function __setDepsForTesting(deps: { db: CommunityDataAccess }) {
  _deps = Object.freeze({ ...deps });
}

function getCompetitionWeek(): { start: string; end: string } {
  return getWeekRange();
}

async function getWeekEntries(subjectId?: string): Promise<CompetitionScoreRecord[]> {
  const { start, end } = getCompetitionWeek();
  const entries = await _deps.db.competitionScores.toArray();

  let weekEntries = entries.filter(
    (e: CompetitionScoreRecord) => e.weekStart === start && e.weekEnd === end,
  );

  if (subjectId) {
    weekEntries = weekEntries.filter(
      (e: CompetitionScoreRecord) => e.subjectId === subjectId,
    );
  }

  return weekEntries;
}

function rankEntries(entries: CompetitionScoreRecord[]): LeaderboardEntry[] {
  const sorted = [...entries].toSorted(
    (a, b) => b.xpEarned - a.xpEarned,
  );
  return sorted.map((e, i) => ({
    userId: e.userId,
    xpEarned: e.xpEarned,
    rank: i + 1,
    subjectId: e.subjectId,
  }));
}

export async function recordXp(userId: string, xp: number): Promise<void> {
  try {
    const { start, end } = getCompetitionWeek();
    const existing = await _deps.db.competitionScores
      .where("userId")
      .equals(userId)
      .filter((e: CompetitionScoreRecord) => e.weekStart === start && e.weekEnd === end && !e.subjectId)
      .first();

    if (existing?.id != null) {
      await _deps.db.competitionScores.update(existing.id, {
        xpEarned: existing.xpEarned + xp,
        updatedAt: Date.now(),
      });
    } else {
      await _deps.db.competitionScores.add({
        userId,
        weekStart: start,
        weekEnd: end,
        xpEarned: xp,
        updatedAt: Date.now(),
      });
    }
  } catch (err) {
    logError("CompetitionRecordXp", err);
  }
}

export async function recordXpPerSubject(
  userId: string,
  subjectId: string,
  xp: number,
): Promise<void> {
  try {
    const { start, end } = getCompetitionWeek();
    const existing = await _deps.db.competitionScores
      .where("userId")
      .equals(userId)
      .filter(
        (e: CompetitionScoreRecord) =>
          e.weekStart === start && e.weekEnd === end && e.subjectId === subjectId,
      )
      .first();

    if (existing?.id != null) {
      await _deps.db.competitionScores.update(existing.id, {
        xpEarned: existing.xpEarned + xp,
        updatedAt: Date.now(),
      });
    } else {
      await _deps.db.competitionScores.add({
        userId,
        weekStart: start,
        weekEnd: end,
        xpEarned: xp,
        subjectId,
        updatedAt: Date.now(),
      });
    }
  } catch (err) {
    logError("CompetitionRecordXpPerSubject", err);
  }
}

export async function getLeaderboard(
  subjectId?: string,
): Promise<LeaderboardEntry[]> {
  try {
    const weekEntries = await getWeekEntries(subjectId);
    return rankEntries(weekEntries);
  } catch (err) {
    logError("CompetitionLeaderboard", err);
    return [];
  }
}

export async function getLeaderboardBySubject(
  subjectId: string,
): Promise<LeaderboardEntry[]> {
  return getLeaderboard(subjectId);
}

export async function getMyRank(
  userId: string,
  subjectId?: string,
): Promise<{ rank: number; xpEarned: number } | null> {
  const leaderboard = await getLeaderboard(subjectId);
  const entry = leaderboard.find((e) => e.userId === userId);
  if (!entry) return null;
  return { rank: entry.rank, xpEarned: entry.xpEarned };
}

export async function syncScoresToAppwrite(_userId: string): Promise<void> {
  // Appwrite sync is handled by the POST /api/gamification route
  // This is a no-op — weekly snapshot persistence is already wired
  // through GamificationService.saveWeeklySnapshot()
}

export function getTimeRemaining(): { days: number; hours: number } {
  const now = Date.now();
  const { end } = getCompetitionWeek();
  const endTime = new Date(end).getTime();
  const diff = Math.max(0, endTime - now);
  const totalHours = Math.floor(diff / (1000 * 60 * 60));
  return {
    days: Math.floor(totalHours / 24),
    hours: totalHours % 24,
  };
}
