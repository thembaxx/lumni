import type { ObservabilityDataAccess } from "@/lib/db";
import type { StoredGamification } from "./types";
import type { Achievement, RewardChestDef } from "@/types/gamification";

export interface GamificationDeps {
  db: ObservabilityDataAccess;
}

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
