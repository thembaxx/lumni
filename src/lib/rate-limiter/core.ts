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
  get(key: string): RateLimitStoreEntry | undefined | Promise<RateLimitStoreEntry | undefined>;
  set(key: string, value: RateLimitStoreEntry): void | Promise<void>;
  delete(key: string): void | Promise<void>;
  entries():
    | IterableIterator<[string, RateLimitStoreEntry]>
    | Promise<IterableIterator<[string, RateLimitStoreEntry]>>;
  size(): number | Promise<number>;
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

async function resolveRecord(
  record: RateLimitStoreEntry | undefined | Promise<RateLimitStoreEntry | undefined>,
): Promise<RateLimitStoreEntry | undefined> {
  return record;
}

export class RateLimiter {
  private store: RateLimitStore;

  constructor(store?: RateLimitStore) {
    this.store = store ?? new MapStore();
  }

  async check(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const now = Date.now();
    const record = await resolveRecord(this.store.get(key));

    if (!record || record.resetAt < now) {
      const resetAt = now + config.windowMs;
      await this.store.set(key, { count: 1, resetAt });
      return { allowed: true, remaining: config.max - 1, resetAt };
    }

    if (record.count >= config.max) {
      return { allowed: false, remaining: 0, resetAt: record.resetAt };
    }

    record.count++;
    await this.store.set(key, record);
    return {
      allowed: true,
      remaining: config.max - record.count,
      resetAt: record.resetAt,
    };
  }

  async peek(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const now = Date.now();
    const record = await resolveRecord(this.store.get(key));

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

  async reset(key: string): Promise<void> {
    await this.store.delete(key);
  }

  async cleanup(): Promise<void> {
    const now = Date.now();
    const entries = await this.store.entries();
    const expired: string[] = [];
    for (const [key, value] of entries) {
      if (value.resetAt < now) expired.push(key);
    }
    await Promise.all(expired.map((key) => this.store.delete(key)));
  }

  async getStoreSize(): Promise<number> {
    return this.store.size();
  }
}

export function getRateLimitHeaders(result: RateLimitResult) {
  return {
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.resetAt),
    "Retry-After": result.allowed ? "" : String(Math.ceil((result.resetAt - Date.now()) / 1000)),
  };
}
