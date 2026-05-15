export interface RateLimitConfig {
	max: number;
	windowMs: number;
}

export interface RateLimitResult {
	allowed: boolean;
	remaining: number;
	resetAt: number;
}

export class RateLimiter {
	private store = new Map<string, { count: number; resetAt: number }>();

	check(key: string, config: RateLimitConfig): RateLimitResult {
		const now = Date.now();
		const record = this.store.get(key);

		if (!record || record.resetAt < now) {
			const resetAt = now + config.windowMs;
			this.store.set(key, { count: 1, resetAt });
			return { allowed: true, remaining: config.max - 1, resetAt };
		}

		if (record.count >= config.max) {
			return { allowed: false, remaining: 0, resetAt: record.resetAt };
		}

		record.count++;
		return { allowed: true, remaining: config.max - record.count, resetAt: record.resetAt };
	}

	peek(key: string, config: RateLimitConfig): RateLimitResult {
		const now = Date.now();
		const record = this.store.get(key);

		if (!record || record.resetAt < now) {
			return { allowed: true, remaining: config.max, resetAt: now + config.windowMs };
		}

		return {
			allowed: record.count < config.max,
			remaining: Math.max(0, config.max - record.count),
			resetAt: record.resetAt,
		};
	}

	reset(key: string): void {
		this.store.delete(key);
	}

	cleanup(): void {
		const now = Date.now();
		for (const [key, value] of this.store.entries()) {
			if (value.resetAt < now) {
				this.store.delete(key);
			}
		}
	}

	getStoreSize(): number {
		return this.store.size;
	}
}

export function getRateLimitHeaders(result: RateLimitResult) {
	return {
		"X-RateLimit-Remaining": String(result.remaining),
		"X-RateLimit-Reset": String(result.resetAt),
		"Retry-After": result.allowed
			? ""
			: String(Math.ceil((result.resetAt - Date.now()) / 1000)),
	};
}
