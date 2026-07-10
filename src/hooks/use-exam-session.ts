"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useImmersiveMode } from "@/components/shared/immersive-mode";
import { useTrackExamEvents } from "@/hooks/use-analytics-tracking";
import { useExamPaper } from "@/hooks/use-exam-paper";
import { useGamification } from "@/hooks/use-gamification";
import { useRouter } from "@/i18n/navigation";
import { useNavigationDirection } from "@/hooks/use-navigation-direction";
import { getAnswerText, getCorrectAnswerText, parseDuration } from "@/lib/exam/helpers";
import { processQuizResult } from "@/lib/services";
import { useExamSessionStore } from "@/store/exam-session";
import { useAutoSave } from "@/app/[locale]/exam/[id]/exam-session/auto-save";
import {
  useAnswerTracking,
  useTabFocusWarning,
} from "@/app/[locale]/exam/[id]/exam-session/answer-tracking";
import type { SessionPhase } from "@/app/[locale]/exam/[id]/exam-session/session-reducer";
import {
  useTimerEffect,
  useTimeExpiryHandler,
} from "@/app/[locale]/exam/[id]/exam-session/timer-logic";
import { useQuizResultDeps } from "@/app/[locale]/exam/[id]/exam-session/gamification-wiring";

export function useExamSession(id: string, mode: "timed" | "practice" | "mock") {
  const { data: paperData, isLoading: paperLoading } = useExamPaper(id);

  const [phase, setPhase] = useState<SessionPhase>("loading");
  const [sessionModeOverride, setSessionModeOverride] = useState<
    "timed" | "practice" | "mock" | null
  >(null);
  const sessionMode = sessionModeOverride ?? mode;
  const isMock = sessionMode === "mock";
  const [showPalette, setShowPalette] = useState(false);
  const [paused, setPaused] = useState(false);
  const [tabFocusWarn, setTabFocusWarn] = useState(false);

  const {
    paper,
    answers,
    flags,
    currentPartId,
    timeRemaining,
    initSession,
    setAnswer,
    toggleFlag,
    setCurrentPart,
    tick,
    completeSession,
    resetSession,
    getFlatParts,
    getAnsweredCount,
    getTotalPartsCount,
  } = useExamSessionStore();

  const {
    addXp,
    updateStreak,
    checkAndUnlockAchievements,
    checkForRewardChests,
    currentStreak,
    levelInfo,
    totalQuestionsAnswered,
  } = useGamification();

  const { setImmersive } = useImmersiveMode();
  const { trackExamStart, trackExamComplete } = useTrackExamEvents();

  const quizResultDeps = useQuizResultDeps({
    addXp,
    updateStreak,
    checkAndUnlockAchievements,
    checkForRewardChests,
    currentStreak,
    totalQuestionsAnswered,
    levelInfo,
  });

  useAutoSave(id);
  useTabFocusWarning(isMock, phase, setTabFocusWarn);

  const flatParts = useMemo(() => {
    if (!paper) return [];
    return getFlatParts();
  }, [paper, getFlatParts]);

  const timerRef = useTimerEffect(phase, sessionMode, isMock, paused, tick);
  useTimeExpiryHandler(timeRemaining, phase, sessionMode, isMock, completeSession, setPhase);

  const { currentPartIndex, currentPart, startSession, goToNext, goToPrevious, handleAnswer } =
    useAnswerTracking(
      flatParts,
      currentPartId,
      setCurrentPart,
      setAnswer,
      paperData
        ? { metadata: { subject: paperData.metadata.subject, id: paperData.metadata.id } }
        : undefined,
      trackExamStart,
      isMock,
      setPhase,
    );

  const initializedPaperIdRef = useRef<string | null>(null);
  if (!paperLoading && paperData && paperData.metadata.id !== initializedPaperIdRef.current) {
    initializedPaperIdRef.current = paperData.metadata.id;
    const durationMinutes = parseDuration(paperData.exam.metadata.duration);
    initSession(paperData.exam, paperData.metadata.id, durationMinutes);
    setPhase("mode-select");
  }

  useEffect(() => {
    setImmersive(phase === "active");
    return () => setImmersive(false);
  }, [phase, setImmersive]);

  const { back } = useRouter();
  const { push } = useNavigationDirection();

  const handleSubmit = useCallback(async () => {
    setPhase("submitting");
    completeSession();
    if (timerRef.current) clearInterval(timerRef.current);

    const examParts = flatParts.map((item) => {
      const fullId = `${item.sectionId}-${item.questionId}-${item.part.id}`;
      const answer = answers[fullId];
      let correct = false;
      if (item.part.type === "multiple-choice" && item.part.options) {
        const selected = Array.isArray(answer?.value) ? answer?.value[0] : answer?.value;
        correct = item.part.options.some((o) => o.id === selected && o.isCorrect);
      }
      return {
        partId: fullId,
        correct,
        score: correct ? 1 : 0,
        sectionId: item.sectionId,
        questionId: item.questionId,
        part: item.part,
        userAnswer: getAnswerText(item.part, answers[fullId]),
        correctAnswerText: getCorrectAnswerText(item.part),
      };
    });

    const correctCount = examParts.filter((p) => p.correct).length;
    trackExamComplete(paperData?.metadata.subject ?? "unknown", correctCount, examParts.length);

    await processQuizResult(
      {
        source: "exam",
        parts: examParts,
        subject: paperData?.metadata.subject ?? "unknown",
        paperId: paperData?.metadata.id,
      },
      quizResultDeps,
    );

    setPhase("results");
  }, [flatParts, answers, completeSession, quizResultDeps, trackExamComplete, paperData, timerRef]);

  const handleDashboard = useCallback(() => {
    resetSession();
    back();
  }, [resetSession, back]);

  return {
    paperData,
    paperLoading,
    sessionMode,
    isMock,
    phase,
    setPhase,
    setSessionModeOverride,
    showPalette,
    setShowPalette,
    paused,
    setPaused,
    tabFocusWarn,
    answers,
    flags,
    currentPartId,
    timeRemaining,
    flatParts,
    currentPartIndex,
    currentPart,
    startSession,
    goToNext,
    goToPrevious,
    handleAnswer,
    toggleFlag,
    setCurrentPart,
    handleSubmit,
    handleDashboard,
    getAnsweredCount,
    getTotalPartsCount,
    resetSession,
    push,
  };
}
