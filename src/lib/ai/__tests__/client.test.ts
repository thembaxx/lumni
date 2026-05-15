import { describe, expect, test } from "bun:test";
import { AIClient } from "../client";

describe("AIClient", () => {
	test("isConfigured returns false with no config", () => {
		const client = new AIClient({});
		expect(client.isConfigured()).toBe(false);
	});

	test("generate returns failure when no providers configured", async () => {
		const client = new AIClient({});
		const result = await client.generate("test");
		expect(result).toHaveProperty("error");
		expect((result as { available: boolean }).available).toBe(false);
	});

	test("generateWithSystem returns failure when no providers configured", async () => {
		const client = new AIClient({});
		const result = await client.generateWithSystem("system", "user");
		expect(result).toHaveProperty("error");
		expect((result as { available: boolean }).available).toBe(false);
	});

	test("generateBatch returns per-item results", async () => {
		const client = new AIClient({});
		const results = await client.generateBatch(["a", "b"]);
		expect(results).toHaveLength(2);
	});

	test("getProviders returns empty when unconfigured", () => {
		const client = new AIClient({});
		expect(client.getProviders()).toEqual([]);
	});
});
