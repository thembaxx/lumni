export interface CompetitionScoreEntry {
  id?: number;
  userId: string;
  weekStart: string;
  weekEnd: string;
  xpEarned: number;
  updatedAt: number;
}

export interface CompetitionLeaderboardEntry {
  userId: string;
  xpEarned: number;
  rank: number;
}
