# Plan 063: Make RateLimiter Redis operations atomic

> **Executor instructions**: Follow this plan step by step. Run every verification command — do not move on until it passes. If anything in STOP conditions occurs, stop and report.

## Status

- **Priority**: P0
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: security / bug
- **Planned at**: commit `245ba077`, 2026-06-29

## Why this matters

The `RateLimiter.checkEffect` method reads a record from the store, increments the count in JavaScript, and writes back. With `RedisStore` under concurrent requests, two requests can both read `count=4` (when `max=5`), both increment to `5`, both write `count=5`, allowing 2× the configured rate limit. This is a classic read-modify-write race condition. The `MapStore` is safe (single-threaded Node.js event loop), but production deployments use Redis.

## Current state

`src/lib/rate-limiter/core.ts:96-127` — the race window:

```typescript
const record = yield* storeGetEffect(store, key);
// Both concurrent requests see count=4 here
if (record.count >= config.max) { ... } // Both pass this check
record.count++;
yield* storeSetEffect(store, key, record); // Both write count=5
```

`src/lib/rate-limiter/redis-store.ts` — uses `@upstash/redis` with simple `get`/`set` commands (no atomic operations):

```typescript
export class RedisStore implements RateLimitStore {
  private redis: Redis;
  constructor() {
    this.redis = new Redis({ url: process.env.REDIS_URL!, token: process.env.REDIS_TOKEN! });
  }
  async get(key: string): Promise<RateLimitStoreEntry | undefined> { ... }
  async set(key: string, value: RateLimitStoreEntry): Promise<void> { ... }
  async delete(key: string): Promise<void> { ... }
  async entries(): Promise<...> { ... }
  async size(): Promise<number> { ... }
}
```

## Scope

**In scope**:

- `src/lib/rate-limiter/core.ts` — `RateLimiter` class, `RateLimitStore` interface
- `src/lib/rate-limiter/redis-store.ts` — `RedisStore` class
- `src/lib/rate-limiter/__tests__/` — existing tests + new tests

**Out of scope**:

- `src/lib/rate-limiter/__tests__/factory.test.ts` — leave the factory test as-is
- `MapStore` — already safe; don't change it
- The `Effect` import chain — keep using Effect as-is; this plan only changes the Redis interaction

## Commands

| Purpose   | Command                                 | Expected on success |
| --------- | --------------------------------------- | ------------------- |
| Typecheck | `pnpm run typecheck`                    | exit 0, no errors   |
| Tests     | `pnpm run test -- src/lib/rate-limiter` | all pass            |
| Lint      | `pnpm exec oxlint --fix`                | exit 0              |

## Steps

### Step 1: Add `atomicIncrement` method to `RateLimitStore` interface

Add to `src/lib/rate-limiter/core.ts:20-28`:

```typescript
export interface RateLimitStore {
  get(key: string): RateLimitStoreEntry | undefined | Promise<RateLimitStoreEntry | undefined>;
  set(key: string, value: RateLimitStoreEntry): void | Promise<void>;
  delete(key: string): void | Promise<void>;
  entries(): IterableIterator<...> | Promise<IterableIterator<...>>;
  size(): number | Promise<number>;
  /** Atomically increment a counter, or set to 1 if absent. Returns { count, resetAt }.
   *  Only RedisStore implements this atomically; MapStore delegates to get+set (safe under single thread). */
  atomicIncrement?(key: string, max: number, windowMs: number): Promise<{ count: number; resetAt: number }>;
}
```

### Step 2: Implement `atomicIncrement` in `RedisStore`

In `src/lib/rate-limiter/redis-store.ts`, add a Lua script or use `EVAL`:

```typescript
async atomicIncrement(key: string, max: number, windowMs: number): Promise<{ count: number; resetAt: number }> {
  const lua = `
    local key = KEYS[1]
    local max = tonumber(ARGV[1])
    local windowMs = tonumber(ARGV[2])
    local now = tonumber(ARGV[3])
    local record = redis.call("GET", key)
    if not record then
      local resetAt = now + windowMs
      redis.call("SET", key, "1|" .. resetAt, "PX", windowMs)
      return {1, resetAt}
    end
    local parts = split(record, "|")
    local count = tonumber(parts[1])
    local resetAt = tonumber(parts[2])
    if resetAt < now then
      resetAt = now + windowMs
      redis.call("SET", key, "1|" .. resetAt, "PX", windowMs)
      return {1, resetAt}
    end
    if count >= max then
      return {count, resetAt}
    end
    count = count + 1
    local ttl = math.max(1, resetAt - now)
    redis.call("SET", key, count .. "|" .. resetAt, "PX", ttl)
    return {count, resetAt}
  `;
  const result = await this.redis.eval(lua, [key], [max, windowMs, Date.now()]);
  return { count: result[0], resetAt: result[1] };
}
```

Also convert `set`/`get` to use the `count|resetAt` pipe-delimited format so the Lua script can parse it. Update `get` to parse `"count|resetAt"` into `RateLimitStoreEntry`, and `set` to serialize that way.

### Step 3: Update `RateLimiter.checkEffect` to use `atomicIncrement`

In `src/lib/rate-limiter/core.ts`, modify `checkEffect`:

```typescript
// At the top of Effect.gen:
if (typeof store.atomicIncrement === "function") {
  const result =
    yield * Effect.promise(() => store.atomicIncrement!(key, config.max, config.windowMs));
  if (result.count > config.max) {
    return (
      yield *
      Effect.fail(new RateLimitExceeded({ allowed: false, remaining: 0, resetAt: result.resetAt }))
    );
  }
  return { allowed: true, remaining: config.max - result.count, resetAt: result.resetAt };
}
// Fallback to existing get+set logic for MapStore
```

### Step 4: Add tests

Create `src/lib/rate-limiter/__tests__/redis-store.test.ts`:

1. Mock `@upstash/redis` with `vi.mock`
2. Test `atomicIncrement` creates entry on first call (key absent)
3. Test `atomicIncrement` increments existing entry within window
4. Test `atomicIncrement` rejects when count exceeds max
5. Test `atomicIncrement` resets when window expired
6. Test `get`/`set` round-trip with pipe-delimited format
7. Test existing `MapStore` still delegates to old path (no `atomicIncrement`)

**Verify**: `pnpm run test -- src/lib/rate-limiter` → all pass, including 7 new tests.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test -- src/lib/rate-limiter` exits 0 with all tests passing
- [ ] `pnpm exec oxlint --fix` exits 0
- [ ] No files outside in-scope list are modified

## STOP conditions

- If `@upstash/redis` doesn't support `eval` (check the API docs) — the RedisStore may need a different approach. Report back.
- If the pipe-delimited format change breaks existing customers' cached rate limit entries — consider backward-compat parsing in `get()`.

## Maintenance notes

- The `atomicIncrement` method is optional on the interface; `MapStore` doesn't implement it. Any new `RateLimitStore` implementation must decide whether to implement it.
- If Upstash Redis changes their `eval` API, the Lua script approach stays the same but the method signature may need updating.
- The Lua script uses a simple `count|resetAt` format — if the `RateLimitStoreEntry` type ever gains fields, the script and format must be updated in lockstep.
