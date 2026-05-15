export type AICallType = "generate" | "grade" | "hint" | "visual";

interface UsageRecord {
	count: number;
	tokens: number;
	resetAt: number;
}

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

function getDailyReset(): number {
	const d = new Date();
	d.setDate(d.getDate() + 1);
	d.setHours(0, 0, 0, 0);
	return d.getTime();
}

export class TokenTracker {
	private userUsage = new Map<string, Map<AICallType, UsageRecord>>();
	private globalCalls = 0;
	private globalResetAt = 0;
	private currentDate = "";

	private ensureDate() {
		const today = getDateKey();
		if (today !== this.currentDate) {
			this.userUsage.clear();
			this.globalCalls = 0;
			this.globalResetAt = getDailyReset();
			this.currentDate = today;
		}
	}

	private getUserMap(userId: string): Map<AICallType, UsageRecord> {
		this.ensureDate();
		let userMap = this.userUsage.get(userId);
		if (!userMap) {
			userMap = new Map();
			this.userUsage.set(userId, userMap);
		}
		return userMap;
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

		const userMap = this.getUserMap(userId);
		const record = userMap.get(type);
		const userUsed = record?.count ?? 0;
		const userRemaining = Math.max(0, USER_LIMITS[type].maxPerDay - userUsed);

		const globalRemaining = Math.max(0, GLOBAL_LIMIT_TOTAL - this.globalCalls);

		return {
			allowed: userRemaining > 0 && globalRemaining > 0,
			remaining: { user: userRemaining, global: globalRemaining },
			resetAt: this.globalResetAt,
		};
	}

	increment(
		type: AICallType,
		userId: string = "anonymous",
		tokens: number = 0,
	): void {
		this.ensureDate();

		const userMap = this.getUserMap(userId);
		const existing = userMap.get(type);
		userMap.set(type, {
			count: (existing?.count ?? 0) + 1,
			tokens: (existing?.tokens ?? 0) + tokens,
			resetAt: this.globalResetAt,
		});

		this.globalCalls++;
	}

	getUsage(
		userId: string = "anonymous",
	): Record<AICallType, { count: number; tokens: number; limit: number }> {
		this.ensureDate();
		const userMap = this.getUserMap(userId);
		const result = {} as Record<
			AICallType,
			{ count: number; tokens: number; limit: number }
		>;
		for (const type of Object.keys(USER_LIMITS) as AICallType[]) {
			const record = userMap.get(type);
			result[type] = {
				count: record?.count ?? 0,
				tokens: record?.tokens ?? 0,
				limit: USER_LIMITS[type].maxPerDay,
			};
		}
		return result;
	}

	getGlobalUsage(): { totalCalls: number; limit: number } {
		this.ensureDate();
		return { totalCalls: this.globalCalls, limit: GLOBAL_LIMIT_TOTAL };
	}
}

export const tokenTracker = new TokenTracker();
