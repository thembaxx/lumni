import { describe, expect, test } from "vitest";
import { RateLimiter } from "../core";

describe("createRateLimitStore fallback", () => {
  test("RateLimiter default store works in-memory when no REDIS_URL", async () => {
    delete process.env.REDIS_URL;
    delete process.env.REDIS_TOKEN;
    const limiter = new RateLimiter();
    const result = await limiter.check("test", { max: 5, windowMs: 60000 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });
});
