import { describe, expect, test } from "bun:test";
import { calculateBackoffDelay } from "@/lib/shared/backoff";
import { QueueCore } from "../core";

interface TestItem {
	id?: number;
	type: string;
	payload: string;
	status: "pending" | "processing" | "completed" | "failed" | "cancelled";
	priority: number;
	attempts: number;
	maxRetries: number;
	scheduledAt: number;
	createdAt: number;
	startedAt?: number;
	completedAt?: number;
	lastError?: string;
}

function createTestStore() {
	const items: TestItem[] = [];
	return {
		add: async (item: TestItem) => {
			const id = items.length + 1;
			items.push({ ...item, id });
			return id;
		},
		get: async (id: number) => items.find((i) => i.id === id) ?? undefined,
		update: async (id: number, changes: Partial<TestItem>) => {
			const idx = items.findIndex((i) => i.id === id);
			if (idx !== -1) Object.assign(items[idx], changes);
			return 1;
		},
		where: (_index: string) => ({
			equals: (_value: string) => ({
				count: async () => items.filter((i) => i.status === _value).length,
				toArray: async () => items.filter((i) => i.status === _value),
			}),
		}),
		toArray: async () => [...items],
	};
}

describe("calculateBackoffDelay", () => {
	test("returns a non-negative number", () => {
		const delay = calculateBackoffDelay(0);
		expect(delay).toBeGreaterThanOrEqual(1000);
	});

	test("increases with attempts", () => {
		const d1 = calculateBackoffDelay(0);
		const d2 = calculateBackoffDelay(1);
		expect(d2).toBeGreaterThan(d1);
	});

	test("caps at maximum delay", () => {
		const delay = calculateBackoffDelay(10);
		expect(delay).toBeLessThanOrEqual(61000);
	});
});

describe("QueueCore", () => {
	test("enqueue adds item and returns id", async () => {
		const store = createTestStore();
		const queue = new QueueCore<TestItem>(store as never);
		const id = await queue.enqueue({
			type: "test",
			payload: "{}",
			status: "pending",
			priority: 50,
			attempts: 0,
			maxRetries: 3,
			scheduledAt: Date.now(),
			createdAt: Date.now(),
		});
		expect(id).toBeGreaterThan(0);
	});

	test("next returns highest priority pending item", async () => {
		const store = createTestStore();
		const queue = new QueueCore<TestItem>(store as never);
		await queue.enqueue({
			type: "low",
			payload: "{}",
			status: "pending",
			priority: 10,
			attempts: 0,
			maxRetries: 3,
			scheduledAt: Date.now(),
			createdAt: Date.now(),
		});
		await queue.enqueue({
			type: "high",
			payload: "{}",
			status: "pending",
			priority: 90,
			attempts: 0,
			maxRetries: 3,
			scheduledAt: Date.now(),
			createdAt: Date.now(),
		});
		const item = await queue.next();
		expect(item?.type).toBe("high");
	});

	test("next skips future-scheduled items", async () => {
		const store = createTestStore();
		const queue = new QueueCore<TestItem>(store as never);
		await queue.enqueue({
			type: "future",
			payload: "{}",
			status: "pending",
			priority: 50,
			attempts: 0,
			maxRetries: 3,
			scheduledAt: Date.now() + 100000,
			createdAt: Date.now(),
		});
		const item = await queue.next();
		expect(item).toBeNull();
	});

	test("markProcessing updates status", async () => {
		const store = createTestStore();
		const queue = new QueueCore<TestItem>(store as never);
		const id = await queue.enqueue({
			type: "test",
			payload: "{}",
			status: "pending",
			priority: 50,
			attempts: 0,
			maxRetries: 3,
			scheduledAt: Date.now(),
			createdAt: Date.now(),
		});
		await queue.markProcessing(id);
		const item = await queue.next();
		expect(item).toBeNull();
	});

	test("markForRetry keeps item pending with incremented attempts", async () => {
		const queue = new QueueCore<TestItem>(createTestStore() as never);
		const id = await queue.enqueue({
			type: "test",
			payload: "{}",
			status: "pending",
			priority: 50,
			attempts: 0,
			maxRetries: 3,
			scheduledAt: 0,
			createdAt: Date.now(),
		});
		expect(await queue.getPendingCount()).toBe(1);
		await queue.markForRetry(id, "error");
		expect(await queue.getPendingCount()).toBe(1);
	});

	test("processBatch processes items", async () => {
		const store = createTestStore();
		const queue = new QueueCore<TestItem>(store as never);
		await queue.enqueue({
			type: "test",
			payload: "{}",
			status: "pending",
			priority: 50,
			attempts: 0,
			maxRetries: 3,
			scheduledAt: Date.now(),
			createdAt: Date.now(),
		});
		const processed: string[] = [];
		const result = await queue.processBatch(async (item) => {
			processed.push(item.type);
		});
		expect(result.processed).toBe(1);
		expect(result.succeeded).toBe(1);
		expect(processed).toEqual(["test"]);
	});

	test("processBatch handles handler failure with retry", async () => {
		const store = createTestStore();
		const queue = new QueueCore<TestItem>(store as never);
		const id = await queue.enqueue({
			type: "fail",
			payload: "{}",
			status: "pending",
			priority: 50,
			attempts: 0,
			maxRetries: 3,
			scheduledAt: Date.now(),
			createdAt: Date.now(),
		});
		const result = await queue.processBatch(async () => {
			throw new Error("fail");
		});
		expect(result.processed).toBe(1);
		expect(result.succeeded).toBe(0);
		expect(result.failed).toBe(0);
		const item = await store.get(id);
		expect(item?.status).toBe("pending");
		expect(item?.attempts).toBe(1);
	});

	test("processBatch marks as failed when maxRetries exceeded", async () => {
		const store = createTestStore();
		const queue = new QueueCore<TestItem>(store as never);
		const id = await queue.enqueue({
			type: "fail",
			payload: "{}",
			status: "pending",
			priority: 50,
			attempts: 2,
			maxRetries: 3,
			scheduledAt: Date.now(),
			createdAt: Date.now(),
		});
		const result = await queue.processBatch(async () => {
			throw new Error("fail");
		});
		expect(result.processed).toBe(1);
		expect(result.failed).toBe(1);
		const item = await store.get(id);
		expect(item?.status).toBe("failed");
	});

	test("concurrency guard prevents concurrent processing", async () => {
		const queue = new QueueCore<TestItem>(createTestStore() as never);
		const guard = { isProcessing: true };
		const result = await queue.processBatch(async () => {}, 5, guard);
		expect(result.processed).toBe(0);
	});

	test("getPendingCount returns correct count", async () => {
		const store = createTestStore();
		const queue = new QueueCore<TestItem>(store as never);
		await queue.enqueue({
			type: "a",
			payload: "{}",
			status: "pending",
			priority: 50,
			attempts: 0,
			maxRetries: 3,
			scheduledAt: Date.now(),
			createdAt: Date.now(),
		});
		await queue.enqueue({
			type: "b",
			payload: "{}",
			status: "pending",
			priority: 50,
			attempts: 0,
			maxRetries: 3,
			scheduledAt: Date.now(),
			createdAt: Date.now(),
		});
		expect(await queue.getPendingCount()).toBe(2);
	});
});
