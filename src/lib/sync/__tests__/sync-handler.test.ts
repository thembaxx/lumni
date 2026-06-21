import { beforeEach, describe, expect, test, vi } from "vitest";

const enqueueMock = vi.fn(async () => 1);
const logErrorMock = vi.fn();

vi.mock("@/lib/shared/logger", () => ({
	logError: logErrorMock,
}));

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

const competenciesStore: {
	subjectId: string;
	topicId: string;
	bloomLevel: string;
	score: number;
	attempts: number;
	level: string;
	lastAssessed: number;
}[] = [];

const flashcardsStore: {
	id: string;
	front: string;
	back: string;
	subject: string;
	topic: string;
	easeFactor: number;
	interval: number;
	repetitions: number;
	nextReview: number;
	lastReview: number | null;
	createdAt: number;
	updatedAt: number;
}[] = [];

const wrongAnswersStore: {
	questionId: string;
	questionText: string;
	subject: string;
	topic: string;
	correctAnswer: string;
	userAnswer: string;
	explanation: string;
	createdAt: number;
	reviewed: boolean;
	errorType: string;
}[] = [];

const chatMessagesStore: {
	messageId: string;
	role: string;
	content: string;
	type: string;
	timestamp: number;
}[] = [];

const questionRatingsStore: {
	questionId: string;
	subject: string;
	rating: number;
	feedback: string;
	createdAt: number;
}[] = [];

const bookmarksStore: {
	questionId: string;
	questionText: string;
	subject: string;
	topic: string;
	note: string;
	savedAt: number;
}[] = [];

const {
	mockProgressTable,
	mockAttemptsTable,
	mockCompetenciesTable,
	mockFlashcardsTable,
	mockWrongAnswersTable,
	mockChatMessagesTable,
	mockRatingsTable,
	mockBookmarksTable,
} = vi.hoisted(() => ({
	mockProgressTable: {
		toArray: async () => [] as typeof progressStore,
	},
	mockAttemptsTable: {
		toArray: async () => [] as typeof attemptsStore,
		update: async () => 1,
	},
	mockCompetenciesTable: {
		toArray: async () => [] as typeof competenciesStore,
	},
	mockFlashcardsTable: {
		toArray: async () => [] as typeof flashcardsStore,
	},
	mockWrongAnswersTable: {
		toArray: async () => [] as typeof wrongAnswersStore,
	},
	mockChatMessagesTable: {
		toArray: async () => [] as typeof chatMessagesStore,
	},
	mockRatingsTable: {
		toArray: async () => [] as typeof questionRatingsStore,
	},
	mockBookmarksTable: {
		toArray: async () => [] as typeof bookmarksStore,
	},
}));

vi.mock("@/lib/db", () => ({
	dexieDataAccess: {
		progress: mockProgressTable,
		quizAttempts: mockAttemptsTable,
		competencies: mockCompetenciesTable,
		flashcards: mockFlashcardsTable,
		wrongAnswers: mockWrongAnswersTable,
		chatMessages: mockChatMessagesTable,
		questionRatings: mockRatingsTable,
		bookmarks: mockBookmarksTable,
	},
}));

vi.mock("@/lib/orchestrator/job-queue", () => ({
	enqueue: enqueueMock,
}));

const { flushOfflineData } = await import("../sync-handler");

