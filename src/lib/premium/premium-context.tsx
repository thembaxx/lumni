"use client";

import { createContext, use, useMemo } from "react";

const ALL_FEATURES = [
  "ai-tutor",
  "advanced-analytics",
  "unlimited-flashcards",
  "custom-study-plans",
  "exam-simulator",
  "priority-support",
  "offline-quiz-packs",
  "problem-library",
  "visual-engine",
] as const;

export type PremiumFeature = (typeof ALL_FEATURES)[number];
export type PremiumState = Record<string, never>;

interface FreeContextValue {
  isPremium: true;
  features: PremiumFeature[];
  hasFeature: (_feature: PremiumFeature) => boolean;
}

const FreeContext = createContext<FreeContextValue>({
  isPremium: true,
  features: [...ALL_FEATURES],
  hasFeature: () => true,
});

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo(
    () => ({
      isPremium: true as const,
      features: [...ALL_FEATURES] as PremiumFeature[],
      hasFeature: () => true,
    }),
    [],
  );
  return <FreeContext.Provider value={value}>{children}</FreeContext.Provider>;
}

export function usePremium(): FreeContextValue {
  return use(FreeContext);
}
