"use client";

import { dexieDataAccess } from "@/lib/db";
import type { DataAccess } from "@/lib/db/data-access";
import { ALL_SEED_WORDS, COMMON_WORDS } from "./seed-words";
import type { DictionaryCacheEntry, DictionaryResult } from "./types";
import { lookupWiktionary } from "./wiktionary-service";

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

async function tryFreeDictionary(word: string, language: string): Promise<DictionaryResult | null> {
  try {
    const url = `${API_BASE}/${encodeURIComponent(language)}/${encodeURIComponent(word)}`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = (await res.json()) as ApiEntry[];
    return parseApiResponse(data);
  } catch {
    return null;
  }
}

async function cacheResult(
  word: string,
  language: string,
  result: DictionaryResult,
): Promise<DictionaryResult> {
  const key = buildCacheKey(word, language);
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
}

export async function lookupWord(word: string, language = "en"): Promise<DictionaryResult | null> {
  const key = buildCacheKey(word, language);

  try {
    const cached = await _deps.db.dictionaryCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.result;
    }
  } catch {
    // cache unavailable
  }

  if (language === "en") {
    const result = await tryFreeDictionary(word, language);
    if (result) return cacheResult(word, language, result);
  }

  const result = await lookupWiktionary(word, language);
  if (result) return cacheResult(word, language, result);

  return null;
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

function dateSeed(date: Date): number {
  const str = date.toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getWordOfDay(_language: string, date: Date = new Date()): string {
  const seed = dateSeed(date);
  const pool = ALL_SEED_WORDS;
  return pool[seed % pool.length];
}

export function getRandomWord(): string {
  const pool = ALL_SEED_WORDS;
  return pool[Math.floor(Math.random() * pool.length)];
}

export async function preCacheCommonWords(db: DataAccess): Promise<void> {
  try {
    const count = await db.dictionaryCache.count();
    if (count >= 200) return;
  } catch {
    return;
  }

  for (const word of COMMON_WORDS) {
    try {
      await lookupWord(word);
    } catch {
      // individual word failure is ok
    }
    // small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}
