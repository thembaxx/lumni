import { dexieDataAccess } from "@/lib/db";
import type { FlashcardDataAccess } from "@/lib/db/data-access";
import { enqueue } from "@/lib/orchestrator/job-queue";
import { loadFromStorage, saveToStorage } from "@/lib/utils/storage";
import { createDailyLimits } from "./daily-limits";

export interface EngineDependencies {
  db: FlashcardDataAccess;
  enqueue: (type: string, payload: Record<string, unknown>) => Promise<unknown>;
  loadFromStorage: <T>(key: string, fallback: T) => T;
  saveToStorage: (key: string, value: unknown) => void;
  dailyLimits?: ReturnType<typeof createDailyLimits>;
}

export const DEFAULT_DEPS: EngineDependencies = {
  db: dexieDataAccess,
  enqueue: enqueue as unknown as EngineDependencies["enqueue"],
  loadFromStorage,
  saveToStorage,
};
