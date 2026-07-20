import type { VocabularyEntry } from "@/lib/db/types";
import { flashcardEngine } from "./engine";

export async function createVocabularyCard(word: VocabularyEntry): Promise<void> {
  const back = word.partOfSpeech ? `${word.definition} (${word.partOfSpeech})` : word.definition;

  await flashcardEngine.create(word.word, back, word.language, "vocabulary");
}
