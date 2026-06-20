import type { ObservabilityDataAccess } from "@/lib/db";
import { dexieDataAccess } from "@/lib/db";
import type { StoredGamification } from "@/lib/gamification-engine";
import { gamificationEngine } from "@/lib/gamification-engine";
import { saveWeeklySnapshot } from "@/lib/services/leaderboard-service";
import { apiFetch } from "@/lib/shared/api-fetch";
import { logError } from "@/lib/shared/logger";
import type { Achievement, RewardChestDef } from "@/types/gamification";
import {
	ACHIEVEMENTS,
	calculateLevel,
	REWARD_CHESTS,
} from "@/types/gamification";

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

	addXp(
		amount: number,
		accuracy: number,
		streak: number,
		subject?: string,
	): XpResult {
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
	): Achievement[] {
		const ids = gamificationEngine.checkAndUnlockAchievements(
			this.data,
			questionsAnswered,
			accuracy,
			streak,
			currentLevel,
			perfectQuiz,
		);
		return ids
			.map((id) => {
				const result = this.addAchievement(id);
				return result.achievement;
			})
			.filter((a): a is Achievement => a !== null);
	}

	updateStreak(): StreakResult {
		const { data: newData, freezeConsumed } = gamificationEngine.updateStreak(
			this.data,
		);
		this.data = newData;
		this.persist(newData);
		this.scheduleSync(newData);
		this.notify();
		return { data: newData, freezeConsumed };
	}

	consumeStreakFreeze(): FreezeResult {
		const { data: newData, success } = gamificationEngine.consumeStreakFreeze(
			this.data,
		);
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
		const { data: newData } = gamificationEngine.completeDailyChallenge(
			this.data,
			challengeId,
		);
		this.data = newData;
		this.persist(newData);
		this.scheduleSync(newData);
		this.notify();
	}

	checkForRewardChests(): ChestResult {
		const { data: newData, chest } =
			gamificationEngine.checkAndClaimRewardChest(this.data);
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
			const stored = this.data.achievements.find(
				(a) => a.id === achievement.id,
			);
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
		this.db.gamification
			.put(record)
			.catch((err) => logError("GamificationService.persist", err));
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