describe("flushOfflineData", () => {
	beforeEach(() => {
		progressStore.length = 0;
		attemptsStore.length = 0;
		competenciesStore.length = 0;
		flashcardsStore.length = 0;
		wrongAnswersStore.length = 0;
		chatMessagesStore.length = 0;
		questionRatingsStore.length = 0;
		bookmarksStore.length = 0;
		enqueueMock.mockClear();
		logErrorMock.mockClear();
		mockProgressTable.toArray = async () => [...progressStore];
		mockAttemptsTable.toArray = async () => [...attemptsStore];
		mockAttemptsTable.update = async (
			id: number,
			data: Partial<(typeof attemptsStore)[number]>,
		) => {
			const idx = attemptsStore.findIndex((a) => a.id === id);
			if (idx >= 0) Object.assign(attemptsStore[idx], data);
			return 1;
		};
		mockCompetenciesTable.toArray = async () => [...competenciesStore];
		mockFlashcardsTable.toArray = async () => [...flashcardsStore];
		mockWrongAnswersTable.toArray = async () => [...wrongAnswersStore];
		mockChatMessagesTable.toArray = async () => [...chatMessagesStore];
		mockRatingsTable.toArray = async () => [...questionRatingsStore];
		mockBookmarksTable.toArray = async () => [...bookmarksStore];
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

	// --- competencies ---

	test("enqueues competency sync with correct payload", async () => {
		competenciesStore.push({
			subjectId: "mathematics",
			topicId: "algebra",
			bloomLevel: "apply",
			score: 75,
			attempts: 10,
			level: "developing",
			lastAssessed: 1000,
		});
		await flushOfflineData("user-1");
		expect(enqueueMock).toHaveBeenCalledWith("appwrite-competency-sync", {
			userId: "user-1",
			subjectId: "mathematics",
			topicId: "algebra",
			bloomLevel: "apply",
			proficiency: 75,
			attempts: 10,
			level: "developing",
			lastAssessed: 1000,
		});
	});

	test("maps score field to proficiency in competency payload", async () => {
		competenciesStore.push({
			subjectId: "physics",
			topicId: "mechanics",
			bloomLevel: "understand",
			score: 42,
			attempts: 5,
			level: "novice",
			lastAssessed: 500,
		});
		await flushOfflineData("user-1");
		const call = enqueueMock.mock.calls.find(
			(c: unknown[]) => c[0] === "appwrite-competency-sync",
		);
		expect(call).toBeDefined();
		expect(call[1].proficiency).toBe(42);
		expect(call[1]).not.toHaveProperty("score");
	});

	test("handles empty competencies array", async () => {
		await flushOfflineData("user-1");
		const competencyCalls = enqueueMock.mock.calls.filter(
			(c: unknown[]) => c[0] === "appwrite-competency-sync",
		);
		expect(competencyCalls).toHaveLength(0);
	});

	// --- flashcards ---

	test("enqueues flashcard sync with correct payload", async () => {
		flashcardsStore.push({
			id: "fc-1",
			front: "What is 2+2?",
			back: "4",
			subject: "mathematics",
			topic: "arithmetic",
			easeFactor: 2.5,
			interval: 1,
			repetitions: 0,
			nextReview: 1000,
			lastReview: null,
			createdAt: 500,
			updatedAt: 500,
		});
		await flushOfflineData("user-1");
		expect(enqueueMock).toHaveBeenCalledWith("appwrite-flashcard-sync", {
			userId: "user-1",
			id: "fc-1",
			front: "What is 2+2?",
			back: "4",
			subject: "mathematics",
			topic: "arithmetic",
			easeFactor: 2.5,
			interval: 1,
			repetitions: 0,
			nextReview: 1000,
			lastReview: null,
			createdAt: 500,
			updatedAt: 500,
		});
	});

	test("handles empty flashcards array", async () => {
		await flushOfflineData("user-1");
		const flashcardCalls = enqueueMock.mock.calls.filter(
			(c: unknown[]) => c[0] === "appwrite-flashcard-sync",
		);
		expect(flashcardCalls).toHaveLength(0);
	});

	// --- wrongAnswers ---

	test("enqueues wrong answer sync with correct payload", async () => {
		wrongAnswersStore.push({
			questionId: "q-1",
			questionText: "What is photosynthesis?",
			subject: "life-sciences",
			topic: "plants",
			correctAnswer: "Process by which plants make food",
			userAnswer: "Eating sunlight",
			explanation: "Plants use sunlight to convert CO2 and water into glucose.",
			createdAt: 2000,
			reviewed: false,
			errorType: "conceptual",
		});
		await flushOfflineData("user-1");
		expect(enqueueMock).toHaveBeenCalledWith("appwrite-wrong-answer-sync", {
			userId: "user-1",
			questionId: "q-1",
			questionText: "What is photosynthesis?",
			subject: "life-sciences",
			topic: "plants",
			correctAnswer: "Process by which plants make food",
			userAnswer: "Eating sunlight",
			explanation: "Plants use sunlight to convert CO2 and water into glucose.",
			createdAt: 2000,
			reviewed: false,
			errorType: "conceptual",
		});
	});

	test("handles empty wrongAnswers array", async () => {
		await flushOfflineData("user-1");
		const wrongCalls = enqueueMock.mock.calls.filter(
			(c: unknown[]) => c[0] === "appwrite-wrong-answer-sync",
		);
		expect(wrongCalls).toHaveLength(0);
	});

	// --- chatMessages ---

	test("enqueues chat message sync with correct payload", async () => {
		chatMessagesStore.push({
			messageId: "msg-1",
			role: "assistant",
			content: "Here is your answer.",
			type: "text",
			timestamp: 3000,
		});
		await flushOfflineData("user-1");
		expect(enqueueMock).toHaveBeenCalledWith("appwrite-chat-sync", {
			userId: "user-1",
			messageId: "msg-1",
			role: "assistant",
			content: "Here is your answer.",
			type: "text",
			timestamp: 3000,
		});
	});

	test("handles empty chatMessages array", async () => {
		await flushOfflineData("user-1");
		const chatCalls = enqueueMock.mock.calls.filter(
			(c: unknown[]) => c[0] === "appwrite-chat-sync",
		);
		expect(chatCalls).toHaveLength(0);
	});

	// --- questionRatings ---

	test("enqueues question rating sync with correct payload", async () => {
		questionRatingsStore.push({
			questionId: "q-42",
			subject: "mathematics",
			rating: 5,
			feedback: "Great question",
			createdAt: 4000,
		});
		await flushOfflineData("user-1");
		expect(enqueueMock).toHaveBeenCalledWith("appwrite-rating-sync", {
			questionId: "q-42",
			subject: "mathematics",
			rating: 5,
			feedback: "Great question",
			createdAt: 4000,
		});
	});

	test("question rating payload does not include userId", async () => {
		questionRatingsStore.push({
			questionId: "q-99",
			subject: "physics",
			rating: 3,
			feedback: "",
			createdAt: 5000,
		});
		await flushOfflineData("user-1");
		const ratingCall = enqueueMock.mock.calls.find(
			(c: unknown[]) => c[0] === "appwrite-rating-sync",
		);
		expect(ratingCall).toBeDefined();
		expect(ratingCall[1]).not.toHaveProperty("userId");
	});

	// --- bookmarks ---

	test("enqueues bookmark sync with correct payload", async () => {
		bookmarksStore.push({
			questionId: "q-7",
			questionText: "Define velocity.",
			subject: "physical-sciences",
			topic: "mechanics",
			note: "Important for exam",
			savedAt: 6000,
		});
		await flushOfflineData("user-1");
		expect(enqueueMock).toHaveBeenCalledWith("appwrite-bookmark-sync", {
			userId: "user-1",
			questionId: "q-7",
			questionText: "Define velocity.",
			subject: "physical-sciences",
			topic: "mechanics",
			note: "Important for exam",
			savedAt: 6000,
		});
	});

	test("handles empty bookmarks array", async () => {
		await flushOfflineData("user-1");
		const bookmarkCalls = enqueueMock.mock.calls.filter(
			(c: unknown[]) => c[0] === "appwrite-bookmark-sync",
		);
		expect(bookmarkCalls).toHaveLength(0);
	});

	// --- Error handling ---

	test("table.toArray() rejection: logs error, other tables still process", async () => {
		mockCompetenciesTable.toArray = async () => {
			throw new Error("dexie read failure");
		};

		bookmarksStore.push({
			questionId: "q-1",
			questionText: "Test",
			subject: "math",
			topic: "alg",
			note: "",
			savedAt: 1,
		});

		await flushOfflineData("user-1");

		expect(logErrorMock).toHaveBeenCalledWith(
			"SyncHandler.competencies",
			expect.any(Error),
		);
		expect(enqueueMock).toHaveBeenCalledWith(
			"appwrite-bookmark-sync",
			expect.any(Object),
		);
	});

	test("enqueue() rejection: fire-and-forget, no propagation", async () => {
		enqueueMock.mockRejectedValueOnce(new Error("network"));
		progressStore.push({
			id: 1,
			odSubjectId: "math",
			questionsAttempted: 1,
			correctCount: 1,
			currentStreak: 0,
			longestStreak: 0,
		});

		await expect(flushOfflineData("user-1")).resolves.toBeUndefined();
		expect(enqueueMock).toHaveBeenCalled();
		expect(logErrorMock).toHaveBeenCalledWith(
			"SyncHandler.progress",
			expect.any(Error),
		);
	});

	test("unknown table name: processTable falls through switch, no-op", async () => {
		await flushOfflineData("user-1");
		expect(enqueueMock).not.toHaveBeenCalled();
		expect(logErrorMock).not.toHaveBeenCalled();
	});
});
