"use client";

import { useCallback, useEffect, useMemo } from "react";
import type { QuestionPart } from "@/types/exam-paper";
import type { SessionPhase } from "./session-reducer";

type FlatPart = {
  sectionId: string;
  questionId: string;
  part: QuestionPart;
};

export function useAnswerTracking(
  flatParts: FlatPart[],
  currentPartId: string | null,
  setCurrentPart: (partId: string) => void,
  setAnswer: (partId: string, value: string | string[]) => void,
  paperData: { metadata: { subject: string; id: string } } | undefined,
  trackExamStart: (subject: string, paperId?: string) => void,
  isMock: boolean,
  setPhase: (phase: SessionPhase) => void,
) {
  const currentPartIndex = useMemo(
    () =>
      flatParts.findIndex((p) => `${p.sectionId}-${p.questionId}-${p.part.id}` === currentPartId),
    [flatParts, currentPartId],
  );

  const currentPart = useMemo(
    () => (currentPartIndex >= 0 ? flatParts[currentPartIndex] : null),
    [flatParts, currentPartIndex],
  );

  const startSession = useCallback(() => {
    const first = flatParts[0];
    if (first) setCurrentPart(`${first.sectionId}-${first.questionId}-${first.part.id}`);
    trackExamStart(paperData?.metadata.subject ?? "unknown", paperData?.metadata.id);
    setPhase("active");
  }, [flatParts, setCurrentPart, paperData, trackExamStart, setPhase]);

  const goToNext = useCallback(() => {
    if (currentPartIndex < flatParts.length - 1) {
      const nextPart = flatParts[currentPartIndex + 1];
      setCurrentPart(`${nextPart.sectionId}-${nextPart.questionId}-${nextPart.part.id}`);
    }
  }, [currentPartIndex, flatParts, setCurrentPart]);

  const goToPrevious = useCallback(() => {
    if (isMock) return;
    if (currentPartIndex > 0) {
      const prevPart = flatParts[currentPartIndex - 1];
      setCurrentPart(`${prevPart.sectionId}-${prevPart.questionId}-${prevPart.part.id}`);
    }
  }, [currentPartIndex, flatParts, setCurrentPart, isMock]);

  const handleAnswer = useCallback(
    (value: string | string[]) => {
      if (currentPartId) setAnswer(currentPartId, value);
    },
    [currentPartId, setAnswer],
  );

  return { currentPartIndex, currentPart, startSession, goToNext, goToPrevious, handleAnswer };
}

export function useTabFocusWarning(
  isMock: boolean,
  phase: SessionPhase,
  setTabFocusWarn: (v: boolean) => void,
) {
  useEffect(() => {
    if (!isMock || phase !== "active") return;
    const handleVisibility = () => {
      if (document.hidden) setTabFocusWarn(true);
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [isMock, phase, setTabFocusWarn]);
}
