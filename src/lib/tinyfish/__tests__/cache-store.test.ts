import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const cacheStore = new Map<
	string,
	{ key: string; value: unknown; expiresAt: number; fetchedAt: number }
>();
const usageStore = new Map<
	string,
	{ id: number; userId: string; date: string; count: number }
>();
let usageAutoId = 1;

interface MockTable {
	get(key: string): unknown;
	put(value: {
		key: string;
		value: unknown;
		expiresAt: number;
		fetchedAt: number;
	}): Promise<unknown>;
	delete(key: string): Promise<unknown>;
	where(field: string): {
		below(value: number): { toArray(): Promise<{ key: string }[]> };
		equals(value: unknown): {
			first(): Promise<unknown>;
		};
	};
	bulkDelete(keys: string[]): Promise<unknown>;
	add(value: { userId: string; date: string; count: number }): Promise<unknown>;
	update(id: number, value: { count: number }): Promise<unknown>;
}

const mockTinyfishCache: MockTable = {
	get(key) {
		return Promise.resolve(cacheStore.get(key) ?? undefined);
	},
	put(value) {
		cacheStore.set(value.key, value);
		return Promise.resolve(value.key);
	},
	delete(key) {
		cacheStore.delete(key);
		return Promise.resolve(undefined);
	},
	where(field) {
		if (field === "expiresAt") {
			return {
				below(value: number) {
					return {
						async toArray() {
							const out: { key: string }[] = [];
							for (const [k, v] of cacheStore.entries()) {
								if (v.expiresAt < value) out.push({ key: k });
							}
							return out;
						},
					};
				},
				equals(_value: unknown) {
					throw new Error("not used");
				},
			};
		}
		if (field === "[userId+date]") {
			return {
				equals(value: unknown) {
					const [userId, date] = value as [string, string];
					return {
						async first() {
							for (const entry of usageStore.values()) {
								if (entry.userId === userId && entry.date === date) {
									return entry;
								}
							}
							return undefined;
						},
					};
				},
			};
		}
		throw new Error(`unknown field ${field}`);
	},
	bulkDelete(keys: string[]) {
		for (const k of keys) cacheStore.delete(k);
		return Promise.resolve(keys.length);
	},
	add(_value: { userId: string; date: string; count: number }) {
		throw new Error("not used");
	},
	update(_id: number, _value: { count: number }) {
		throw new Error("not used");
	},
};

const mockTinyfishUsage: MockTable = {
	get(_key) {
		throw new Error("not used");
	},
	put(_value) {
		throw new Error("not used");
	},
	delete(_key) {
		throw new Error("not used");
	},
	where(field) {
		if (field === "[userId+date]") {
			return {
				equals(value: unknown) {
					const [userId, date] = value as [string, string];
					return {
						async first() {
							for (const entry of usageStore.values()) {
								if (entry.userId === userId && entry.date === date) {
									return entry;
								}
							}
							return undefined;
						},
					};
				},
				below() {
					throw new Error("not used");
				},
			};
		}
		throw new Error(`unknown field ${field}`);
	},
	bulkDelete() {
		throw new Error("not used");
	},
	add(value: { userId: string; date: string; count: number }) {
		const id = usageAutoId++;
		usageStore.set(`${value.userId}:${value.date}:${id}`, { id, ...value });
		return Promise.resolve(id);
	},
	update(id: number, value: { count: number }) {
		for (const entry of usageStore.values()) {
			if (entry.id === id) {
				entry.count = value.count;
			}
		}
		return Promise.resolve(id);
	},
};

vi.mock("@/lib/db", () => ({
	dexieDataAccess: {
		tinyfishCache: mockTinyfishCache,
		tinyfishUsage: mockTinyfishUsage,
	},
}));

const {
	getCached,
	setCached,
	deleteCached,
	clearExpiredCache,
	getTodayUsageCount,
	incrementTodayUsage,
} = await import("../cache");

beforeEach(() => {
	cacheStore.clear();
	usageStore.clear();
	usageAutoId = 1;
});

afterEach(() => {
	cacheStore.clear();
	usageStore.clear();
});

describe("getCached / setCached", () => {
	test("returns null when not in cache", async () => {
		const result = await getCached("missing");
		expect(result).toBeNull();
	});

	test("stores and retrieves a RagContext", async () => {
		const ctx = {
			sources: [
				{
					url: "https://a.com",
					title: "A",
					snippet: "s",
					content: "c",
					contentTruncated: false,
				},
			],
			xml: "<x/>",
			domainsQueried: ["a.com"],
		};
		await setCached("k1", ctx, 60_000);
		const result = await getCached("k1");
		expect(result).toEqual(ctx);
	});

	test("returns null for expired entries and deletes them", async () => {
		await setCached(
			"expired",
			{ sources: [], xml: "", domainsQueried: [] },
			-1,
		);
		const result = await getCached("expired");
		expect(result).toBeNull();
	});

	test("deleteCached removes entry", async () => {
		await setCached("k2", { sources: [], xml: "", domainsQueried: [] }, 60_000);
		await deleteCached("k2");
		const result = await getCached("k2");
		expect(result).toBeNull();
	});
});

describe("clearExpiredCache", () => {
	test("removes only expired entries", async () => {
		await setCached("a", { sources: [], xml: "", domainsQueried: [] }, -1);
		await setCached("b", { sources: [], xml: "", domainsQueried: [] }, 60_000);
		await setCached("c", { sources: [], xml: "", domainsQueried: [] }, -10);

		const removed = await clearExpiredCache();
		expect(removed).toBe(2);
		expect(cacheStore.has("b")).toBe(true);
	});

	test("returns 0 when no expired entries", async () => {
		await setCached(
			"fresh",
			{ sources: [], xml: "", domainsQueried: [] },
			60_000,
		);
		const removed = await clearExpiredCache();
		expect(removed).toBe(0);
	});
});

describe("usage tracking", () => {
	test("returns 0 for user with no usage today", async () => {
		expect(await getTodayUsageCount("user-1")).toBe(0);
	});

	test("increments and reads back", async () => {
		const c1 = await incrementTodayUsage("user-2");
		const c2 = await incrementTodayUsage("user-2");
		const c3 = await incrementTodayUsage("user-2");
		expect(c1).toBe(1);
		expect(c2).toBe(2);
		expect(c3).toBe(3);
		expect(await getTodayUsageCount("user-2")).toBe(3);
	});

	test("isolated by user", async () => {
		await incrementTodayUsage("user-a");
		await incrementTodayUsage("user-a");
		await incrementTodayUsage("user-b");
		expect(await getTodayUsageCount("user-a")).toBe(2);
		expect(await getTodayUsageCount("user-b")).toBe(1);
	});
});
