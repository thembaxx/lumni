import { describe, expect, test } from "bun:test";
import { getRateLimitHeaders, RateLimiter } from "../core";

describe("RateLimiter", () => {
	const config = { max: 3, windowMs: 60000 };

	test("allows first request", () => {
		const limiter = new RateLimiter();
		const result = limiter.check("key1", config);
		expect(result.allowed).toBe(true);
		expect(result.remaining).toBe(2);
	});

	test("decrements remaining on each request", () => {
		const limiter = new RateLimiter();
		limiter.check("key2", config);
		const r2 = limiter.check("key2", config);
		expect(r2.remaining).toBe(1);
		const r3 = limiter.check("key2", config);
		expect(r3.allowed).toBe(true);
		expect(r3.remaining).toBe(0);
	});

	test("blocks when limit exceeded", () => {
		const limiter = new RateLimiter();
		limiter.check("key3", config);
		limiter.check("key3", config);
		limiter.check("key3", config);
		const r4 = limiter.check("key3", config);
		expect(r4.allowed).toBe(false);
		expect(r4.remaining).toBe(0);
	});

	test("different keys have independent counters", () => {
		const limiter = new RateLimiter();
		limiter.check("a", config);
		limiter.check("a", config);
		const rb = limiter.check("b", config);
		expect(rb.allowed).toBe(true);
		expect(rb.remaining).toBe(2);
	});

	test("reset clears a key", () => {
		const limiter = new RateLimiter();
		limiter.check("key4", config);
		limiter.check("key4", config);
		limiter.check("key4", config);
		limiter.reset("key4");
		const r = limiter.check("key4", config);
		expect(r.allowed).toBe(true);
		expect(r.remaining).toBe(2);
	});

	test("cleanup removes expired entries", () => {
		const limiter = new RateLimiter();
		limiter.check("expire", { max: 1, windowMs: -1 });
		expect(limiter.getStoreSize()).toBe(1);
		limiter.cleanup();
		expect(limiter.getStoreSize()).toBe(0);
	});

	test("supports different configs per key", () => {
		const limiter = new RateLimiter();
		const strict = { max: 1, windowMs: 60000 };
		limiter.check("strict", strict);
		const r2 = limiter.check("strict", strict);
		expect(r2.allowed).toBe(false);
	});

	test("resetAt is in the future", () => {
		const limiter = new RateLimiter();
		const result = limiter.check("future", config);
		expect(result.resetAt).toBeGreaterThan(Date.now() - 1000);
	});
});

describe("getRateLimitHeaders", () => {
	test("returns correct headers for allowed request", () => {
		const headers = getRateLimitHeaders({
			allowed: true,
			remaining: 4,
			resetAt: 1000,
		});
		expect(headers["X-RateLimit-Remaining"]).toBe("4");
		expect(headers["X-RateLimit-Reset"]).toBe("1000");
	});

	test("returns Retry-After for blocked request", () => {
		const future = Date.now() + 30000;
		const headers = getRateLimitHeaders({
			allowed: false,
			remaining: 0,
			resetAt: future,
		});
		expect(headers["Retry-After"]).toBe("30");
	});
});
