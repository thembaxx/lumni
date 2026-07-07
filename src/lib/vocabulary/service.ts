"use client";

import { dexieDataAccess, type VocabularyDataAccess } from "@/lib/db";
import type { VocabularyEntry } from "@/lib/db/schema";
import { createVocabularyCard } from "@/lib/flashcard-engine/vocabulary-bridge";
import { logError } from "@/lib/shared/logger";

let _deps: { db: VocabularyDataAccess } = Object.freeze({ db: dexieDataAccess });
export function __setDepsForTesting(deps: { db: VocabularyDataAccess }) {
  _deps = Object.freeze({ ...deps });
}

export type { VocabularyEntry };

export async function saveWord(
  userId: string,
  word: string,
  definition: string,
  language: string,
  sourceType: "lesson" | "story" | "manual",
  sourceId: string,
  partOfSpeech?: string,
): Promise<VocabularyEntry | null> {
  try {
    const existing = await _deps.db.vocabularyList
      .where("[userId+word]")
      .equals([userId, word.toLowerCase()])
      .first();

    if (existing?.id) {
      await _deps.db.vocabularyList.update(existing.id, {
        reviewCount: existing.reviewCount + 1,
        lastReviewedAt: Date.now(),
      });
      return { ...existing, reviewCount: existing.reviewCount + 1 };
    }

    const entry: Omit<VocabularyEntry, "id"> = {
      userId,
      word: word.toLowerCase(),
      definition,
      language,
      partOfSpeech,
      sourceType,
      sourceId,
      addedAt: Date.now(),
      reviewCount: 0,
    };
    const id = await _deps.db.vocabularyList.add(entry);
    const savedEntry = { ...entry, id };
    await createVocabularyCard(savedEntry).catch((e) => logError("vocab.createCard", e));
    return savedEntry;
  } catch (err) {
    logError("VocabularyService.saveWord", err);
    return null;
  }
}

export async function getSavedWords(
  userId: string,
  filters?: { language?: string; sourceType?: string },
): Promise<VocabularyEntry[]> {
  try {
    const all = await _deps.db.vocabularyList.where("userId").equals(userId).toArray();
    return all.filter((e) => {
      if (filters?.language && e.language !== filters.language) return false;
      if (filters?.sourceType && e.sourceType !== filters.sourceType) return false;
      return true;
    });
  } catch (err) {
    logError("VocabularyService.getSavedWords", err);
    return [];
  }
}

export async function removeWord(userId: string, word: string): Promise<boolean> {
  try {
    const existing = await _deps.db.vocabularyList
      .where("[userId+word]")
      .equals([userId, word.toLowerCase()])
      .first();
    if (existing?.id) {
      await _deps.db.vocabularyList.delete(existing.id);
      return true;
    }
    return false;
  } catch (err) {
    logError("VocabularyService.removeWord", err);
    return false;
  }
}

export async function isWordSaved(userId: string, word: string): Promise<boolean> {
  try {
    const existing = await _deps.db.vocabularyList
      .where("[userId+word]")
      .equals([userId, word.toLowerCase()])
      .first();
    return !!existing;
  } catch {
    return false;
  }
}
