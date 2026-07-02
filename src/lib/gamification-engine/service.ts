import { Effect } from "effect";
import { dexieDataAccess } from "@/lib/db";
import type { ObservabilityDataAccess } from "@/lib/db";
import type { StoredGamification } from "@/lib/gamification-engine";
import { gamificationEngine } from "@/lib/gamification-engine";
import { logError } from "@/lib/shared/logger";
import { apiFetch } from "@/lib/shared/api-fetch";
import type { Achievement, RewardChestDef } from "@/types/gamification";
import { ACHIEVEMENTS, calculateLevel, REWARD_CHESTS } from "@/types/gamification";
import type { GamificationDeps, XpResult, AchievementResult, ChestResult, StreakResult, FreezeResult, StateListener } from "./service-types";
import { persist, persistEffect, saveSnapshot, saveSnapshotEffect } from "./service-persist";
import { scheduleSync, syncToServer, syncToLeaderboard } from "./service-sync";

const DEFAULT_DEPS: GamificationDeps = { db: dexieDataAccess };

function succeedUndefined(): Effect.Effect<void> {
  return Effect.void;
}
export class GamificationService {
  private data: StoredGamification;
  private listeners: Set<StateListener> = new Set();
  private syncTimer: ReturnType<typeof setTimeout> | null = null;
  private db: ObservabilityDataAccess;

