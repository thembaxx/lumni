"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { audioEngine } from "@/lib/audio-engine";
import { useAuth } from "@/lib/auth/auth-context";
import type { AssessmentResult } from "@/app/[locale]/pronunciation/pronunciation-client/scoring";
import type { ModelState } from "@/app/[locale]/pronunciation/pronunciation-client/whisper-loader";
import {
  requestMicPermission,
  toggleRecording,
  transcribeAndAssess,
  resetAll,
} from "@/app/[locale]/pronunciation/pronunciation-client/recording-orchestrator";
import { createProgressPoller } from "@/app/[locale]/pronunciation/pronunciation-client/whisper-loader";

interface HistoryStats {
  totalAttempts: number;
  averageScore: number;
  recentScores: { date: string; score: number }[];
  topWords: { word: string; count: number; avgScore: number }[];
}

export function usePronunciationSession() {
  const searchParams = useSearchParams();
  const prefillText = searchParams.get("text") ?? "";
  const prefillLang = searchParams.get("lang") ?? "en";
  const { user } = useAuth();
  const userId = user?.$id ?? "anonymous";

  const [expectedText, setExpectedText] = useState(prefillText);
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyStats, setHistoryStats] = useState<HistoryStats | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const permissionRef = useRef(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [modelState, setModelState] = useState<ModelState>("idle");

  useEffect(() => {
    const unsub = audioEngine.subscribe(() => {
      const state = audioEngine.getState();
      setIsRecording(state.isRecording);
      setHasRecording(!!state.audioBlob);
    });
    return unsub;
  }, []);

  const handleRecord = useCallback(async () => {
    await toggleRecording(permissionRef, () => requestMicPermission(permissionRef));
  }, []);

  const handleTranscribe = useCallback(async () => {
    await transcribeAndAssess(
      expectedText,
      userId,
      prefillLang,
      () => createProgressPoller(setDownloadProgress, () => setModelState("loaded")),
      { setLoading, setTranscribedText, setAssessment, setModelState, setDownloadProgress },
    );
  }, [expectedText, userId, prefillLang]);

  const handleReset = useCallback(() => {
    resetAll({
      setTranscribedText,
      setAssessment,
      setExpectedText,
      setHasRecording,
      setModelState,
      setDownloadProgress,
    });
  }, []);

  const handleLoadHistory = useCallback(async () => {
    setShowHistory((prev) => !prev);
    if (!showHistory) {
      setHistoryLoading(true);
      import("@/lib/pronunciation-history/service").then((mod) => {
        mod.getPronunciationStats(userId).then((stats) => {
          setHistoryStats(stats);
          setHistoryLoading(false);
        });
      });
    }
  }, [userId, showHistory]);

  return {
    expectedText,
    setExpectedText,
    isRecording,
    hasRecording,
    transcribedText,
    assessment,
    loading,
    showHistory,
    historyLoading,
    historyStats,
    downloadProgress,
    modelState,
    prefillLang,
    handleRecord,
    handleTranscribe,
    handleReset,
    handleLoadHistory,
  };
}
