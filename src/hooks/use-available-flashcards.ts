"use client";

import { useCallback } from "react";
import { dexieDataAccess } from "@/lib/db";

export function useAvailableFlashcards() {
  const getFlashcards = useCallback(async (): Promise<{ id: string; front: string }[]> => {
    const cards = await dexieDataAccess.flashcards.toArray();
    return cards.map((c) => ({ id: c.id, front: c.front }));
  }, []);

  return { getFlashcards };
}
