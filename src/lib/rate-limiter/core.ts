import { Effect } from "effect";
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

function storeGetEffect(
  store: RateLimitStore,
  key: string,
): Effect.Effect<RateLimitStoreEntry | undefined> {
  return Effect.tryPromise(() => Promise.resolve(store.get(key))).pipe(
    Effect.catchAll(() => Effect.sync<RateLimitStoreEntry | undefined>(() => undefined)),
  );
}

function storeSetEffect(
  store: RateLimitStore,
  key: string,
  value: RateLimitStoreEntry,
): Effect.Effect<void> {
  return Effect.tryPromise(() => Promise.resolve(store.set(key, value))).pipe(
    Effect.catchAll(() => Effect.void),
  );
}

function storeEntriesEffect(
  store: RateLimitStore,
): Effect.Effect<IterableIterator<[string, RateLimitStoreEntry]>> {
  return Effect.tryPromise(() => Promise.resolve(store.entries())).pipe(
    Effect.catchAll(() => Effect.succeed(new Map().entries())),
  );
}

function storeDeleteEffect(store: RateLimitStore, key: string): Effect.Effect<void> {
  return Effect.tryPromise(() => Promise.resolve(store.delete(key))).pipe(
    Effect.catchAll(() => Effect.void),
  );
}

export class RateLimiter {
  private store: RateLimitStore;

  constructor(store?: RateLimitStore) {
    this.store = store ?? createRateLimitStore();
  }

  checkEffect(
    key: string,
    config: RateLimitConfig,
  ): Effect.Effect<RateLimitResult, RateLimitExceeded> {
    const store = this.store;
    return Effect.gen(function* () {
      const now = Date.now();

      if (typeof store.atomicIncrement === "function") {
        const result = yield* Effect.promise(() =>
          store.atomicIncrement!(key, config.max, config.windowMs),
        );
        if (result.count > config.max) {
          return yield* Effect.fail(
            new RateLimitExceeded({
              allowed: false,
              remaining: 0,
              resetAt: result.resetAt,
            }),
          );
        }
        return {
          allowed: true,
          remaining: config.max - result.count,
          resetAt: result.resetAt,
        } as RateLimitResult;
      }

      const record = yield* storeGetEffect(store, key);

      if (!record || record.resetAt < now) {
        const resetAt = now + config.windowMs;
        yield* storeSetEffect(store, key, { count: 1, resetAt });
        return { allowed: true, remaining: config.max - 1, resetAt } as RateLimitResult;
      }

      if (record.count >= config.max) {
        return yield* Effect.fail(
          new RateLimitExceeded({
            allowed: false,
            remaining: 0,
            resetAt: record.resetAt,
          }),
        );
      }

      record.count++;
      yield* storeSetEffect(store, key, record);
      return {
        allowed: true,
        remaining: config.max - record.count,
        resetAt: record.resetAt,
      } as RateLimitResult;
    });
  }

  async check(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    return Effect.runPromise(
      this.checkEffect(key, config).pipe(Effect.catchAll((e) => Effect.succeed(e.result))),
    );
  }

  async peek(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const store = this.store;
    return Effect.runPromise(
      Effect.gen(function* () {
        const now = Date.now();
        const record = yield* storeGetEffect(store, key);

        if (!record || record.resetAt < now) {
          return {
            allowed: true,
            remaining: config.max,
            resetAt: now + config.windowMs,
          } as RateLimitResult;
        }

        return {
          allowed: record.count < config.max,
          remaining: Math.max(0, config.max - record.count),
          resetAt: record.resetAt,
        } as RateLimitResult;
      }),
    );
  }

  async reset(key: string): Promise<void> {
    await this.store.delete(key);
  }

  async cleanup(): Promise<void> {
    const now = Date.now();
    const store = this.store;
    await Effect.runPromise(
      Effect.gen(function* () {
        const entries = yield* storeEntriesEffect(store);
        const expired: string[] = [];
        for (const [key, value] of entries) {
          if (value.resetAt < now) expired.push(key);
        }
        yield* Effect.all(expired.map((k) => storeDeleteEffect(store, k)));
      }),
    );
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

export function createRateLimitStore(): RateLimitStore {
  if (process.env.REDIS_URL && process.env.REDIS_TOKEN) {
    return new RedisStore();
  }
  return new MapStore();
}
