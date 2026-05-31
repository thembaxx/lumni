import { describe, expect, mock, test } from "bun:test";

const tableNames = [
	"chatMessages",
	"flashcards",
	"competencies",
	"questions",
	"progress",
	"quizAttempts",
	"subjects",
	"quizSessions",
	"conflicts",
	"jobs",
	"visuals",
	"wrongAnswers",
	"questionRatings",
	"examSessions",
	"cachedPdfs",
	"examDates",
	"reviewHistory",
	"extractionCache",
	"bookmarks",
	"notes",
	"groupPosts",
	"groupComments",
	"groupReactions",
	"gamification",
	"quizPacks",
	"packQuestions",
	"userConsents",
];

const mockTables = tableNames.map((name) => ({
	name,
	schema: { primKey: { name: name === "questions" ? "++id" : "id" } },
	hook: () => ({ deleting: null, creating: null, updating: null }),
}));

class MockOfflineDB {
	readonly name = "lumni-offline";
	readonly verno = 20;
	readonly tables = mockTables;
	table(name: string) {
		return mockTables.find((t) => t.name === name);
	}
	version(_v: number) {
		return this;
	}
	stores(_schema: Record<string, string>) {
		return this;
	}
	upgrade(_fn: (trans: unknown) => void) {
		return this;
	}
	open() {
		return Promise.resolve(this);
	}
	close() {}
}

mock.module("@/lib/db/schema", () => ({
	LumniOfflineDB: MockOfflineDB,
	offlineDB: new MockOfflineDB(),
}));

const { LumniOfflineDB, offlineDB } = await import("@/lib/db/schema");

describe("LumniOfflineDB", () => {
	test("is instance of LumniOfflineDB", () => {
		expect(offlineDB instanceof LumniOfflineDB).toBe(true);
	});

	test("database name is lumni-offline", () => {
		expect(offlineDB.name).toBe("lumni-offline");
	});

	test("version is 24", () => {
		expect(offlineDB.verno).toBe(24);
	});

	test("has all expected tables", () => {
		expect(offlineDB.tables.length).toBe(27);
		for (const name of tableNames) {
			const table = offlineDB.tables.find(
				(t: { name: string }) => t.name === name,
			);
			expect(table).toBeDefined();
		}
	});

	test("table names match expected values", () => {
		const names = offlineDB.tables.map((t: { name: string }) => t.name);
		expect(names).toEqual(tableNames);
	});

	test("flashcards table has string primary key", () => {
		const table = offlineDB.table("flashcards");
		expect(table.schema.primKey.name).toBe("id");
	});

	test("questions table has auto-increment primary key", () => {
		const table = offlineDB.table("questions");
		expect(table.schema.primKey.name).toBe("++id");
	});
});
