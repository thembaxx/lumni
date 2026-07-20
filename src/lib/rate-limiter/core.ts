import { RedisStore } from "./redis-store";

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
  /** Atomically increment a counter, or set to 1 if absent. Returns { count, resetAt }.
   *  RedisStore implements this atomically via Lua script to prevent race conditions.
   *  MapStore delegates to get+set (safe under single-threaded Node.js event loop). */
  atomicIncrement?(
    key: string,
    max: number,
    windowMs: number,
  ): Promise<{ count: number; resetAt: number }>;
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

class RateLimitExceeded {
  readonly _tag = "RateLimitExceeded";
  constructor(readonly result: RateLimitResult) {}
}

async function storeGetSafe(
  store: RateLimitStore,
  key: string,
): Promise<RateLimitStoreEntry | undefined> {
  try {
    return await Promise.resolve(store.get(key));
  } catch {
    return undefined;
  }
}

async function storeSetSafe(
  store: RateLimitStore,
  key: string,
  value: RateLimitStoreEntry,
): Promise<void> {
  try {
    await Promise.resolve(store.set(key, value));
  } catch {
    // Silent
  }
}

async function storeEntriesSafe(
  store: RateLimitStore,
): Promise<IterableIterator<[string, RateLimitStoreEntry]>> {
  try {
    return await Promise.resolve(store.entries());
  } catch {
    return new Map().entries();
  }
}

async function storeDeleteSafe(store: RateLimitStore, key: string): Promise<void> {
  try {
    await Promise.resolve(store.delete(key));
  } catch {
    // Silent
  }
}

export class RateLimiter {
  private store: RateLimitStore;

  constructor(store?: RateLimitStore) {
    this.store = store ?? createRateLimitStore();
  }

  async check(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const now = Date.now();

    if (typeof this.store.atomicIncrement === "function") {
      try {
        const result = await this.store.atomicIncrement!(key, config.max, config.windowMs);
        if (result.count > config.max) {
          return { allowed: false, remaining: 0, resetAt: result.resetAt };
        }
        return { allowed: true, remaining: config.max - result.count, resetAt: result.resetAt };
      } catch {
        return { allowed: false, remaining: 0, resetAt: now + config.windowMs };
      }
    }

    const record = await storeGetSafe(this.store, key);

    if (!record || record.resetAt < now) {
      const resetAt = now + config.windowMs;
      await storeSetSafe(this.store, key, { count: 1, resetAt });
      return { allowed: true, remaining: config.max - 1, resetAt };
    }

    if (record.count >= config.max) {
      return { allowed: false, remaining: 0, resetAt: record.resetAt };
    }

    record.count++;
    await storeSetSafe(this.store, key, record);
    return { allowed: true, remaining: config.max - record.count, resetAt: record.resetAt };
  }

  async peek(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const now = Date.now();
    const record = await storeGetSafe(this.store, key);

    if (!record || record.resetAt < now) {
      return { allowed: true, remaining: config.max, resetAt: now + config.windowMs };
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
    const entries = await storeEntriesSafe(this.store);
    const expired: string[] = [];
    for (const [key, value] of entries) {
      if (value.resetAt < now) expired.push(key);
    }
    await Promise.all(expired.map((k) => storeDeleteSafe(this.store, k)));
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

function createRateLimitStore(): RateLimitStore {
  if (process.env.REDIS_URL && process.env.REDIS_TOKEN) {
    return new RedisStore();
  }
  return new MapStore();
}
