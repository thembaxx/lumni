"use client";

import { createContext, type ReactNode, use, useCallback, useMemo, useRef, useState } from "react";
import { SectionReveal } from "@/components/dashboard/section-reveal";

interface StaggerContextValue {
  register: () => number;
}

const StaggerContext = createContext<StaggerContextValue>({
  register: () => 0,
});

export function StaggerProvider({
  children,
  baseDelay = 0.05,
}: {
  children: ReactNode;
  baseDelay?: number;
}) {
  const counterRef = useRef(0);
  const register = useCallback(() => {
    const idx = counterRef.current;
    counterRef.current += 1;
    return idx * baseDelay;
  }, [baseDelay]);

  const value = useMemo(() => ({ register }), [register]);
  return <StaggerContext.Provider value={value}>{children}</StaggerContext.Provider>;
}

function useStagger(): number {
  const { register } = use(StaggerContext);
  const [delay] = useState(() => register());
  return delay;
}

export function StaggeredSection({ children }: { children: ReactNode }) {
  const delay = useStagger();
  return <SectionReveal delay={delay}>{children}</SectionReveal>;
}
