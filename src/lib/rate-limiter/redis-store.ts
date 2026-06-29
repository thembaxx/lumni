import { Redis } from "@upstash/redis";
import type { RateLimitStore, RateLimitStoreEntry } from "./core";

const ATOMIC_INCREMENT_LUA = `
local key = KEYS[1]
local max = tonumber(ARGV[1])
local windowMs = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

local raw = redis.call("GET", key)
local entry = nil
if raw then
  entry = cjson.decode(raw)
end

if not entry or entry.resetAt < now then
  local resetAt = now + windowMs
  local newEntry = cjson.encode({ count = 1, resetAt = resetAt })
  redis.call("SETEX", key, math.ceil(windowMs / 1000), newEntry)
  return cjson.encode({ count = 1, resetAt = resetAt })
end

if entry.count >= max then
  return cjson.encode(entry)
end

entry.count = entry.count + 1
local ttl = math.max(1, math.ceil((entry.resetAt - now) / 1000))
local newEntry = cjson.encode(entry)
redis.call("SETEX", key, ttl, newEntry)
return cjson.encode(entry)
`;

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

  async atomicIncrement(
    key: string,
    max: number,
    windowMs: number,
  ): Promise<{ count: number; resetAt: number }> {
    const result = await this.redis.eval(
      ATOMIC_INCREMENT_LUA,
      [`ratelimit:${key}`],
      [String(max), String(windowMs), String(Date.now())],
    );
    const parsed = JSON.parse(result as string);
    return { count: parsed.count, resetAt: parsed.resetAt };
  }
}
