import { RateLimiter } from "@/lib/rate-limiter/core";

export type AICallType = "generate" | "grade" | "hint" | "visual";

const DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;

const USER_LIMITS: Record<AICallType, { maxPerDay: number }> = {
	generate: { maxPerDay: 20 },
	grade: { maxPerDay: 100 },
	hint: { maxPerDay: 20 },
	visual: { maxPerDay: 50 },
};

const GLOBAL_LIMIT_TOTAL = 2000;

function getDateKey(): string {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export class DailyCallTracker {
	private perUserLimiters = new Map<string, Map<AICallType, RateLimiter>>();
	private globalLimiter = new RateLimiter();
	private tokensByUser = new Map<string, Map<AICallType, number>>();
	private currentDate = "";

	private ensureDate() {
		const today = getDateKey();
		if (today !== this.currentDate) {
			this.perUserLimiters.clear();
			this.globalLimiter = new RateLimiter();
			this.tokensByUser.clear();
			this.currentDate = today;
		}
	}

	private getLimiter(userId: string, type: AICallType): RateLimiter {
		let userMap = this.perUserLimiters.get(userId);
		if (!userMap) {
			userMap = new Map();
			this.perUserLimiters.set(userId, userMap);
		}
		let limiter = userMap.get(type);
		if (!limiter) {
			limiter = new RateLimiter();
			userMap.set(type, limiter);
		}
		return limiter;
	}

	private getTokenMap(userId: string): Map<AICallType, number> {
		let m = this.tokensByUser.get(userId);
		if (!m) {
			m = new Map();
			this.tokensByUser.set(userId, m);
		}
		return m;
	}

	check(
		type: AICallType,
		userId: string = "anonymous",
	): {
		allowed: boolean;
		remaining: { user: number; global: number };
		resetAt: number;
	} {
		this.ensureDate();

		const limiter = this.getLimiter(userId, type);
		const userResult = limiter.peek(`${userId}:${type}`, {
			max: USER_LIMITS[type].maxPerDay,
			windowMs: DAILY_WINDOW_MS,
		});
		const globalResult = this.globalLimiter.peek("global", {
			max: GLOBAL_LIMIT_TOTAL,
			windowMs: DAILY_WINDOW_MS,
		});

		return {
			allowed: userResult.allowed && globalResult.allowed,
			remaining: { user: userResult.remaining, global: globalResult.remaining },
			resetAt: globalResult.resetAt,
		};
	}

	increment(
		type: AICallType,
		userId: string = "anonymous",
		tokens: number = 0,
	): void {
		this.ensureDate();

		const limiter = this.getLimiter(userId, type);
		limiter.check(`${userId}:${type}`, {
			max: USER_LIMITS[type].maxPerDay,
			windowMs: DAILY_WINDOW_MS,
		});
		this.globalLimiter.check("global", {
			max: GLOBAL_LIMIT_TOTAL,
			windowMs: DAILY_WINDOW_MS,
		});

		const tokenMap = this.getTokenMap(userId);
		const current = tokenMap.get(type) ?? 0;
		tokenMap.set(type, current + tokens);
	}

	getUsage(
		userId: string = "anonymous",
	): Record<AICallType, { count: number; tokens: number; limit: number }> {
		this.ensureDate();
		const tokenMap = this.getTokenMap(userId);
		const result = {} as Record<
			AICallType,
			{ count: number; tokens: number; limit: number }
		>;
		for (const type of Object.keys(USER_LIMITS) as AICallType[]) {
			const limiter = this.getLimiter(userId, type);
			const peeking = limiter.peek(`${userId}:${type}`, {
				max: USER_LIMITS[type].maxPerDay,
				windowMs: DAILY_WINDOW_MS,
			});
			result[type] = {
				count: USER_LIMITS[type].maxPerDay - peeking.remaining,
				tokens: tokenMap.get(type) ?? 0,
				limit: USER_LIMITS[type].maxPerDay,
			};
		}
		return result;
	}

	getGlobalUsage(): { totalCalls: number; limit: number } {
		this.ensureDate();
		const result = this.globalLimiter.peek("global", {
			max: GLOBAL_LIMIT_TOTAL,
			windowMs: DAILY_WINDOW_MS,
		});
		return {
			totalCalls: GLOBAL_LIMIT_TOTAL - result.remaining,
			limit: GLOBAL_LIMIT_TOTAL,
		};
	}
}

export const dailyCallTracker = new DailyCallTracker();
