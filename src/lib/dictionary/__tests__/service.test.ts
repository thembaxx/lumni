import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { DictionaryCacheEntry, DictionaryResult } from "../types";

const MOCK_RESULT: DictionaryResult = {
	word: "hello",
	phonetic: "/həˈloʊ/",
	audio: "https://example.com/hello.mp3",
	definitions: [
		{
			partOfSpeech: "interjection",
			definition: "An utterance of greeting",
			example: "Hello, how are you?",
		},
		{
			partOfSpeech: "noun",
			definition: "An utterance of greeting",
		},
	],
	synonyms: ["greeting", "salutation"],
	antonyms: ["goodbye", "farewell"],
};

const API_RESPONSE = [
	{
		word: "hello",
		phonetic: "/həˈloʊ/",
		phonetics: [{ text: "/həˈloʊ/", audio: "https://example.com/hello.mp3" }],
		meanings: [
			{
				partOfSpeech: "interjection",
				definitions: [
					{
						definition: "An utterance of greeting",
						example: "Hello, how are you?",
						synonyms: ["greeting"],
						antonyms: ["goodbye"],
					},
				],
				synonyms: ["salutation"],
				antonyms: ["farewell"],
			},
			{
				partOfSpeech: "noun",
				definitions: [{ definition: "An utterance of greeting" }],
			},
		],
	},
];

const { cache, mockDictionaryCache, fetchMock } = vi.hoisted(() => {
	const cache = new Map<string, DictionaryCacheEntry>();
	const fetchMock = vi.fn();
	const mockDictionaryCache = {
		get: vi.fn(async (key: string) => cache.get(key) ?? undefined),
		put: vi.fn(async (entry: DictionaryCacheEntry) => {
			cache.set(entry.key, entry);
		}),
	};
	return { cache, mockDictionaryCache, fetchMock };
});

vi.mock("@/lib/db", () => ({
	dexieDataAccess: { dictionaryCache: mockDictionaryCache },
}));

import { __setDepsForTesting, getCachedLookup, lookupWord } from "../service";

beforeEach(() => {
	cache.clear();
	__setDepsForTesting({
		db: { dictionaryCache: mockDictionaryCache } as Parameters<
			typeof __setDepsForTesting
		>[0]["db"],
	});
	vi.stubGlobal("fetch", fetchMock);
	vi.clearAllMocks();
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe("lookupWord", () => {
	test("returns cached result when available", async () => {
		cache.set("hello:en", {
			key: "hello:en",
			word: "hello",
			result: MOCK_RESULT,
			fetchedAt: Date.now(),
			expiresAt: Date.now() + 86_400_000,
		});

		const result = await lookupWord("hello");

		expect(result).toEqual(MOCK_RESULT);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	test("fetches from API on cache miss", async () => {
		fetchMock.mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(API_RESPONSE),
		});

		const result = await lookupWord("hello");

		expect(result).not.toBeNull();
		expect(result?.word).toBe("hello");
		expect(result?.definitions).toHaveLength(2);
		expect(fetchMock).toHaveBeenCalledWith(
			"https://api.dictionaryapi.dev/api/v2/entries/en/hello",
		);
	});

	test("caches result after API fetch", async () => {
		fetchMock.mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(API_RESPONSE),
		});

		await lookupWord("hello");

		expect(mockDictionaryCache.put).toHaveBeenCalledOnce();
		const putArg = mockDictionaryCache.put.mock.calls[0]?.[0] as
			| DictionaryCacheEntry
			| undefined;
		expect(putArg?.key).toBe("hello:en");
		expect(putArg?.word).toBe("hello");
		expect(putArg?.result.word).toBe("hello");
		expect(putArg?.expiresAt).toBeGreaterThan(Date.now());
	});

	test("returns null when API fails", async () => {
		fetchMock.mockResolvedValue({ ok: false, status: 500 });

		const result = await lookupWord("nonexistent");

		expect(result).toBeNull();
	});

	test("returns null when word not found (404)", async () => {
		fetchMock.mockResolvedValue({ ok: false, status: 404 });

		const result = await lookupWord("zzzznotaword");

		expect(result).toBeNull();
	});
});

describe("getCachedLookup", () => {
	test("returns null on cache miss", async () => {
		const result = await getCachedLookup("hello");

		expect(result).toBeNull();
	});
});
