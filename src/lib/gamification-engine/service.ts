import { Effect } from "effect";
import type { ObservabilityDataAccess } from "@/lib/db";
import { dexieDataAccess } from "@/lib/db";
import type { StoredGamification } from "@/lib/gamification-engine";
import { gamificationEngine } from "@/lib/gamification-engine";
import { saveWeeklySnapshot } from "@/lib/services/leaderboard-service";
import { apiFetch } from "@/lib/shared/api-fetch";
import { logError } from "@/lib/shared/logger";
import type { Achievement, RewardChestDef } from "@/types/gamification";
import { ACHIEVEMENTS, calculateLevel, REWARD_CHESTS } from "@/types/gamification";

export interface GamificationDeps {
  db: ObservabilityDataAccess;
}

const DEFAULT_DEPS: GamificationDeps = { db: dexieDataAccess };

export interface XpResult {
  data: StoredGamification;
  leveledUp: boolean;
}

export interface AchievementResult {
  data: StoredGamification;
  achievement: Achievement | null;
}

export interface ChestResult {
  data: StoredGamification;
  chest: RewardChestDef | null;
}

export interface StreakResult {
  data: StoredGamification;
  freezeConsumed: boolean;
}

export interface FreezeResult {
  data: StoredGamification;
  success: boolean;
}

export type StateListener = (data: StoredGamification) => void;

function succeedUndefined(): Effect.Effect<void> {
  return Effect.succeed(undefined);
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
        return Effect.succeed(undefined);
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
        return Effect.succeed(undefined);
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

  private persistEffect(data: StoredGamification): Effect.Effect<void> {
    // oxlint-disable-next-line typescript/no-this-alias
    const self = this;
    const record = { ...data, id: 1 as const };
    return Effect.tryPromise(() => self.db.gamification.put(record)).pipe(
      Effect.catchAll((err) => Effect.sync(() => logError("GamificationService.persist", err))),
    );
  }

  private saveSnapshotEffect(data: StoredGamification): Effect.Effect<void> {
    return Effect.sync(() => {
      const label =
        typeof window !== "undefined"
          ? window.localStorage.getItem("lumni_display_name") || undefined
          : undefined;
      setTimeout(() => {
        saveWeeklySnapshot(label || "You", data.totalXp, data.currentStreak);
      }, 0);
    });
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
      yield* self.persistEffect(newData);
      self.scheduleSync(newData);
      self.saveSnapshot(newData);
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
      yield* self.persistEffect(newData);
      self.scheduleSync(newData);
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
      yield* self.persistEffect(newData);
      self.scheduleSync(newData);
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
        yield* self.persistEffect(newData);
        self.scheduleSync(newData);
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
      yield* self.persistEffect(newData);
      self.scheduleSync(newData);
      self.notify();
    });
  }

  completeDailyChallengeEffect(challengeId: string): Effect.Effect<void> {
    // oxlint-disable-next-line typescript/no-this-alias
    const self = this;
    return Effect.gen(function* () {
      const { data: newData } = gamificationEngine.completeDailyChallenge(self.data, challengeId);
      self.data = newData;
      yield* self.persistEffect(newData);
      self.scheduleSync(newData);
      self.notify();
    });
  }

  checkForRewardChestsEffect(): Effect.Effect<ChestResult> {
    // oxlint-disable-next-line typescript/no-this-alias
    const self = this;
    return Effect.gen(function* () {
      const { data: newData, chest } = gamificationEngine.checkAndClaimRewardChest(self.data);
      if (newData !== self.data) {
        yield* self.persistEffect(newData);
        self.scheduleSync(newData);
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
    this.persist(newData);
    this.scheduleSync(newData);
    this.saveSnapshot(newData);
    this.notify();
    return { data: newData, leveledUp: newLevel !== null };
  }

  addAchievement(achievementId: string): AchievementResult {
    const { data: newData, achievement } = gamificationEngine.addAchievement(
      this.data,
      achievementId,
    );
    this.data = newData;
    this.persist(newData);
    this.scheduleSync(newData);
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
    this.persist(this.data);
    this.notify();
  }

  setCounter(
    key: "consecutiveCorrectFlashcards" | "wrongAnswersReviewed" | "studyPlanDaysCompleted",
    value: number,
  ): void {
    this.data = { ...this.data, [key]: value };
    this.persist(this.data);
    this.notify();
  }

  updateStreak(): StreakResult {
    const { data: newData, freezeConsumed } = gamificationEngine.updateStreak(this.data);
    this.data = newData;
    this.persist(newData);
    this.scheduleSync(newData);
    this.notify();
    return { data: newData, freezeConsumed };
  }

  consumeStreakFreeze(): FreezeResult {
    const { data: newData, success } = gamificationEngine.consumeStreakFreeze(this.data);
    if (success) {
      this.data = newData;
      this.persist(newData);
      this.scheduleSync(newData);
      this.notify();
    }
    return { data: newData, success };
  }

  addStreakFreeze(count?: number): void {
    const newData = gamificationEngine.addStreakFreeze(this.data, count);
    this.data = newData;
    this.persist(newData);
    this.scheduleSync(newData);
    this.notify();
  }

  completeDailyChallenge(challengeId: string): void {
    const { data: newData } = gamificationEngine.completeDailyChallenge(this.data, challengeId);
    this.data = newData;
    this.persist(newData);
    this.scheduleSync(newData);
    this.notify();
  }

  checkForRewardChests(): ChestResult {
    const { data: newData, chest } = gamificationEngine.checkAndClaimRewardChest(this.data);
    if (newData !== this.data) {
      this.persist(newData);
      this.scheduleSync(newData);
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

  private persist(data: StoredGamification) {
    const record = { ...data, id: 1 as const };
    this.db.gamification.put(record).catch((err) => logError("GamificationService.persist", err));
  }

  private scheduleSync(data: StoredGamification) {
    if (this.syncTimer) clearTimeout(this.syncTimer);
    this.syncTimer = setTimeout(() => {
      this.syncToServer(data);
    }, 2000);
  }

  private saveSnapshot(data: StoredGamification) {
    const label =
      typeof window !== "undefined"
        ? window.localStorage.getItem("lumni_display_name") || undefined
        : undefined;
    setTimeout(() => {
      saveWeeklySnapshot(label || "You", data.totalXp, data.currentStreak);
    }, 0);
  }

  private async syncToServer(data: StoredGamification) {
    try {
      const label =
        (typeof window !== "undefined"
          ? window.localStorage.getItem("lumni_display_name")
          : null) || undefined;
      await apiFetch("/api/gamification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, label }),
      });
    } catch (err) {
      logError("GamificationService.syncToServer", err);
    }
  }
}
