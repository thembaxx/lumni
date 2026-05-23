import { describe, expect, mock, test } from "bun:test";

const mockCreateDocument = mock(() => "doc-id");
const mockListDocuments = mock(() => []);
const mockUpdateDocument = mock(() => {});

mock.module("@/lib/appwrite", () => ({
	databases: {
		createDocument: mockCreateDocument,
	},
}));

mock.module("@/lib/db/client", () => ({
	APPWRITE_DATABASE_ID: "test-db",
	COLLECTIONS: {
		QUESTIONS: "questions",
		USER_PROGRESS: "user_progress",
		COMPETENCIES: "competencies",
		STUDY_SESSIONS: "study_sessions",
		FLASHCARDS: "flashcards",
		WRONG_ANSWERS: "wrong_answers",
		CHAT_MESSAGES: "chat_messages",
		STUDY_PLANS: "study_plans",
		QUESTION_FLAGS: "question_flags",
	},
	createDocument: mockCreateDocument,
	listDocuments: mockListDocuments,
	updateDocument: mockUpdateDocument,
}));

mock.module("@/lib/db/persist", () => ({
	safePersist: async (label: string, fn: () => Promise<void>) => fn(),
}));

mock.module("@/lib/curriculum", () => ({
	curriculumRegistry: {
		getSubject: async () => null,
	},
}));

mock.module("@/lib/competency-engine", () => ({
	competencyService: { update: async () => {} },
	computeBloomWeight: () => 1.0,
}));

mock.module("@/lib/db/repositories/progress", () => ({
	getProgress: async () => undefined,
	saveProgress: async () => 1,
}));

mock.module("@/lib/visual-engine/visual-engine", () => ({
	visualEngine: { resolve: async () => null },
}));

mock.module("@/lib/flashcard-repository", () => ({
	flashcardRepository: {
		getAll: async () => [],
		create: async () => ({ id: "new" }),
		update: async () => {},
	},
}));

mock.module("@/lib/orchestrator/job-queue", () => ({
	enqueue: async () => 1,
	queueCore: { enqueue: async (item: { type: string }) => 1 },
}));

mock.module("@/lib/shared/question-utils", () => ({
	extractCorrectAnswer: () => "42",
}));

mock.module("@/lib/question-engine/persistence", () => ({
	syncQuestionsToAppwrite: async () => {},
}));

mock.module("@/lib/db/schema", () => ({
	offlineDB: {
		jobs: {
			add: async () => 1,
			get: async () => null,
			update: async () => 1,
			where: () => ({
				equals: () => ({
					count: async () => 0,
					toArray: async () => [],
				}),
			}),
			toArray: async () => [],
		},
	},
}));

const { analyticsSync, visualGeneration, competencyUpdate } = await import(
	"../domain"
);
const { getHandler } = await import("../index");

describe("analyticsSync", () => {
	test("processes empty events", async () => {
		await analyticsSync({ events: [] });
		expect(mockCreateDocument).not.toHaveBeenCalled();
	});
});

describe("visualGeneration", () => {
	test("accepts minimal payload", async () => {
		await visualGeneration({
			questionId: "q1",
			questionText: "test",
			subject: "mathematics",
		});
	});
});

describe("competencyUpdate", () => {
	test("accepts valid payload", async () => {
		await competencyUpdate({
			subject: "mathematics",
			topic: "algebra",
			bloomLevel: "apply",
			score: 80,
		});
	});
});

describe("handler registry", () => {
	test("getHandler returns a function for every job type", () => {
		const types = [
			"appwrite-sync",
			"analytics-sync",
			"spaced-rep-update",
			"progress-update",
			"competency-update",
			"visual-generation",
			"appwrite-progress-sync",
			"appwrite-attempt-sync",
			"appwrite-competency-sync",
			"appwrite-flashcard-sync",
			"appwrite-wrong-answer-sync",
			"appwrite-chat-sync",
			"appwrite-rating-sync",
			"appwrite-study-plan-sync",
			"appwrite-question-flag",
			"question-regen",
		] as const;

		for (const type of types) {
			const handler = getHandler(type);
			expect(handler).toBeInstanceOf(Function);
		}
	});

	test("getHandler throws for unknown type", () => {
		expect(() => getHandler("unknown" as never)).toThrow(
			"No handler registered",
		);
	});
});
