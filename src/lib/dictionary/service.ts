"use client";

import { dexieDataAccess } from "@/lib/db";
import type { DataAccess } from "@/lib/db/data-access";
import { logError } from "@/lib/shared/logger";
import type { DictionaryCacheEntry, DictionaryResult } from "./types";

// Dexie v33: dictionaryCache table (key, word, result, fetchedAt, expiresAt)

const API_BASE = "https://api.dictionaryapi.dev/api/v2/entries";
const CACHE_TTL = 24 * 60 * 60 * 1000;

interface ApiPhonetic {
	text?: string;
	audio?: string;
}

interface ApiDefinition {
	definition: string;
	example?: string;
	synonyms?: string[];
	antonyms?: string[];
}

interface ApiMeaning {
	partOfSpeech: string;
	definitions: ApiDefinition[];
	synonyms?: string[];
	antonyms?: string[];
}

interface ApiEntry {
	word: string;
	phonetic?: string;
	phonetics?: ApiPhonetic[];
	meanings?: ApiMeaning[];
}

function buildCacheKey(word: string, language: string): string {
	return `${word.toLowerCase().trim()}:${language}`;
}

function parseApiResponse(data: ApiEntry[]): DictionaryResult | null {
	if (!data.length) return null;
	const entry = data[0];
	if (!entry) return null;

	const definitions: DictionaryResult["definitions"] = [];
	const synonyms: string[] = [];
	const antonyms: string[] = [];

	for (const meaning of entry.meanings ?? []) {
		if (meaning.synonyms) synonyms.push(...meaning.synonyms);
		if (meaning.antonyms) antonyms.push(...meaning.antonyms);

		for (const def of meaning.definitions) {
			definitions.push({
				partOfSpeech: meaning.partOfSpeech,
				definition: def.definition,
				example: def.example,
			});
			if (def.synonyms) synonyms.push(...def.synonyms);
			if (def.antonyms) antonyms.push(...def.antonyms);
		}
	}

	return {
		word: entry.word,
		phonetic: entry.phonetic ?? "",
		audio: entry.phonetics?.[0]?.audio ?? "",
		definitions,
		synonyms: [...new Set(synonyms)],
		antonyms: [...new Set(antonyms)],
	};
}

let _deps: { db: DataAccess } = { db: dexieDataAccess };
export function __setDepsForTesting(deps: { db: DataAccess }) {
	_deps = deps;
}

export async function lookupWord(
	word: string,
	language = "en",
): Promise<DictionaryResult | null> {
	const key = buildCacheKey(word, language);

	try {
		const cached = await _deps.db.dictionaryCache.get(key);
		if (cached && cached.expiresAt > Date.now()) {
			return cached.result;
		}
	} catch {
		// cache unavailable
	}

	try {
		const url = `${API_BASE}/${encodeURIComponent(language)}/${encodeURIComponent(word)}`;
		const res = await fetch(url);
		if (!res.ok) return null;

		const data = (await res.json()) as ApiEntry[];
		const result = parseApiResponse(data);
		if (!result) return null;

		const entry: DictionaryCacheEntry = {
			key,
			word: word.toLowerCase(),
			result,
			fetchedAt: Date.now(),
			expiresAt: Date.now() + CACHE_TTL,
		};
		try {
			await _deps.db.dictionaryCache.put(entry);
		} catch {
			// cache write fail silently
		}
		return result;
	} catch (err) {
		logError("DictionaryService.lookupWord", err);
		return null;
	}
}

export async function getCachedLookup(
	word: string,
	language = "en",
): Promise<DictionaryResult | null> {
	const key = buildCacheKey(word, language);
	try {
		const cached = await _deps.db.dictionaryCache.get(key);
		if (cached && cached.expiresAt > Date.now()) {
			return cached.result;
		}
	} catch {
		// cache unavailable
	}
	return null;
}
