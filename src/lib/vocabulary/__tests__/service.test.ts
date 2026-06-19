import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { InMemoryDataAccess } from "@/lib/db";
import {
	__setDepsForTesting,
	getSavedWords,
	isWordSaved,
	removeWord,
	saveWord,
} from "../service";

describe("vocabulary service", () => {
	const da = new InMemoryDataAccess();
	const userId = "user-1";

	beforeEach(() => {
		__setDepsForTesting({ db: da });
	});

	afterEach(() => {
		da.vocabularyList.clear();
	});

	describe("saveWord", () => {
		it("saves a new word", async () => {
			const result = await saveWord(
				userId,
				"hello",
				"greeting",
				"en",
				"manual",
				"dictionary",
				"interjection",
			);
			expect(result).not.toBeNull();
			expect(result?.word).toBe("hello");
			expect(result?.definition).toBe("greeting");
			expect(result?.language).toBe("en");
			expect(result?.reviewCount).toBe(0);
		});

		it("lowercases the word", async () => {
			const result = await saveWord(
				userId,
				"Hello",
				"greeting",
				"en",
				"manual",
				"dictionary",
			);
			expect(result?.word).toBe("hello");
		});

		it("increments reviewCount on duplicate", async () => {
			await saveWord(userId, "hello", "greeting", "en", "manual", "dictionary");
			const result = await saveWord(
				userId,
				"hello",
				"greeting",
				"en",
				"manual",
				"dictionary",
			);
			expect(result?.reviewCount).toBe(1);
		});
	});

	describe("getSavedWords", () => {
		it("returns all words for a user", async () => {
			await saveWord(userId, "hello", "greeting", "en", "manual", "dictionary");
			await saveWord(userId, "world", "earth", "en", "lesson", "lesson-1");
			const words = await getSavedWords(userId);
			expect(words).toHaveLength(2);
		});

		it("filters by language", async () => {
			await saveWord(userId, "hello", "greeting", "en", "manual", "dictionary");
			await saveWord(userId, "hola", "hello", "es", "manual", "dictionary");
			const enWords = await getSavedWords(userId, { language: "en" });
			expect(enWords).toHaveLength(1);
			expect(enWords[0].word).toBe("hello");
		});

		it("filters by sourceType", async () => {
			await saveWord(userId, "hello", "greeting", "en", "manual", "dictionary");
			await saveWord(userId, "world", "earth", "en", "lesson", "lesson-1");
			const manualWords = await getSavedWords(userId, {
				sourceType: "manual",
			});
			expect(manualWords).toHaveLength(1);
			expect(manualWords[0].word).toBe("hello");
		});
	});

	describe("removeWord", () => {
		it("removes an existing word", async () => {
			await saveWord(userId, "hello", "greeting", "en", "manual", "dictionary");
			const removed = await removeWord(userId, "hello");
			expect(removed).toBe(true);
			const words = await getSavedWords(userId);
			expect(words).toHaveLength(0);
		});

		it("returns false for non-existent word", async () => {
			const removed = await removeWord(userId, "nonexistent");
			expect(removed).toBe(false);
		});
	});

	describe("isWordSaved", () => {
		it("returns true for saved word", async () => {
			await saveWord(userId, "hello", "greeting", "en", "manual", "dictionary");
			const saved = await isWordSaved(userId, "hello");
			expect(saved).toBe(true);
		});

		it("returns false for unsaved word", async () => {
			const saved = await isWordSaved(userId, "nonexistent");
			expect(saved).toBe(false);
		});

		it("is case-insensitive", async () => {
			await saveWord(userId, "hello", "greeting", "en", "manual", "dictionary");
			const saved = await isWordSaved(userId, "Hello");
			expect(saved).toBe(true);
		});
	});
});
