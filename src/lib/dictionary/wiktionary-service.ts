"use client";

import { logError } from "@/lib/shared/logger";
import type { DictionaryResult } from "./types";

const EN_WIKTIONARY_API = "https://en.wiktionary.org/w/api.php";

interface WiktionaryPage {
  pageid?: number;
  title: string;
  extract?: string;
}

interface WiktionaryResponse {
  query?: {
    pages?: Record<string, WiktionaryPage>;
  };
}

function parseExtract(extract: string): DictionaryResult["definitions"] {
  const definitions: DictionaryResult["definitions"] = [];

  const posRegex = /===(\w+)===\n([\s\S]*?)(?====\w+===|$)/g;
  let posMatch: RegExpExecArray | null;

  for (;;) {
    posMatch = posRegex.exec(extract);
    if (!posMatch) break;
    const pos = posMatch[1].toLowerCase();
    const content = posMatch[2];
    const defRegex = /^# (.+)$/gm;
    let defMatch: RegExpExecArray | null;

    for (;;) {
      defMatch = defRegex.exec(content);
      if (!defMatch) break;
      definitions.push({
        partOfSpeech: pos,
        definition: defMatch[1].trim(),
      });
    }
  }

  return definitions;
}

function extractPhonetic(extract: string): string {
  const ipaMatch = extract.match(/\* IPA[:\s]+([^\n]+)/i);
  if (ipaMatch) return ipaMatch[1].trim();
  return "";
}

async function fetchWiktionary(api: string, word: string): Promise<WiktionaryResponse | null> {
  const params = new URLSearchParams({
    action: "query",
    titles: word,
    prop: "extracts",
    format: "json",
    exintro: "1",
    explaintext: "1",
  });

  const url = `${api}?${params}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Lumni/1.0" },
    });

    if (!res.ok) return null;
    return (await res.json()) as WiktionaryResponse;
  } catch {
    return null;
  }
}

function extractResult(response: WiktionaryResponse, word: string): DictionaryResult | null {
  const pages = response.query?.pages;
  if (!pages) return null;

  const pageId = Object.keys(pages)[0];
  if (!pageId || pageId === "-1") return null;

  const page = pages[pageId];
  if (!page?.extract) return null;

  const definitions = parseExtract(page.extract);
  if (definitions.length === 0) return null;

  return {
    word,
    phonetic: extractPhonetic(page.extract),
    audio: "",
    definitions,
    synonyms: [],
    antonyms: [],
  };
}

export async function lookupWiktionary(
  word: string,
  language: string,
): Promise<DictionaryResult | null> {
  try {
    const enResponse = await fetchWiktionary(EN_WIKTIONARY_API, word);
    if (enResponse) {
      const result = extractResult(enResponse, word);
      if (result) return result;
    }

    const langApi = `https://${language}.wiktionary.org/w/api.php`;
    const langResponse = await fetchWiktionary(langApi, word);
    if (langResponse) {
      const result = extractResult(langResponse, word);
      if (result) return result;
    }

    return null;
  } catch (err) {
    logError("WiktionaryService.lookupWiktionary", err);
    return null;
  }
}
