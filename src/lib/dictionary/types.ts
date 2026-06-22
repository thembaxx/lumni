export interface DictionaryDefinition {
  partOfSpeech: string;
  definition: string;
  example?: string;
}

export interface DictionaryResult {
  word: string;
  phonetic: string;
  audio: string;
  definitions: DictionaryDefinition[];
  synonyms: string[];
  antonyms: string[];
}

export interface DictionaryCacheEntry {
  key: string;
  word: string;
  result: DictionaryResult;
  fetchedAt: number;
  expiresAt: number;
}
