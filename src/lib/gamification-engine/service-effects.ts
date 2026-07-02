import { Effect } from "effect";
import { persistEffect, saveSnapshot } from "./service-persist";
import { scheduleSync } from "./service-sync";
import { gamificationEngine } from "@/lib/gamification-engine";
import type { MutationSelf } from "./service-mutation";
import type { XpResult, AchievementResult, ChestResult, StreakResult, FreezeResult } from "./service-types";

export function addXpEffect(
  self: MutationSelf,
  amount: number,
  accuracy: number,
  streak: number,
  subject?: string,
): Effect.Effect<XpResult> {
  return Effect.gen(function* () {
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
    yield* persistEffect(self.db, newData);
    scheduleSync(newData, self.syncTimer, (t) => { self.setSyncTimer(t); });
    saveSnapshot(newData);
    self.notify();
    return { data: newData, leveledUp: newLevel !== null };
  });
}

export function addAchievementEffect(
  self: MutationSelf,
  achievementId: string,
): Effect.Effect<AchievementResult> {
  return Effect.gen(function* () {
    const { data: newData, achievement } = gamificationEngine.addAchievement(
      self.data,
      achievementId,
    );
    self.data = newData;
    yield* persistEffect(self.db, newData);
    scheduleSync(newData, self.syncTimer, (t) => { self.setSyncTimer(t); });
    saveSnapshot(newData);
    self.notify();
    return { data: newData, achievement };
  });
}

export function updateStreakEffect(self: MutationSelf): Effect.Effect<StreakResult> {
  return Effect.gen(function* () {
    const { data: newData, freezeConsumed } = gamificationEngine.updateStreak(self.data);
    self.data = newData;
    yield* persistEffect(self.db, newData);
    scheduleSync(newData, self.syncTimer, (t) => { self.setSyncTimer(t); });
    saveSnapshot(newData);
    self.notify();
    return { data: newData, freezeConsumed };
  });
}

export function consumeStreakFreezeEffect(self: MutationSelf): Effect.Effect<FreezeResult> {
  return Effect.gen(function* () {
    const { data: newData, success } = gamificationEngine.consumeStreakFreeze(self.data);
    if (success) {
      self.data = newData;
      yield* persistEffect(self.db, newData);
      scheduleSync(newData, self.syncTimer, (t) => { self.setSyncTimer(t); });
      saveSnapshot(newData);
      self.notify();
    }
    return { data: newData, success };
  });
}

export function addStreakFreezeEffect(self: MutationSelf, count?: number): Effect.Effect<void> {
  return Effect.gen(function* () {
    const newData = gamificationEngine.addStreakFreeze(self.data, count);
    self.data = newData;
    yield* persistEffect(self.db, newData);
    scheduleSync(newData, self.syncTimer, (t) => { self.setSyncTimer(t); });
    saveSnapshot(newData);
    self.notify();
  });
}

export function completeDailyChallengeEffect(
  self: MutationSelf,
  challengeId: string,
): Effect.Effect<void> {
  return Effect.gen(function* () {
    const { data: newData } = gamificationEngine.completeDailyChallenge(self.data, challengeId);
    self.data = newData;
    yield* persistEffect(self.db, newData);
    scheduleSync(newData, self.syncTimer, (t) => { self.setSyncTimer(t); });
    saveSnapshot(newData);
    self.notify();
  });
}

export function checkForRewardChestsEffect(self: MutationSelf): Effect.Effect<ChestResult> {
  return Effect.gen(function* () {
    const { data: newData, chest } = gamificationEngine.checkAndClaimRewardChest(self.data);
    if (newData !== self.data) {
      yield* persistEffect(self.db, newData);
      scheduleSync(newData, self.syncTimer, (t) => { self.setSyncTimer(t); });
    }
    self.data = newData;
    self.notify();
    return { data: newData, chest };
  });
}
