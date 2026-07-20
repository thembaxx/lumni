"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuestionEngine } from "@/hooks/use-question-engine";
import { useRetentionQuestions } from "@/hooks/use-quiz-data";
import type { Question, UserAnswer } from "@/lib/question-engine/types";
import { useQuizSession } from "@/lib/quiz-session";
import { logError } from "@/lib/shared/logger";
import type { QuizViewProps } from "../quiz-view";
import { competencyService } from "@/lib/competency-engine";
import {
  buildEngineParams,
  computeTopicCompetency,
  mapRetentionToQuestions,
  type RetentionQuestion,
  type QuizCompetencyData,
} from "./quiz-utils";

export interface QuizCompleteResult {
  reason: "completed" | "quit";
  questions: Question[];
  correctness: boolean[];
  correctAnswers: number;
  totalQuestions: number;
  elapsedTime: number;
}

const DEFAULT_MAX_TIME = 5400;

export function useQuizView({
  initialSubject,
  topic,
  questionCount = 10,
  maxTime = DEFAULT_MAX_TIME,
  pastPaperMode,
  packQuestions,
  onQuit,
  onFinish,
}: QuizViewProps) {
  const [selectedSubject, setSelectedSubject] = useState(initialSubject ?? "");
  const [sessionActive, setSessionActive] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [competencyData, setCompetencyData] = useState<QuizCompetencyData>({});
  const [resolvedTopic, setResolvedTopic] = useState<string | undefined>(topic);
  const [retentionQuestions, setRetentionQuestions] = useState<RetentionQuestion[]>([]);

  const { loadRetention, markCompleted } = useRetentionQuestions();

  const actualCount = retentionQuestions.length
    ? Math.max(1, questionCount - retentionQuestions.length)
    : questionCount;

  const engineParams = useMemo(
    () =>
      buildEngineParams(selectedSubject, resolvedTopic, actualCount, pastPaperMode, competencyData),
    [selectedSubject, resolvedTopic, actualCount, pastPaperMode, competencyData],
  );

  const usePreloaded = Boolean(packQuestions && packQuestions.length > 0);

  const engineResult = useQuestionEngine(engineParams, {
    enabled: sessionActive && !!selectedSubject && !usePreloaded,
  });

  const generatedQuestions = usePreloaded ? (packQuestions as Question[]) : engineResult.questions;

  const retentionAsQuestions: Question[] = useMemo(
    () => mapRetentionToQuestions(retentionQuestions ?? []),
    [retentionQuestions],
  );

  const questions = useMemo(
    () =>
      retentionAsQuestions.length > 0
        ? [...retentionAsQuestions, ...generatedQuestions]
        : generatedQuestions,
    [retentionAsQuestions, generatedQuestions],
  );
  const sources = usePreloaded ? [] : engineResult.sources;
  const warning = usePreloaded ? undefined : engineResult.warning;
  const isLoading = usePreloaded ? false : engineResult.isLoading;
  const isError = usePreloaded ? false : engineResult.isError;

  const { state, actions } = useQuizSession(questions ?? [], { maxTime });

  const currentIndex = state.questionNumber - 1;

  const [currentAnswered, setCurrentAnswered] = useState(false);

  const stateRef = useRef(state);
  const onCompleteRef = useRef(onFinish);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  useEffect(() => {
    onCompleteRef.current = onFinish;
  }, [onFinish]);

  const handleNext = useCallback(() => {
    const s = stateRef.current;
    const wasLast = s.questionNumber - 1 >= s.totalQuestions - 1;
    actions.next();
    setCurrentAnswered(false);
    if (wasLast) {
      onCompleteRef.current?.({
        reason: "completed",
        questions: s.questions,
        correctness: s.correctness,
        correctAnswers: s.correctAnswers,
        totalQuestions: s.totalQuestions,
        elapsedTime: s.elapsedTime,
      });
    }
  }, [actions]);

  const handlePrevious = useCallback(() => {
    actions.previous();
    setCurrentAnswered(false);
  }, [actions]);

  const handleSkip = useCallback(() => {
    handleNext();
  }, [handleNext]);

  const handleAnswered = useCallback(
    (correct: boolean, _score?: number, answer?: UserAnswer) => {
      setCurrentAnswered(true);
      actions.recordAnswer(
        correct,
        answer ? { selectedAnswer: "", correctAnswer: "", answer } : undefined,
      );
    },
    [actions],
  );

  const handleStop = useCallback(() => {
    const s = stateRef.current;
    actions.stop();
    onCompleteRef.current?.({
      reason: "quit",
      questions: s.questions,
      correctness: s.correctness,
      correctAnswers: s.correctAnswers,
      totalQuestions: s.totalQuestions,
      elapsedTime: s.elapsedTime,
    });
    onQuit?.();
  }, [actions, onQuit]);

  const handleRestart = useCallback(() => {
    actions.restart();
    setCurrentAnswered(false);
  }, [actions]);

  const handleStartWithSubject = useCallback(
    async (subject: string) => {
      setSelectedSubject(subject);

      let loadedCompData: QuizCompetencyData = {};
      let targetTopic: string | undefined = topic;

      try {
        const normalizedSubject = subject.toLowerCase();
        const competencies = await competencyService.getCompetencies(normalizedSubject);

        try {
          const items = await loadRetention(normalizedSubject);
          setRetentionQuestions(items);
        } catch (e) {
          logError("useQuizView.retention", e);
          setRetentionQuestions([]);
        }

        if (competencies.length === 0) {
          setCompetencyData({});
          setResolvedTopic(topic);
          setSessionActive(true);
          setLoadError(null);
          return;
        }

        if (!targetTopic) {
          const weakest = competencies.reduce((prev, curr) =>
            curr.score < prev.score ? curr : prev,
          );
          targetTopic = weakest.topicId;
        }

        loadedCompData = computeTopicCompetency(competencies, targetTopic);
        setResolvedTopic(targetTopic);
      } catch (e) {
        logError("useQuizView.handleStartWithSubject", e);
      }

      setCompetencyData(loadedCompData);

      setSessionActive(true);
      setLoadError(null);
    },
    [topic, loadRetention],
  );

  const handleStartRef = useRef(handleStartWithSubject);
  useEffect(() => {
    handleStartRef.current = handleStartWithSubject;
  }, [handleStartWithSubject]);
  const hasAutoStarted = useRef(false);
  useEffect(() => {
    if (initialSubject && !hasAutoStarted.current) {
      hasAutoStarted.current = true;
      handleStartRef.current(initialSubject);
    }
  }, [initialSubject]);

  useEffect(() => {
    if (sessionActive && questions.length > 0 && !state.isComplete) {
      actions.start();
    }
  }, [sessionActive, questions, state.isComplete, actions]);

  useEffect(() => {
    if (state.isComplete && retentionQuestions.length > 0) {
      const ids = retentionQuestions.map((rq) => rq.id);
      markCompleted(ids);
    }
  }, [state.isComplete, retentionQuestions, markCompleted]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!sessionActive || !state.currentQuestion) return;

      if (state.currentQuestion.type === "multiple-choice" && currentAnswered === false) {
        switch (e.key) {
          case "ArrowLeft":
          case "ArrowUp":
          case "ArrowRight":
          case "ArrowDown":
          case "Enter":
          case " ":
            e.preventDefault();
            break;
        }
      }

      switch (e.key) {
        case "ArrowLeft":
          if (currentIndex > 0) {
            e.preventDefault();
            handlePrevious();
          }
          break;
        case "ArrowRight":
          if (currentIndex < state.totalQuestions - 1) {
            e.preventDefault();
            handleNext();
          }
          break;
        case "Escape":
          if (state.isComplete) {
            e.preventDefault();
            handleStop();
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    sessionActive,
    state.currentQuestion,
    currentIndex,
    state.totalQuestions,
    handleNext,
    handlePrevious,
    handleStop,
    state.isComplete,
    currentAnswered,
  ]);

  return {
    selectedSubject,
    sessionActive,
    loadError,
    currentAnswered,
    competencyData,
    resolvedTopic,
    questions,
    sources,
    warning,
    isLoading,
    isError,
    state,
    currentIndex,
    handleStartWithSubject,
    handleStop,
    handleRestart,
    handleNext,
    handlePrevious,
    handleSkip,
    handleAnswered,
    setLoadError,
  };
}
