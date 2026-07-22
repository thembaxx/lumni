"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type DynamicTypeLevel = "xs" | "s" | "m" | "l" | "xl";

interface DynamicTypeContextValue {
  level: DynamicTypeLevel;
  scale: number;
}

const DynamicTypeContext = createContext<DynamicTypeContextValue>({
  level: "m",
  scale: 1,
});

export function useDynamicType() {
  return useContext(DynamicTypeContext);
}

function computeLevel(): DynamicTypeLevel {
  if (typeof window === "undefined") return "m";
  const el = document.documentElement;
  const fs = parseFloat(getComputedStyle(el).getPropertyValue("--fs-body") || "17");
  if (fs <= 14) return "xs";
  if (fs <= 16) return "s";
  if (fs <= 18) return "m";
  if (fs <= 21) return "l";
  return "xl";
}

export function DynamicTypeProvider({ children }: { children: ReactNode }) {
  const [level, setLevel] = useState<DynamicTypeLevel>("m");

  useEffect(() => {
    setLevel(computeLevel());

    const observer = new ResizeObserver(() => {
      setLevel(computeLevel());
    });
    observer.observe(document.documentElement);
    return () => observer.disconnect();
  }, []);

  const scale =
    level === "xs" ? 0.85 : level === "s" ? 0.93 : level === "l" ? 1.08 : level === "xl" ? 1.15 : 1;

  return (
    <DynamicTypeContext.Provider value={{ level, scale }}>{children}</DynamicTypeContext.Provider>
  );
}
