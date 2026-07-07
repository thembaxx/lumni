"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { dexieDataAccess } from "@/lib/db";

export interface OfflineStats {
  questions: number;
  flashcards: number;
  guides: number;
  packs: number;
  wrongAnswers: number;
  pendingSync: number;
}

export function useOfflineStats(): OfflineStats {
  const questions = useLiveQuery(() => dexieDataAccess.questions.count(), [], 0);
  const flashcards = useLiveQuery(() => dexieDataAccess.flashcards.count(), [], 0);
  const guides = useLiveQuery(() => dexieDataAccess.studyGuides.count(), [], 0);
  const packs = useLiveQuery(() => dexieDataAccess.quizPacks.count(), [], 0);
  const wrongAnswers = useLiveQuery(() => dexieDataAccess.wrongAnswers.count(), [], 0);
  const pendingSync = useLiveQuery(() => dexieDataAccess.syncOutbox.count(), [], 0);

  return { questions, flashcards, guides, packs, wrongAnswers, pendingSync };
}