  constructor(deps?: Partial<GamificationDeps>) {
    const resolved = { ...DEFAULT_DEPS, ...deps };
    this.db = resolved.db;
    const stored = gamificationEngine.load();
    this.data = gamificationEngine.mergeWithDefaults(stored);
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getState(): StoredGamification {
    return this.data;
  }

  async loadFromDexie(): Promise<void> {
    try {
      const dexieData = await this.db.gamification.get(1);
      if (dexieData) {
        const merged = gamificationEngine.mergeWithDefaults(dexieData);
        if (merged !== this.data) {
          this.data = merged;
          this.notify();
        }
      }
    } catch (err) {
      logError("GamificationService.loadFromDexie", err);
    }
  }

  loadFromDexieEffect(): Effect.Effect<void> {
    // oxlint-disable-next-line typescript/no-this-alias
    const self = this;
    return Effect.tryPromise(() => self.db.gamification.get(1)).pipe(
      Effect.catchAll((err) => {
        logError("GamificationService.loadFromDexie", err);
        return Effect.void;
      }),
      Effect.flatMap((dexieData) => {
        if (!dexieData) return succeedUndefined();
        const merged = gamificationEngine.mergeWithDefaults(dexieData);
        if (merged !== self.data) {
          self.data = merged;
          self.notify();
        }
        return succeedUndefined();
      }),
    );
  }

  async syncFromServer(): Promise<void> {
    try {
      const res = await apiFetch<{ gamification: StoredGamification | null }>(
        "/api/gamification",
        {},
      );
      if (res.gamification) {
        const merged = gamificationEngine.mergeWithDefaults({
          ...this.data,
          ...res.gamification,
        });
        if (merged !== this.data) {
          this.data = merged;
          this.notify();
        }
      }
    } catch (err) {
      logError("GamificationService.syncFromServer", err);
    }
  }

  syncFromServerEffect(): Effect.Effect<void> {
    // oxlint-disable-next-line typescript/no-this-alias
    const self = this;
    return Effect.tryPromise(() =>
      apiFetch<{ gamification: StoredGamification | null }>("/api/gamification", {}),
    ).pipe(
      Effect.catchAll((err) => {
        logError("GamificationService.syncFromServer", err);
        return Effect.void;
      }),
      Effect.flatMap((res) => {
        if (!res || !res.gamification) return succeedUndefined();
        const merged = gamificationEngine.mergeWithDefaults({
          ...self.data,
          ...res.gamification,
        });
        if (merged !== self.data) {
          self.data = merged;
          self.notify();
        }
        return succeedUndefined();
      }),
    );
  }

  addXpEffect(
    amount: number,
    accuracy: number,
    streak: number,
    subject?: string,
  ): Effect.Effect<XpResult> {
    // oxlint-disable-next-line typescript/no-this-alias
    const self = this;
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
      scheduleSync(newData, self.syncTimer, (t) => { self.syncTimer = t; });
      saveSnapshot(newData);
      self.notify();
      return { data: newData, leveledUp: newLevel !== null };
    });
  }

  addAchievementEffect(achievementId: string): Effect.Effect<AchievementResult> {
    // oxlint-disable-next-line typescript/no-this-alias
    const self = this;
    return Effect.gen(function* () {
      const { data: newData, achievement } = gamificationEngine.addAchievement(
        self.data,
        achievementId,
      );
      self.data = newData;
      yield* persistEffect(self.db, newData);
      scheduleSync(newData, self.syncTimer, (t) => { self.syncTimer = t; });
      self.notify();
      return { data: newData, achievement };
    });
  }

  updateStreakEffect(): Effect.Effect<StreakResult> {
    // oxlint-disable-next-line typescript/no-this-alias
    const self = this;
    return Effect.gen(function* () {
      const { data: newData, freezeConsumed } = gamificationEngine.updateStreak(self.data);
      self.data = newData;
      yield* persistEffect(self.db, newData);
      scheduleSync(newData, self.syncTimer, (t) => { self.syncTimer = t; });
      self.notify();
      return { data: newData, freezeConsumed };
    });
  }

  consumeStreakFreezeEffect(): Effect.Effect<FreezeResult> {
    // oxlint-disable-next-line typescript/no-this-alias
    const self = this;
    return Effect.gen(function* () {
      const { data: newData, success } = gamificationEngine.consumeStreakFreeze(self.data);
      if (success) {
        self.data = newData;
        yield* persistEffect(self.db, newData);
        scheduleSync(newData, self.syncTimer, (t) => { self.syncTimer = t; });
        self.notify();
      }
      return { data: newData, success };
    });
  }

  addStreakFreezeEffect(count?: number): Effect.Effect<void> {
    // oxlint-disable-next-line typescript/no-this-alias
    const self = this;
    return Effect.gen(function* () {
      const newData = gamificationEngine.addStreakFreeze(self.data, count);
      self.data = newData;
      yield* persistEffect(self.db, newData);
      scheduleSync(newData, self.syncTimer, (t) => { self.syncTimer = t; });
      self.notify();
    });
  }

  completeDailyChallengeEffect(challengeId: string): Effect.Effect<void> {
    // oxlint-disable-next-line typescript/no-this-alias
    const self = this;
    return Effect.gen(function* () {
      const { data: newData } = gamificationEngine.completeDailyChallenge(self.data, challengeId);
      self.data = newData;
      yield* persistEffect(self.db, newData);
      scheduleSync(newData, self.syncTimer, (t) => { self.syncTimer = t; });
      self.notify();
    });
  }

  checkForRewardChestsEffect(): Effect.Effect<ChestResult> {
    // oxlint-disable-next-line typescript/no-this-alias
    const self = this;
    return Effect.gen(function* () {
      const { data: newData, chest } = gamificationEngine.checkAndClaimRewardChest(self.data);
      if (newData !== self.data) {
        yield* persistEffect(self.db, newData);
        scheduleSync(newData, self.syncTimer, (t) => { self.syncTimer = t; });
      }
      self.data = newData;
      self.notify();
      return { data: newData, chest };
    });
  }

  addXp(amount: number, accuracy: number, streak: number, subject?: string): XpResult {
    const working = subject
      ? gamificationEngine.trackSubjectQuestion(this.data, subject, amount)
      : this.data;
    const { data: newData, leveledUp: newLevel } = gamificationEngine.addXp(
      working,
      amount,
      accuracy,
      streak,
      subject,
    );
    this.data = newData;
    persist(this.db, newData);
    scheduleSync(newData, this.syncTimer, (t) => { this.syncTimer = t; });
    saveSnapshot(newData);
    this.notify();
    return { data: newData, leveledUp: newLevel !== null };
  }

  addAchievement(achievementId: string): AchievementResult {
    const { data: newData, achievement } = gamificationEngine.addAchievement(
      this.data,
      achievementId,
    );
    this.data = newData;
    persist(this.db, newData);
    scheduleSync(newData, this.syncTimer, (t) => { this.syncTimer = t; });
    this.notify();
    return { data: newData, achievement };
  }

  checkAndUnlockAchievements(
    questionsAnswered: number,
    accuracy: number,
    streak: number,
    currentLevel: number,
    perfectQuiz: boolean,
    extra?: {
      competentTopicsCount?: number;
      topicScoreImproved?: boolean;
      examScoreImproved?: boolean;
      leaderboardRank?: number;
      subjectLeaderboardRank?: number;
    },
  ): Achievement[] {
    const ids = gamificationEngine.checkAndUnlockAchievements(
      this.data,
      questionsAnswered,
      accuracy,
      streak,
      currentLevel,
      perfectQuiz,
      extra,
    );
    return ids
      .map((id) => {
        const result = this.addAchievement(id);
        return result.achievement;
      })
      .filter((a): a is Achievement => a !== null);
  }

  updateCounter(
    key: "consecutiveCorrectFlashcards" | "wrongAnswersReviewed" | "studyPlanDaysCompleted",
    value: number,
  ): void {
    const prev = this.data[key] ?? 0;
    this.data = { ...this.data, [key]: prev + value };
    persist(this.db, this.data);
    this.notify();
  }

  setCounter(
    key: "consecutiveCorrectFlashcards" | "wrongAnswersReviewed" | "studyPlanDaysCompleted",
    value: number,
  ): void {
    this.data = { ...this.data, [key]: value };
    persist(this.db, this.data);
    this.notify();
  }

  updateStreak(): StreakResult {
    const { data: newData, freezeConsumed } = gamificationEngine.updateStreak(this.data);
    this.data = newData;
    persist(this.db, newData);
    scheduleSync(newData, this.syncTimer, (t) => { this.syncTimer = t; });
    this.notify();
    return { data: newData, freezeConsumed };
  }

  consumeStreakFreeze(): FreezeResult {
    const { data: newData, success } = gamificationEngine.consumeStreakFreeze(this.data);
    if (success) {
      this.data = newData;
      persist(this.db, newData);
      scheduleSync(newData, this.syncTimer, (t) => { this.syncTimer = t; });
      this.notify();
    }
    return { data: newData, success };
  }

  addStreakFreeze(count?: number): void {
    const newData = gamificationEngine.addStreakFreeze(this.data, count);
    this.data = newData;
    persist(this.db, newData);
    scheduleSync(newData, this.syncTimer, (t) => { this.syncTimer = t; });
    this.notify();
  }

  completeDailyChallenge(challengeId: string): void {
    const { data: newData } = gamificationEngine.completeDailyChallenge(this.data, challengeId);
    this.data = newData;
    persist(this.db, newData);
    scheduleSync(newData, this.syncTimer, (t) => { this.syncTimer = t; });
    this.notify();
  }

  checkForRewardChests(): ChestResult {
    const { data: newData, chest } = gamificationEngine.checkAndClaimRewardChest(this.data);
    if (newData !== this.data) {
      persist(this.db, newData);
      scheduleSync(newData, this.syncTimer, (t) => { this.syncTimer = t; });
    }
    this.data = newData;
    this.notify();
    return { data: newData, chest };
  }

  getLevelInfo() {
    return calculateLevel(this.data.totalXp);
  }

  getEarnedAchievements(): Achievement[] {
    return ACHIEVEMENTS.map((achievement) => {
      const stored = this.data.achievements.find((a) => a.id === achievement.id);
      return {
        ...achievement,
        earnedAt: stored?.earnedAt ?? null,
      };
    });
  }

  getRewardChests(): RewardChestDef[] {
    return REWARD_CHESTS;
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this.data);
    }
  }

  async syncToLeaderboard(userId: string): Promise<void> {
    return syncToLeaderboard(this.data, userId);
  }
}
