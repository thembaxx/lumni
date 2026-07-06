export interface StudyCommitment {
  id: string;
  userId: string;
  buddyUserId: string;
  subject: string;
  targetDailyMinutes: number;
  startDate: string;
  endDate: string | null;
  status: "pending" | "active" | "declined" | "ended";
  sharedStreak: number;
  lastSharedDate: string | null;
  createdAt: string;
}
