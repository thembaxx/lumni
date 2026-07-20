import { dexieDataAccess } from "@/lib/db";
import type { ObservabilityDataAccess } from "@/lib/db";
import type { StoredGamification } from "@/lib/gamification-engine";
import { gamificationEngine } from "@/lib/gamification-engine";
import { logError } from "@/lib/shared/logger";
import { apiFetch } from "@/lib/shared/api-fetch";
import type { Achievement, RewardChestDef } from "@/types/gamification";
import { ACHIEVEMENTS, calculateLevel, REWARD_CHESTS } from "@/types/gamification";
import type {
  GamificationDeps,
  XpResult,
  AchievementResult,
  ChestResult,
  StreakResult,
  FreezeResult,
  StateListener,
} from "./service-types";
import type { MutationSelf } from "./service-mutation";
import {
  addXpMutation,
  addAchievementMutation,
  updateStreakMutation,
  consumeStreakFreezeMutation,
  addStreakFreezeMutation,
  completeDailyChallengeMutation,
  checkForRewardChestsMutation,
  updateCounterMutation,
  setCounterMutation,
} from "./service-mutation";
import { syncToLeaderboard } from "./service-sync";

const DEFAULT_DEPS: GamificationDeps = { db: dexieDataAccess };

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

  private get mutationSelf(): MutationSelf {
    // oxlint-disable-next-line typescript/no-this-alias
    const self = this;
    return {
      get data() {
        return self.data;
      },
      set data(v: StoredGamification) {
        self.data = v;
      },
      db: this.db,
      notify: () => this.notify(),
      syncTimer: this.syncTimer,
      setSyncTimer: (t) => {
        self.syncTimer = t;
      },
    };
  }

  addXp(amount: number, accuracy: number, streak: number, subject?: string): XpResult {
    return addXpMutation(this.mutationSelf, amount, accuracy, streak, subject);
  }

  addAchievement(achievementId: string): AchievementResult {
    return addAchievementMutation(this.mutationSelf, achievementId);
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
    return updateCounterMutation(this.mutationSelf, key, value);
  }

  setCounter(
    key: "consecutiveCorrectFlashcards" | "wrongAnswersReviewed" | "studyPlanDaysCompleted",
    value: number,
  ): void {
    return setCounterMutation(this.mutationSelf, key, value);
  }

  updateStreak(): StreakResult {
    return updateStreakMutation(this.mutationSelf);
  }

  consumeStreakFreeze(): FreezeResult {
    return consumeStreakFreezeMutation(this.mutationSelf);
  }

  addStreakFreeze(count?: number): void {
    return addStreakFreezeMutation(this.mutationSelf, count);
  }

  completeDailyChallenge(challengeId: string): void {
    return completeDailyChallengeMutation(this.mutationSelf, challengeId);
  }

  checkForRewardChests(): ChestResult {
    return checkForRewardChestsMutation(this.mutationSelf);
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
