import { logError } from "@/lib/shared/logger";

const DAILY_LIMIT_KEY = "lumni_sr_daily_budget";

interface DailyBudget {
  date: string;
  newCardsUsed: number;
  reviewsUsed: number;
}

function getTodayKey(): string {
  return new Date().toISOString().split("T")[0];
}

function loadBudget(): DailyBudget {
  if (typeof window === "undefined") {
    return { date: getTodayKey(), newCardsUsed: 0, reviewsUsed: 0 };
  }
  try {
    const stored = localStorage.getItem(DAILY_LIMIT_KEY);
    if (!stored) return { date: getTodayKey(), newCardsUsed: 0, reviewsUsed: 0 };
    const parsed = JSON.parse(stored) as DailyBudget;
    if (parsed.date !== getTodayKey()) {
      return { date: getTodayKey(), newCardsUsed: 0, reviewsUsed: 0 };
    }
    return parsed;
  } catch (err) {
    logError("LoadBudget", err);
    return { date: getTodayKey(), newCardsUsed: 0, reviewsUsed: 0 };
  }
}

function saveBudget(budget: DailyBudget): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DAILY_LIMIT_KEY, JSON.stringify(budget));
  } catch (err) {
    logError("SaveBudget", err);
  }
}

export interface DailyLimitAPI {
  getDailyRemaining(
    maxNew: number,
    maxReviews: number,
  ): { newRemaining: number; reviewsRemaining: number };
  consumeNewCard(maxNew: number): boolean;
  consumeReview(maxReviews: number): boolean;
  getNewCardLimit(maxNew: number, count: number): number;
  getReviewLimit(maxReviews: number, count: number): number;
  resetDailyBudget(): void;
}

export function createDailyLimits(): DailyLimitAPI {
  return {
    getDailyRemaining(
      maxNew: number,
      maxReviews: number,
    ): { newRemaining: number; reviewsRemaining: number } {
      const budget = loadBudget();
      return {
        newRemaining: Math.max(0, maxNew - budget.newCardsUsed),
        reviewsRemaining: Math.max(0, maxReviews - budget.reviewsUsed),
      };
    },

    consumeNewCard(maxNew: number): boolean {
      const budget = loadBudget();
      if (budget.newCardsUsed >= maxNew) return false;
      budget.newCardsUsed += 1;
      saveBudget(budget);
      return true;
    },

    consumeReview(maxReviews: number): boolean {
      const budget = loadBudget();
      if (budget.reviewsUsed >= maxReviews) return false;
      budget.reviewsUsed += 1;
      saveBudget(budget);
      return true;
    },

    getNewCardLimit(maxNew: number, count: number): number {
      const { newRemaining } = this.getDailyRemaining(maxNew, 0);
      return Math.min(count, Math.max(0, newRemaining));
    },

    getReviewLimit(maxReviews: number, count: number): number {
      const { reviewsRemaining } = this.getDailyRemaining(0, maxReviews);
      return Math.min(count, Math.max(0, reviewsRemaining));
    },

    resetDailyBudget(): void {
      saveBudget({
        date: getTodayKey(),
        newCardsUsed: 0,
        reviewsUsed: 0,
      });
    },
  };
}
