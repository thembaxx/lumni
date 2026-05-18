import { describe, expect, test, mock, beforeEach } from "bun:test";
import type { CachedProgress } from "@/lib/db/schema";

const enqueueMock = mock(async () => 1);

const mockProgressStore = new Map<string, CachedProgress>();

mock.module("@/lib/db/repositories/progress", () => ({
	getProgress: async (subject: string) => mockProgressStore.get(subject) ?? undefined,
	saveProgress: async (subject: string, data: Partial<CachedProgress>) => {
		const existing = mockProgressStore.get(subject) ?? {
			odSubjectId: subject,
			questionsAttempted: 0,
			correctCount: 0,
			currentStreak: 0,
			longestStreak: 0,
			updatedAt: Date.now(),
		};
		mockProgressStore.set(subject, { ...existing, ...data });
		return 1;
	},
}));

mock.module("@/lib/orchestrator/job-queue", () => ({
	enqueue: enqueueMock,
}));

const { ProgressService } = await import("../progress-service");

describe("ProgressService.update", () => {
	const service = new ProgressService();

	beforeEach(() => {
		mockProgressStore.clear();
		enqueueMock.mockReset();
	});

	test("creates initial record with correct answer", async () => {
		await service.update("mathematics", { correct: true, score: 80 });
		const record = mockProgressStore.get("mathematics");
		expect(record?.questionsAttempted).toBe(1);
		expect(record?.correctCount).toBe(1);
		expect(record?.currentStreak).toBe(1);
		expect(record?.longestStreak).toBe(1);
	});

	test("creates initial record with wrong answer", async () => {
		await service.update("mathematics", { correct: false, score: 30 });
		const record = mockProgressStore.get("mathematics");
		expect(record?.questionsAttempted).toBe(1);
		expect(record?.correctCount).toBe(0);
		expect(record?.currentStreak).toBe(0);
		expect(record?.longestStreak).toBe(0);
	});

	test("increments streak on consecutive correct answers", async () => {
		await service.update("math", { correct: true, score: 80 });
		await service.update("math", { correct: true, score: 90 });
		await service.update("math", { correct: true, score: 100 });
		const record = mockProgressStore.get("math");
		expect(record?.questionsAttempted).toBe(3);
		expect(record?.correctCount).toBe(3);
		expect(record?.currentStreak).toBe(3);
		expect(record?.longestStreak).toBe(3);
	});

	test("resets streak to 0 on wrong answer after correct streak", async () => {
		await service.update("math", { correct: true, score: 80 });
		await service.update("math", { correct: true, score: 90 });
		await service.update("math", { correct: false, score: 30 });
		const record = mockProgressStore.get("math");
		expect(record?.currentStreak).toBe(0);
		expect(record?.longestStreak).toBe(2);
	});

	test("enqueues appwrite-progress-sync on update", async () => {
		await service.update("math", { correct: true, score: 90 });
		expect(enqueueMock).toHaveBeenCalledTimes(1);
		expect(enqueueMock).toHaveBeenCalledWith(
			"appwrite-progress-sync",
			expect.objectContaining({ odSubjectId: "math" }),
		);
	});
});
