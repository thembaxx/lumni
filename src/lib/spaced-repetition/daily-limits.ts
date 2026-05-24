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
		if (!stored) {
			return { date: getTodayKey(), newCardsUsed: 0, reviewsUsed: 0 };
		}
		const parsed = JSON.parse(stored) as DailyBudget;
		if (parsed.date !== getTodayKey()) {
			return { date: getTodayKey(), newCardsUsed: 0, reviewsUsed: 0 };
		}
		return parsed;
	} catch {
		return { date: getTodayKey(), newCardsUsed: 0, reviewsUsed: 0 };
	}
}

function saveBudget(budget: DailyBudget): void {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(DAILY_LIMIT_KEY, JSON.stringify(budget));
	} catch {}
}

export function getDailyRemaining(
	maxNew: number,
	maxReviews: number,
): { newRemaining: number; reviewsRemaining: number } {
	const budget = loadBudget();
	return {
		newRemaining: Math.max(0, maxNew - budget.newCardsUsed),
		reviewsRemaining: Math.max(0, maxReviews - budget.reviewsUsed),
	};
}

export function consumeNewCard(maxNew: number): boolean {
	const budget = loadBudget();
	if (budget.newCardsUsed >= maxNew) return false;
	budget.newCardsUsed += 1;
	saveBudget(budget);
	return true;
}

export function consumeReview(maxReviews: number): boolean {
	const budget = loadBudget();
	if (budget.reviewsUsed >= maxReviews) return false;
	budget.reviewsUsed += 1;
	saveBudget(budget);
	return true;
}

export function getNewCardLimit(maxNew: number, count: number): number {
	const { newRemaining } = getDailyRemaining(maxNew, 0);
	if (count <= newRemaining) return count;
	const remaining = Math.max(0, newRemaining);
	if (remaining <= 0) return 0;
	return remaining;
}

export function getReviewLimit(maxReviews: number, count: number): number {
	const { reviewsRemaining } = getDailyRemaining(0, maxReviews);
	if (count <= reviewsRemaining) return count;
	const remaining = Math.max(0, reviewsRemaining);
	if (remaining <= 0) return 0;
	return remaining;
}

export function resetDailyBudget(): void {
	saveBudget({ date: getTodayKey(), newCardsUsed: 0, reviewsUsed: 0 });
}
