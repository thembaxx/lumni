"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { useInterval } from "@/hooks/use-interval";
import { quizSessionRepo } from "@/lib/db/repositories/quiz-session";
import type { Question } from "@/lib/question-engine/types";
import type {
  AnswerDetail,
  QuizSessionActions,
  QuizSessionConfig,
  QuizSessionState,
} from "./types";
import { quizReducer, INITIAL_QUIZ_STATE, type QuizAction, type QuizState } from "./reducer";

function withLocalStorageGuard(action: QuizAction): QuizAction {
  if (action.type === "FINISH" || action.type === "RESET") {
    if (typeof window !== "undefined") {
      localStorage.removeItem("lumni_active_quiz_session");
    }
  }
  return action;
}

export function useQuizSession(
  questions: Question[],
  config?: QuizSessionConfig,
  options?: { sessionId?: string },
): { state: QuizSessionState; actions: QuizSessionActions } {
  const maxTime = Math.max(1, config?.maxTime ?? 90 * 60);
  const sessionId = options?.sessionId ?? crypto.randomUUID();

  const [quizState, dispatch] = useReducer(quizReducer, INITIAL_QUIZ_STATE);

  const {
    currentIndex,
    correctAnswers,
    correctness,
    userAnswers,
    elapsedTime,
    isComplete,
    isActive,
  } = quizState;

  const prevQuestionsLength = useRef(questions.length);
  if (questions.length === 0 && prevQuestionsLength.current > 0) {
    dispatch({ type: "RESET" });
  }
  prevQuestionsLength.current = questions.length;

  const saveRef = useRef({ ...quizState, userAnswers, questions });
  useEffect(() => {
    saveRef.current = { ...quizState, userAnswers, questions };
  });

  const persist = useCallback(() => {
    const s = saveRef.current;
    quizSessionRepo.save({
      sessionId,
      subject: s.questions[0]?.subject ?? "unknown",
      topic: s.questions[0]?.topic,
      questions: JSON.stringify(s.questions),
      answers: [],
      currentIndex: s.currentIndex,
      startedAt: Date.now(),
      isPaused: !s.isActive || s.isComplete,
      duration: s.elapsedTime,
    });
  }, [sessionId]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        persist();
      }
    };
    const handlePageHide = () => persist();

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handlePageHide);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handlePageHide);
    };
  }, [persist]);

  useInterval(
    () => {
      dispatch({ type: "TICK" });
      if (quizState.elapsedTime + 1 >= maxTime) {
        dispatch(withLocalStorageGuard({ type: "FINISH" }));
      }
    },
    isActive && questions.length > 0 && !isComplete ? 1000 : null,
  );

  const currentQuestion = questions?.[currentIndex] ?? null;
  const totalQuestions = questions.length;

  const start = useCallback(() => {
    if (typeof window !== "undefined") {
      const activeSession = localStorage.getItem("lumni_active_quiz_session");
      if (activeSession) {
        console.warn("[QuizSession] Active session already in progress");
        return;
      }
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("lumni_active_quiz_session", sessionId);
    }
    dispatch(withLocalStorageGuard({ type: "START" }));
  }, [sessionId]);

  const recordAnswer = useCallback((correct: boolean, detail?: AnswerDetail) => {
    dispatch({ type: "RECORD_ANSWER", correct, answer: detail?.answer });
  }, []);

  const next = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      dispatch({ type: "SET_INDEX", index: currentIndex + 1 });
    } else {
      dispatch(withLocalStorageGuard({ type: "FINISH" }));
    }
  }, [currentIndex, totalQuestions]);

  const previous = useCallback(() => {
    dispatch({ type: "SET_INDEX", index: Math.max(0, currentIndex - 1) });
  }, [currentIndex]);

  const stop = useCallback(() => {
    dispatch(withLocalStorageGuard({ type: "FINISH" }));
  }, []);

  const restart = useCallback(() => start(), [start]);

  return {
    state: {
      currentQuestion,
      questions,
      questionNumber: currentIndex + 1,
      totalQuestions,
      elapsedTime,
      isComplete,
      correctAnswers,
      correctness,
      userAnswers,
    },
    actions: { start, recordAnswer, next, previous, stop, restart },
  };
}
