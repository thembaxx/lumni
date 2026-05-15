export interface RateLimitConfig {
	max: number;
	windowMs: number;
}

export interface RateLimitResult {
	allowed: boolean;
	remaining: number;
	resetAt: number;
}

export interface RateLimitStoreEntry {
	count: number;
	resetAt: number;
}

export interface RateLimitStore {
	get(key: string): RateLimitStoreEntry | undefined;
	set(key: string, value: RateLimitStoreEntry): void;
	delete(key: string): void;
	entries(): IterableIterator<[string, RateLimitStoreEntry]>;
	size(): number;
}

class MapStore implements RateLimitStore {
	private store = new Map<string, RateLimitStoreEntry>();

	get(key: string): RateLimitStoreEntry | undefined {
		return this.store.get(key);
	}
	set(key: string, value: RateLimitStoreEntry): void {
		this.store.set(key, value);
	}
	delete(key: string): void {
		this.store.delete(key);
	}
	entries(): IterableIterator<[string, RateLimitStoreEntry]> {
		return this.store.entries();
	}
	size(): number {
		return this.store.size;
	}
}

export class RateLimiter {
	private store: RateLimitStore;

	constructor(store?: RateLimitStore) {
		this.store = store ?? new MapStore();
	}

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
		return {
			allowed: true,
			remaining: config.max - record.count,
			resetAt: record.resetAt,
		};
	}

	peek(key: string, config: RateLimitConfig): RateLimitResult {
		const now = Date.now();
		const record = this.store.get(key);

		if (!record || record.resetAt < now) {
			return {
				allowed: true,
				remaining: config.max,
				resetAt: now + config.windowMs,
			};
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
		return this.store.size();
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
