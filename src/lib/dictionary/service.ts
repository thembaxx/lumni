"use client";

import { dexieDataAccess } from "@/lib/db";
import type { DictionaryDataAccess } from "@/lib/db/data-access";
import { logError } from "@/lib/shared/logger";
import type { DictionaryCacheEntry, DictionaryEntry } from "./types";

const _deps: { db: DictionaryDataAccess } = { db: dexieDataAccess };

const PRIMARY_API = "https://api.dictionaryapi.dev/api/v2/entries";
const FALLBACK_API = "https://api.freeDictionaryAPI.com/v2/entries";
const CACHE_TTL = 24 * 60 * 60 * 1000;

const WIKTIONARY_SUBDOMAINS: Record<string, string> = {
	en: "en",
	af: "af",
	zu: "zu",
	xh: "xh",
	st: "st",
	tn: "tn",
	nso: "nso",
	ts: "ts",
	ss: "ss",
	ve: "ve",
	nd: "nd",
};

function buildCacheKey(word: string, language: string): string {
	return `dict-${language}-${word.toLowerCase().trim()}`;
}

interface WiktionaryPage {
	pageid: number;
	title: string;
	extract?: string;
}

async function lookupWiktionary(
	word: string,
	language: string,
): Promise<DictionaryEntry[]> {
	const subdomain = WIKTIONARY_SUBDOMAINS[language];
	if (!subdomain) return [];

	try {
		const url = `https://${subdomain}.wiktionary.org/w/api.php?action=query&titles=${encodeURIComponent(word)}&prop=extracts&exintro&explaintext&format=json&origin=*`;
		const res = await fetch(url);
		if (!res.ok) return [];

		const data = (await res.json()) as {
			query?: { pages?: Record<string, WiktionaryPage> };
		};
		const pages = data.query?.pages;
		if (!pages) return [];

		const page = Object.values(pages).find(
			(p: WiktionaryPage) => p.pageid > 0 && p.extract,
		);
		if (!page?.extract) return [];

		return [
			{
				word: page.title,
				phonetic: undefined,
				origin: language === "af" ? "Afrikaans" : undefined,
				meanings: [
					{
						partOfSpeech: "unknown",
						definitions: [
							{
								definition: page.extract.split("\n")[0] ?? page.extract,
								synonyms: [],
								antonyms: [],
							},
						],
					},
				],
				sourceUrls: [
					`https://${subdomain}.wiktionary.org/wiki/${encodeURIComponent(word)}`,
				],
			},
		];
	} catch (err) {
		logError("DictionaryService.wiktionary", err);
		return [];
	}
}

export async function lookupWord(
	word: string,
	language = "en",
): Promise<DictionaryEntry[]> {
	const key = buildCacheKey(word, language);

	try {
		const cached = await _deps.db.dictionaryCache.get(key);
		if (cached && cached.expiresAt > Date.now()) {
			return cached.result;
		}
	} catch {
		// cache unavailable
	}

	let data: DictionaryEntry[] | null = null;

	// Try Free Dictionary API for English
	if (language === "en") {
		const urls = [
			`${PRIMARY_API}/${language}/${encodeURIComponent(word)}`,
			`${FALLBACK_API}/${language}/${encodeURIComponent(word)}`,
		];
		for (const url of urls) {
			try {
				const res = await fetch(url);
				if (res.ok) {
					data = (await res.json()) as DictionaryEntry[];
					break;
				}
			} catch {
				// try next
			}
		}
	}

	// Fallback to Wiktionary for all languages (including SA languages)
	if (!data) {
		data = await lookupWiktionary(word, language);
	}

	if (data) {
		const entry: DictionaryCacheEntry = {
			key,
			word: word.toLowerCase(),
			language,
			result: data,
			fetchedAt: Date.now(),
			expiresAt: Date.now() + CACHE_TTL,
		};
		try {
			await _deps.db.dictionaryCache.put(entry);
		} catch {
			// cache write fail silently
		}
		return data;
	}

	return [];
}
