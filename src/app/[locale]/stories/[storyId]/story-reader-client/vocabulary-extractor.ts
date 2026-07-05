export interface VocabEntry {
  term: string;
  definition: string;
  partOfSpeech: string;
  pronunciation: string;
  language: string;
}

export function extractFirstVocabularyTerm(vocabulary: VocabEntry[]): string {
  return vocabulary[0]?.term ?? "";
}
