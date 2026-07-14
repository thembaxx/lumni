"use client";

import { useEffect, useRef } from "react";
import type { SessionPhase } from "./session-reducer";

export function useTimerEffect(
  phase: SessionPhase,
  sessionMode: string,
  isMock: boolean,
  paused: boolean,
  tick: () => void,
) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (phase === "active" && (sessionMode === "timed" || isMock) && !paused) {
      timerRef.current = setInterval(() => {
        tick();
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [phase, sessionMode, isMock, paused, tick]);

  return timerRef;
}

export function useTimeExpiryHandler(
  timeRemaining: number,
  phase: SessionPhase,
  sessionMode: string,
  isMock: boolean,
  completeSession: () => void,
  setPhase: (phase: SessionPhase) => void,
) {
  const completionRef = useRef(false);
  const prevPhaseRef = useRef<SessionPhase>(phase);

  useEffect(() => {
    if (
      timeRemaining <= 0 &&
      phase === "active" &&
      (sessionMode === "timed" || isMock) &&
      !completionRef.current
    ) {
      completionRef.current = true;
      completeSession();
      setPhase("submitting");
    }
    if (phase !== "active") {
      completionRef.current = false;
    }
    prevPhaseRef.current = phase;
  }, [timeRemaining, phase, sessionMode, isMock, completeSession, setPhase]);

  return completionRef;
}
