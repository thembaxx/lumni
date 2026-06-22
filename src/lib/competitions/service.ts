import { dexieDataAccess } from "@/lib/db";
import type { CommunityDataAccess } from "@/lib/db/data-access";
import type { CompetitionScoreRecord } from "@/lib/db/schema";
import { logError } from "@/lib/shared/logger";
import { getWeekRange } from "@/lib/study-groups/challenge-types";

const DEFAULT_DEPS = { db: dexieDataAccess };
let _deps: { db: CommunityDataAccess } = DEFAULT_DEPS;

export function __setDepsForTesting(deps: { db: CommunityDataAccess }) {
  _deps = deps;
}

function getCompetitionWeek(): { start: string; end: string } {
  return getWeekRange();
}

export async function recordXp(userId: string, xp: number): Promise<void> {
  try {
    const { start, end } = getCompetitionWeek();
    const existing = await _deps.db.competitionScores
      .where("userId")
      .equals(userId)
      .filter((e: CompetitionScoreRecord) => e.weekStart === start && e.weekEnd === end)
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

export async function getLeaderboard(): Promise<
  { userId: string; xpEarned: number; rank: number }[]
> {
  try {
    const { start, end } = getCompetitionWeek();
    const entries = await _deps.db.competitionScores.toArray();

    const weekEntries = entries.filter(
      (e: CompetitionScoreRecord) => e.weekStart === start && e.weekEnd === end,
    );

    weekEntries.sort(
      (a: CompetitionScoreRecord, b: CompetitionScoreRecord) => b.xpEarned - a.xpEarned,
    );

    return weekEntries.map((e: CompetitionScoreRecord, i: number) => ({
      userId: e.userId,
      xpEarned: e.xpEarned,
      rank: i + 1,
    }));
  } catch (err) {
    logError("CompetitionLeaderboard", err);
    return [];
  }
}

export async function getMyRank(
  userId: string,
): Promise<{ rank: number; xpEarned: number } | null> {
  const leaderboard = await getLeaderboard();
  const entry = leaderboard.find((e) => e.userId === userId);
  if (!entry) return null;
  return { rank: entry.rank, xpEarned: entry.xpEarned };
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
