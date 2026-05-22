import { describe, expect, test } from "bun:test";
import { LumniOfflineDB, offlineDB } from "../schema";

describe("LumniOfflineDB", () => {
	test("offlineDB singleton is defined", () => {
		expect(offlineDB).toBeDefined();
	});

	test("is instance of LumniOfflineDB", () => {
		expect(offlineDB).toBeInstanceOf(LumniOfflineDB);
	});

	test("database name is lumni-offline", () => {
		expect(offlineDB.name).toBe("lumni-offline");
	});

	test("version is 12", () => {
		expect(offlineDB.verno).toBe(12);
	});

	test("has all 17 expected tables", () => {
		expect(offlineDB.chatMessages).toBeDefined();
		expect(offlineDB.questions).toBeDefined();
		expect(offlineDB.progress).toBeDefined();
		expect(offlineDB.quizAttempts).toBeDefined();
		expect(offlineDB.syncQueue).toBeDefined();
		expect(offlineDB.subjects).toBeDefined();
		expect(offlineDB.quizSessions).toBeDefined();
		expect(offlineDB.conflicts).toBeDefined();
		expect(offlineDB.jobs).toBeDefined();
		expect(offlineDB.competencies).toBeDefined();
		expect(offlineDB.visuals).toBeDefined();
		expect(offlineDB.wrongAnswers).toBeDefined();
		expect(offlineDB.questionRatings).toBeDefined();
		expect(offlineDB.flashcards).toBeDefined();
		expect(offlineDB.examSessions).toBeDefined();
		expect(offlineDB.cachedPdfs).toBeDefined();
		expect(offlineDB.examDates).toBeDefined();
	});

	test("table names match expected values", () => {
		const tables = offlineDB.tables.map((t) => t.name);
		expect(tables).toContain("chatMessages");
		expect(tables).toContain("flashcards");
		expect(tables).toContain("competencies");
		expect(tables).toContain("questions");
		expect(tables).toContain("progress");
		expect(tables).toContain("quizAttempts");
		expect(tables).toContain("syncQueue");
		expect(tables).toContain("subjects");
		expect(tables).toContain("quizSessions");
		expect(tables).toContain("conflicts");
		expect(tables).toContain("jobs");
		expect(tables).toContain("visuals");
		expect(tables).toContain("wrongAnswers");
		expect(tables).toContain("questionRatings");
		expect(tables).toContain("examSessions");
		expect(tables).toContain("cachedPdfs");
		expect(tables).toContain("examDates");
		expect(tables).toHaveLength(17);
	});

	test("flashcards table has string primary key", () => {
		expect(offlineDB.flashcards.schema.primKey.keyPath).toBe("id");
	});

	test("questions table has auto-increment primary key", () => {
		expect(offlineDB.questions.schema.primKey.auto).toBe(true);
	});

	test("new instance has same version", () => {
		const db = new LumniOfflineDB();
		expect(db.verno).toBe(12);
		db.close();
	});
});
