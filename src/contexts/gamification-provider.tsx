"use client";

import { createContext, useContext } from "react";
import { useGamification, type UseGamificationReturn } from "@/hooks/use-gamification";

const GamificationContext = createContext<UseGamificationReturn | null>(null);

export function GamificationProvider({ children }: { children: React.ReactNode }) {
  const value = useGamification();
  return <GamificationContext.Provider value={value}>{children}</GamificationContext.Provider>;
}

export function useGamificationContext(): UseGamificationReturn {
  const ctx = useContext(GamificationContext);
  if (!ctx) throw new Error("useGamificationContext must be used within GamificationProvider");
  return ctx;
}
