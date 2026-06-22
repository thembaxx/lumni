import { Redis } from "@upstash/redis";
import type { RateLimitStore, RateLimitStoreEntry } from "./core";

export class RedisStore implements RateLimitStore {
  private redis: Redis;

  constructor(url?: string, token?: string) {
    this.redis = new Redis({
      url: url ?? process.env.REDIS_URL ?? "",
      token: token ?? process.env.REDIS_TOKEN ?? "",
    });
  }

  async get(key: string): Promise<RateLimitStoreEntry | undefined> {
    const raw = await this.redis.get<{ count: number; resetAt: number }>(`ratelimit:${key}`);
    if (!raw) return undefined;
    return { count: raw.count, resetAt: raw.resetAt };
  }

  async set(key: string, value: RateLimitStoreEntry): Promise<void> {
    const ttl = Math.max(1, Math.ceil((value.resetAt - Date.now()) / 1000));
    await this.redis.setex(`ratelimit:${key}`, ttl, value);
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(`ratelimit:${key}`);
  }

  entries(): IterableIterator<[string, RateLimitStoreEntry]> {
    return new Map()[Symbol.iterator]();
  }

  async size(): Promise<number> {
    try {
      return await this.redis.dbsize();
    } catch {
      return 0;
    }
  }
}
