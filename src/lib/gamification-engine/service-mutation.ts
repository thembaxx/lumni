import type { ObservabilityDataAccess } from "@/lib/db";
import type { StoredGamification } from "./types";
import { gamificationEngine } from "@/lib/gamification-engine";
import { persist, saveSnapshot } from "./service-persist";
import { scheduleSync } from "./service-sync";
import type {
  XpResult,
  AchievementResult,
  ChestResult,
  StreakResult,
  FreezeResult,
} from "./service-types";

export interface MutationSelf {
  data: StoredGamification;
  db: ObservabilityDataAccess;
  notify: () => void;
  syncTimer: ReturnType<typeof setTimeout> | null;
  setSyncTimer: (t: ReturnType<typeof setTimeout> | null) => void;
}

function persistAndSync(self: MutationSelf, newData: StoredGamification): void {
  persist(self.db, newData);
  scheduleSync(newData, self.syncTimer, (t) => {
    self.setSyncTimer(t);
  });
  saveSnapshot(newData);
}

function persistAndNotify(self: MutationSelf, newData: StoredGamification): void {
  persist(self.db, newData);
  self.notify();
}

export function addXpMutation(
  self: MutationSelf,
  amount: number,
  accuracy: number,
  streak: number,
  subject?: string,
): XpResult {
  const working = subject
    ? gamificationEngine.trackSubjectQuestion(self.data, subject, amount)
    : self.data;
  const { data: newData, leveledUp: newLevel } = gamificationEngine.addXp(
    working,
    amount,
    accuracy,
    streak,
    subject,
  );
  self.data = newData;
  persistAndSync(self, newData);
  self.notify();
  return { data: newData, leveledUp: newLevel !== null };
}

export function addAchievementMutation(
  self: MutationSelf,
  achievementId: string,
): AchievementResult {
  const { data: newData, achievement } = gamificationEngine.addAchievement(
    self.data,
    achievementId,
  );
  self.data = newData;
  persistAndSync(self, newData);
  self.notify();
  return { data: newData, achievement };
}

export function updateStreakMutation(self: MutationSelf): StreakResult {
  const withWeeklyFreeze = gamificationEngine.addWeeklyFreeze(self.data);
  const { data: newData, freezeConsumed } = gamificationEngine.updateStreak(withWeeklyFreeze);
  self.data = newData;
  persistAndSync(self, newData);
  self.notify();
  return { data: newData, freezeConsumed };
}

export function consumeStreakFreezeMutation(self: MutationSelf): FreezeResult {
  const { data: newData, success } = gamificationEngine.consumeStreakFreeze(self.data);
  if (success) {
    self.data = newData;
    persist(self.db, newData);
    scheduleSync(newData, self.syncTimer, (t) => {
      self.setSyncTimer(t);
    });
    saveSnapshot(newData);
    self.notify();
  }
  return { data: newData, success };
}

export function addStreakFreezeMutation(self: MutationSelf, count?: number): void {
  const newData = gamificationEngine.addStreakFreeze(self.data, count);
  self.data = newData;
  persistAndSync(self, newData);
  self.notify();
}

export function completeDailyChallengeMutation(self: MutationSelf, challengeId: string): void {
  const { data: newData } = gamificationEngine.completeDailyChallenge(self.data, challengeId);
  self.data = newData;
  persistAndSync(self, newData);
  self.notify();
}

export function checkForRewardChestsMutation(self: MutationSelf): ChestResult {
  const { data: newData, chest } = gamificationEngine.checkAndClaimRewardChest(self.data);
  if (newData !== self.data) {
    persist(self.db, newData);
    scheduleSync(newData, self.syncTimer, (t) => {
      self.setSyncTimer(t);
    });
    saveSnapshot(newData);
  }
  self.data = newData;
  self.notify();
  return { data: newData, chest };
}

export function updateCounterMutation(
  self: MutationSelf,
  key: "consecutiveCorrectFlashcards" | "wrongAnswersReviewed" | "studyPlanDaysCompleted",
  value: number,
): void {
  const prev = self.data[key] ?? 0;
  self.data = { ...self.data, [key]: prev + value };
  persistAndNotify(self, self.data);
}

export function setCounterMutation(
  self: MutationSelf,
  key: "consecutiveCorrectFlashcards" | "wrongAnswersReviewed" | "studyPlanDaysCompleted",
  value: number,
): void {
  self.data = { ...self.data, [key]: value };
  persistAndNotify(self, self.data);
}
