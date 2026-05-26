import { beforeEach, describe, expect, mock, test } from "bun:test";

const enqueueMock = mock(async () => 1);

const progressStore: {
	id: number;
	odSubjectId: string;
	questionsAttempted: number;
	correctCount: number;
	currentStreak: number;
	longestStreak: number;
}[] = [];

const attemptsStore: {
	id: number;
	odSubject: string;
	userId?: string;
	score: number;
	totalQuestions: number;
	duration: number;
	completedAt: number;
}[] = [];

const mockProgressTable = {
	toArray: async () => [...progressStore],
	delete: async (id: number) => {
		const idx = progressStore.findIndex((p) => p.id === id);
		if (idx >= 0) progressStore.splice(idx, 1);
	},
};

const mockAttemptsTable = {
	toArray: async () => [...attemptsStore],
	update: async (id: number, data: Partial<(typeof attemptsStore)[number]>) => {
		const idx = attemptsStore.findIndex((a) => a.id === id);
		if (idx >= 0) Object.assign(attemptsStore[idx], data);
		return 1;
	},
};

mock.module("@/lib/db/schema", () => ({
	offlineDB: {
		progress: mockProgressTable,
		quizAttempts: mockAttemptsTable,
		competencies: { toArray: async () => [] },
		flashcards: { toArray: async () => [] },
		wrongAnswers: { toArray: async () => [] },
		chatMessages: { toArray: async () => [] },
		questionRatings: { toArray: async () => [] },
		bookmarks: { toArray: async () => [] },
	},
}));

mock.module("@/lib/orchestrator/job-queue", () => ({
	enqueue: enqueueMock,
}));

const { flushOfflineData } = await import("../sync-handler");

describe("flushOfflineData", () => {
	beforeEach(() => {
		progressStore.length = 0;
		attemptsStore.length = 0;
		enqueueMock.mockReset();
	});

	test("completes without error when no data exists", async () => {
		await expect(flushOfflineData("user-1")).resolves.toBeUndefined();
		expect(enqueueMock).not.toHaveBeenCalled();
	});

	test("enqueues progress sync for items with activity", async () => {
		progressStore.push({
			id: 1,
			odSubjectId: "mathematics",
			questionsAttempted: 5,
			correctCount: 3,
			currentStreak: 2,
			longestStreak: 4,
		});
		await flushOfflineData("user-1");
		expect(enqueueMock).toHaveBeenCalledWith("appwrite-progress-sync", {
			userId: "user-1",
			odSubjectId: "mathematics",
			questionsAttempted: 5,
			correctCount: 3,
			currentStreak: 2,
			longestStreak: 4,
		});
	});

	test("does not delete progress after enqueuing", async () => {
		progressStore.push({
			id: 1,
			odSubjectId: "physics",
			questionsAttempted: 3,
			correctCount: 2,
			currentStreak: 1,
			longestStreak: 1,
		});
		await flushOfflineData("user-1");
		expect(progressStore).toHaveLength(1);
	});

	test("skips progress items with zero questionsAttempted and correctCount", async () => {
		progressStore.push({
			id: 1,
			odSubjectId: "chemistry",
			questionsAttempted: 0,
			correctCount: 0,
			currentStreak: 0,
			longestStreak: 0,
		});
		await flushOfflineData("user-1");
		expect(enqueueMock).not.toHaveBeenCalled();
	});

	test("enqueues attempt sync for items without userId", async () => {
		attemptsStore.push({
			id: 1,
			odSubject: "physical-sciences",
			score: 80,
			totalQuestions: 10,
			duration: 300,
			completedAt: 1000,
		});
		await flushOfflineData("user-42");
		expect(enqueueMock).toHaveBeenCalledWith("appwrite-attempt-sync", {
			userId: "user-42",
			subjectId: "physical-sciences",
			score: 80,
			totalQuestions: 10,
			duration: 300,
			completedAt: 1000,
		});
	});

	test("updates attempt with userId after enqueuing", async () => {
		attemptsStore.push({
			id: 1,
			odSubject: "life-sciences",
			score: 60,
			totalQuestions: 10,
			duration: 200,
			completedAt: 2000,
		});
		expect(attemptsStore[0].userId).toBeUndefined();
		await flushOfflineData("user-99");
		expect(attemptsStore[0].userId).toBe("user-99");
	});

	test("skips attempt sync when userId already set", async () => {
		attemptsStore.push({
			id: 1,
			odSubject: "geography",
			userId: "existing-user",
			score: 90,
			totalQuestions: 10,
			duration: 150,
			completedAt: 3000,
		});
		await flushOfflineData("user-new");
		expect(enqueueMock).not.toHaveBeenCalled();
	});

	test("processes both progress and attempts in one call", async () => {
		progressStore.push({
			id: 1,
			odSubjectId: "maths",
			questionsAttempted: 10,
			correctCount: 7,
			currentStreak: 5,
			longestStreak: 8,
		});
		attemptsStore.push({
			id: 1,
			odSubject: "english",
			score: 75,
			totalQuestions: 10,
			duration: 400,
			completedAt: 5000,
		});
		await flushOfflineData("multi-user");
		expect(enqueueMock).toHaveBeenCalledTimes(2);
		expect(enqueueMock).toHaveBeenCalledWith(
			"appwrite-progress-sync",
			expect.any(Object),
		);
		expect(enqueueMock).toHaveBeenCalledWith(
			"appwrite-attempt-sync",
			expect.any(Object),
		);
	});
});
