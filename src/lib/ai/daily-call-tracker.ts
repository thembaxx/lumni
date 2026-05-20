import { Query } from "appwrite";
import { databases } from "@/lib/appwrite";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";
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

export class DailyCallTracker {
	private perUserLimiters = new Map<string, Map<AICallType, RateLimiter>>();
	private globalLimiter = new RateLimiter();
	private tokensByUser = new Map<string, Map<AICallType, number>>();
	private currentDate = "";

	private ensureDate() {
		const today = new Date().toISOString().split("T")[0];
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

	async check(
		type: AICallType,
		userId: string = "anonymous",
	): Promise<{
		allowed: boolean;
		remaining: { user: number; global: number };
		resetAt: number;
	}> {
		const startOfToday = new Date();
		startOfToday.setHours(0, 0, 0, 0);
		const todayStr = startOfToday.toISOString();

		const endOfToday = new Date();
		endOfToday.setHours(23, 59, 59, 999);
		const resetAt = endOfToday.getTime();

		if (APPWRITE_DATABASE_ID && databases) {
			try {
				const userRes = await databases.listDocuments(
					APPWRITE_DATABASE_ID,
					COLLECTIONS.ANALYTICS || "analytics",
					[
						Query.equal("eventType", "ai_call"),
						Query.equal("userId", userId),
						Query.equal("subjectId", type),
						Query.greaterThanEqual("timestamp", todayStr),
						Query.limit(1),
					],
				);

				const globalRes = await databases.listDocuments(
					APPWRITE_DATABASE_ID,
					COLLECTIONS.ANALYTICS || "analytics",
					[
						Query.equal("eventType", "ai_call"),
						Query.greaterThanEqual("timestamp", todayStr),
						Query.limit(1),
					],
				);

				const userCount = userRes.total;
				const globalCount = globalRes.total;

				const userAllowed = userCount < USER_LIMITS[type].maxPerDay;
				const globalAllowed = globalCount < GLOBAL_LIMIT_TOTAL;

				return {
					allowed: userAllowed && globalAllowed,
					remaining: {
						user: Math.max(0, USER_LIMITS[type].maxPerDay - userCount),
						global: Math.max(0, GLOBAL_LIMIT_TOTAL - globalCount),
					},
					resetAt,
				};
			} catch (error) {
				console.warn(
					"[DailyCallTracker] Appwrite query failed, falling back to in-memory:",
					error,
				);
			}
		}

		// Fallback to in-memory
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

	async increment(
		type: AICallType,
		userId: string = "anonymous",
		tokens: number = 0,
	): Promise<void> {
		if (APPWRITE_DATABASE_ID && databases) {
			try {
				await databases.createDocument(
					APPWRITE_DATABASE_ID,
					COLLECTIONS.ANALYTICS || "analytics",
					"unique()",
					{
						eventType: "ai_call",
						userId: userId,
						subjectId: type,
						metadata: JSON.stringify({ tokens }),
						timestamp: new Date().toISOString(),
					},
				);
				return;
			} catch (error) {
				console.warn(
					"[DailyCallTracker] Appwrite increment failed, falling back to in-memory:",
					error,
				);
			}
		}

		// Fallback to in-memory
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

	async getUsage(
		userId: string = "anonymous",
	): Promise<
		Record<AICallType, { count: number; tokens: number; limit: number }>
	> {
		const startOfToday = new Date();
		startOfToday.setHours(0, 0, 0, 0);
		const todayStr = startOfToday.toISOString();

		if (APPWRITE_DATABASE_ID && databases) {
			try {
				const result = {} as Record<
					AICallType,
					{ count: number; tokens: number; limit: number }
				>;

				for (const type of Object.keys(USER_LIMITS) as AICallType[]) {
					const res = await databases.listDocuments(
						APPWRITE_DATABASE_ID,
						COLLECTIONS.ANALYTICS || "analytics",
						[
							Query.equal("eventType", "ai_call"),
							Query.equal("userId", userId),
							Query.equal("subjectId", type),
							Query.greaterThanEqual("timestamp", todayStr),
							Query.limit(100),
						],
					);

					const count = res.total;
					const tokens = res.documents.reduce((sum, doc) => {
						try {
							const meta = JSON.parse(
								(doc as Record<string, unknown>).metadata as string,
							);
							return sum + ((meta as Record<string, number>).tokens || 0);
						} catch {
							return sum;
						}
					}, 0);

					result[type] = {
						count,
						tokens,
						limit: USER_LIMITS[type].maxPerDay,
					};
				}
				return result;
			} catch (error) {
				console.warn(
					"[DailyCallTracker] Appwrite getUsage failed, falling back to in-memory:",
					error,
				);
			}
		}

		// Fallback to in-memory
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

	async getGlobalUsage(): Promise<{ totalCalls: number; limit: number }> {
		const startOfToday = new Date();
		startOfToday.setHours(0, 0, 0, 0);
		const todayStr = startOfToday.toISOString();

		if (APPWRITE_DATABASE_ID && databases) {
			try {
				const res = await databases.listDocuments(
					APPWRITE_DATABASE_ID,
					COLLECTIONS.ANALYTICS || "analytics",
					[
						Query.equal("eventType", "ai_call"),
						Query.greaterThanEqual("timestamp", todayStr),
						Query.limit(1),
					],
				);
				return {
					totalCalls: res.total,
					limit: GLOBAL_LIMIT_TOTAL,
				};
			} catch (error) {
				console.warn(
					"[DailyCallTracker] Appwrite getGlobalUsage failed, falling back to in-memory:",
					error,
				);
			}
		}

		// Fallback to in-memory
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
