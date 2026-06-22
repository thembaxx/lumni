"use client";

import { createContext, type ReactNode, useCallback, useMemo, useState } from "react";

export type CelebrationType =
  | "correct_answer"
  | "quiz_complete"
  | "perfect_score"
  | "streak_milestone"
  | "achievement_unlock"
  | "level_up"
  | "xp_gain"
  | "flashcard_known";

export interface Celebration {
  type: CelebrationType;
  amount?: number;
  message?: string;
  metadata?: Record<string, unknown>;
}

interface JoyContextValue {
  triggerCelebration: (celebration: Celebration) => void;
  currentCelebration: Celebration | null;
  clearCelebration: () => void;
}

const JoyContext = createContext<JoyContextValue | null>(null);

export function JoyProvider({ children }: { children: ReactNode }) {
  const [currentCelebration, setCurrentCelebration] = useState<Celebration | null>(null);

  const triggerCelebration = useCallback((celebration: Celebration) => {
    setCurrentCelebration(celebration);
    setTimeout(() => {
      setCurrentCelebration(null);
    }, 3000);
  }, []);

  const clearCelebration = useCallback(() => {
    setCurrentCelebration(null);
  }, []);

  return (
    <JoyContext.Provider
      value={useMemo(
        () => ({ triggerCelebration, currentCelebration, clearCelebration }),
        [triggerCelebration, currentCelebration, clearCelebration],
      )}
    >
      {children}
    </JoyContext.Provider>
  );
}
