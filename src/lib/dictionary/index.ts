export { AFRIKAANS_WORDS, ALL_SEED_WORDS, COMMON_WORDS, ZULU_WORDS } from "./seed-words";
export {
  getCachedLookup,
  getRandomWord,
  getWordOfDay,
  lookupWord,
  preCacheCommonWords,
} from "./service";
export type { DictionaryCacheEntry, DictionaryDefinition, DictionaryResult } from "./types";
export { lookupWiktionary } from "./wiktionary-service";
