"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuestionEngine } from "@/hooks/use-question-engine";
import type { BloomLevel, Difficulty, Question, UserAnswer } from "@/lib/question-engine/types";
import { useQuizSession } from "@/lib/quiz-session";
import { dexieDataAccess } from "@/lib/db";
import { logError } from "@/lib/shared/logger";
import type { QuizViewProps } from "../quiz-view";

export interface QuizCompleteResult {
  reason: "completed" | "quit";
  questions: Question[];
  correctness: boolean[];
  correctAnswers: number;
  totalQuestions: number;
  elapsedTime: number;
}

interface RetentionQuestion {
  id: string;
  questionText: string;
  correctAnswer: string;
  explanation: string;
  subject: string;
  topic: string;
}

export function useQuizView({
  initialSubject,
  topic,
  questionCount = 10,
  maxTime = 90 * 60,
  pastPaperMode,
  packQuestions,
  onQuit,
  onFinish,
}: QuizViewProps) {
  const [selectedSubject, setSelectedSubject] = useState(initialSubject ?? "");
  const [sessionActive, setSessionActive] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [competencyData, setCompetencyData] = useState<{
    topicCompetencyLevel?: "novice" | "developing" | "proficient" | "mastered";
    topicCompetencyScore?: number;
    suggestedBloomLevel?: BloomLevel;
    suggestedDifficulty?: Difficulty;
  }>({});
  const [resolvedTopic, setResolvedTopic] = useState<string | undefined>(topic);
  const [retentionQuestions, setRetentionQuestions] = useState<RetentionQuestion[]>([]);

  const actualCount = retentionQuestions.length
    ? Math.max(1, questionCount - retentionQuestions.length)
    : questionCount;

  const engineParams = useMemo(
    () => ({
      subject: selectedSubject.toLowerCase(),
      topic: resolvedTopic,
      count: actualCount,
      questionType: "any" as const,
      ...(pastPaperMode ? { pastPaperMode: true } : {}),
      ...(competencyData.suggestedBloomLevel
        ? { suggestedBloomLevel: competencyData.suggestedBloomLevel }
        : {}),
      ...(competencyData.suggestedDifficulty
        ? { suggestedDifficulty: competencyData.suggestedDifficulty }
        : {}),
      ...(competencyData.topicCompetencyLevel
        ? { topicCompetencyLevel: competencyData.topicCompetencyLevel }
        : {}),
      ...(competencyData.topicCompetencyScore !== undefined
        ? { topicCompetencyScore: competencyData.topicCompetencyScore }
        : {}),
    }),
    [
      selectedSubject,
      resolvedTopic,
      actualCount,
      pastPaperMode,
      competencyData.suggestedBloomLevel,
      competencyData.suggestedDifficulty,
      competencyData.topicCompetencyLevel,
      competencyData.topicCompetencyScore,
    ],
  );

  const usePreloaded = Boolean(packQuestions && packQuestions.length > 0);

  const engineResult = useQuestionEngine(engineParams, {
    enabled: sessionActive && !!selectedSubject && !usePreloaded,
  });

  const generatedQuestions = usePreloaded ? (packQuestions as Question[]) : engineResult.questions;

  const retentionAsQuestions: Question[] = useMemo(
    () =>
      (retentionQuestions ?? []).map((rq) => ({
        id: `ret_${rq.id}`,
        type: "short-answer" as const,
        subject: rq.subject,
        topic: rq.topic,
        difficulty: "Medium" as const,
        bloomTaxonomy: "remember" as BloomLevel,
        points: 1,
        questionText: rq.questionText,
        hint: "",
        explanation: rq.explanation,
        steps: ["Review the correct answer below."],
        body: {
          modelAnswer: rq.correctAnswer,
          acceptableAnswers: [rq.correctAnswer],
          maxLength: 500,
        },
        metadata: { source: "imported" },
      })),
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
  stateRef.current = state;

  const onCompleteRef = useRef(onFinish);
  onCompleteRef.current = onFinish;

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

      let loadedCompData: {
        topicCompetencyLevel?: "novice" | "developing" | "proficient" | "mastered";
        topicCompetencyScore?: number;
        suggestedBloomLevel?: BloomLevel;
        suggestedDifficulty?: Difficulty;
      } = {};
      let targetTopic: string | undefined = topic;

      try {
        const [
          { competencyService },
          { computeCompetencyLevel },
          { mapCompetencyToBloom, mapCompetencyToDifficulty },
        ] = await Promise.all([
          import("@/lib/competency-engine"),
          import("@/lib/competency-engine/types"),
          import("@/lib/question-engine/competency-mapper"),
        ]);

        const normalizedSubject = subject.toLowerCase();
        const competencies = await competencyService.getCompetencies(normalizedSubject);

        try {
          const now = Date.now();
          const items = await dexieDataAccess.retentionRecurrence
            .where("scheduledAt")
            .belowOrEqual(now)
            .toArray();
          const overdue = items.filter((i) => !i.completed && i.subject === normalizedSubject);
          setRetentionQuestions(
            overdue.slice(0, 3).map((i) => ({
              id: i.questionId,
              questionText: i.questionText,
              correctAnswer: i.correctAnswer,
              explanation: i.explanation,
              subject: i.subject,
              topic: i.topic,
            })),
          );
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

        const topicComps = competencies.filter((c) => c.topicId === targetTopic);

        if (topicComps.length > 0) {
          const avgScore = topicComps.reduce((s, c) => s + c.score, 0) / topicComps.length;
          const level = computeCompetencyLevel(avgScore);
          loadedCompData = {
            topicCompetencyLevel: level,
            topicCompetencyScore: Math.round(avgScore),
            suggestedBloomLevel: mapCompetencyToBloom(level, avgScore),
            suggestedDifficulty: mapCompetencyToDifficulty(level),
          };
        }

        setResolvedTopic(targetTopic);
      } catch (e) {
        logError("useQuizView.handleStartWithSubject", e);
      }

      setCompetencyData(loadedCompData);

      setSessionActive(true);
      setLoadError(null);
    },
    [topic],
  );

  const handleStartRef = useRef(handleStartWithSubject);
  handleStartRef.current = handleStartWithSubject;
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
      dexieDataAccess.retentionRecurrence
        .where("questionId")
        .anyOf(ids)
        .modify({ completed: true })
        .catch((e) => logError("useQuizView.markRetentionComplete", e));
    }
  }, [state.isComplete, retentionQuestions]);

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
