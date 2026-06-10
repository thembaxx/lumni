import { vi } from "vitest";

export const { mockCreateDocument, mockGetDocument } = vi.hoisted(() => ({
	mockCreateDocument: vi.fn(() => Promise.resolve()),
	mockGetDocument: vi.fn(() => Promise.resolve(null)),
}));

vi.mock("@/lib/shared/json", () => ({
	safeJsonParse: (str: string, fallback: unknown) => {
		try {
			return JSON.parse(str);
		} catch {
			return fallback;
		}
	},
	safeJsonStringify: (value: unknown) => JSON.stringify(value),
}));

vi.mock("@/lib/appwrite", () => ({
	APPWRITE_ENDPOINT: "https://jnb.cloud.appwrite.io/v1",
	APPWRITE_PROJECT: "test-project",
	browserDatabases: {},
	storage: {},
	functions: {},
	account: {},
}));

vi.mock("@/lib/appwrite.server", () => ({
	APPWRITE_ENDPOINT: "https://jnb.cloud.appwrite.io/v1",
	APPWRITE_PROJECT: "test-project",
	APPWRITE_API_KEY: "test-key",
	databases: {
		createDocument: mockCreateDocument,
		getDocument: mockGetDocument,
	},
	serverAccount: {},
	serverClient: {},
}));

vi.mock("@/lib/db/client", () => {
	const _mockFn = vi.fn();
	return {
		APPWRITE_DATABASE_ID: "test-db-id",
		COLLECTIONS: {
			VISUALS: "visuals",
			SUBJECTS: "subjects",
			QUESTIONS: "questions",
			USER_PROGRESS: "user_progress",
			STUDY_SESSIONS: "study_sessions",
			EXAM_PAPERS: "exam_papers",
			COMPETENCIES: "competencies",
			FLASHCARDS: "flashcards",
			WRONG_ANSWERS: "wrong_answers",
			BOOKMARKS: "bookmarks",
			CHAT_MESSAGES: "chat_messages",
			STUDY_PLANS: "study_plans",
			EXAM_DATES: "exam_dates",
			USER_CONSENTS: "user_consents",
			SHARED_QUESTIONS: "shared_questions",
		},
		createDocument: vi.fn(async () => {}),
		listDocuments: vi.fn(async () => []),
		getDocument: vi.fn(async () => null),
		updateDocument: vi.fn(async () => {}),
		deleteDocument: vi.fn(async () => {}),
	};
});
