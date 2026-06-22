"use client";

import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  use,
  useCallback,
  useMemo,
  useState,
} from "react";

interface LessonCardContextValue {
  openId: string | null;
  setOpenId: Dispatch<SetStateAction<string | null>>;
  isOpen: (id: string) => boolean;
}

const LessonCardContext = createContext<LessonCardContextValue | null>(null);

export function LessonCardProvider({ children }: { children: ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);

  const isOpen = useCallback((id: string) => openId === id, [openId]);

  return (
    <LessonCardContext.Provider
      value={useMemo(() => ({ openId, setOpenId, isOpen }), [openId, isOpen])}
    >
      {children}
    </LessonCardContext.Provider>
  );
}

export function useLessonCardContext() {
  const context = use(LessonCardContext);
  if (!context) {
    throw new Error("useLessonCardContext must be used within LessonCardProvider");
  }
  return context;
}
