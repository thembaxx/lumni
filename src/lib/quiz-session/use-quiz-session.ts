"use client";

import { useCallback, useRef, useState } from "react";
import { useInterval } from "@/hooks/use-interval";
import type { Question } from "@/lib/question-engine/types";
import type {
	AnswerDetail,
	QuizSessionActions,
	QuizSessionConfig,
	QuizSessionState,
} from "./types";

export function useQuizSession(
	questions: Question[],
	config?: QuizSessionConfig,
): { state: QuizSessionState; actions: QuizSessionActions } {
	const maxTime = config?.maxTime ?? 90 * 60;

	const [currentIndex, setCurrentIndex] = useState(0);
	const [correctAnswers, setCorrectAnswers] = useState(0);
	const [correctness, setCorrectness] = useState<boolean[]>([]);
	const [elapsedTime, setElapsedTime] = useState(0);
	const [isComplete, setIsComplete] = useState(false);
	const [isActive, setIsActive] = useState(false);

	const prevQuestionsRef = useRef(questions);
	if (prevQuestionsRef.current !== questions) {
		prevQuestionsRef.current = questions;
		if (questions.length === 0) {
			setCurrentIndex(0);
			setCorrectAnswers(0);
			setCorrectness([]);
			setElapsedTime(0);
			setIsComplete(false);
			setIsActive(false);
		}
	}

	useInterval(
		() => {
			setElapsedTime((prev) => {
				if (prev >= maxTime) {
					setIsComplete(true);
					setIsActive(false);
					return prev;
				}
				return prev + 1;
			});
		},
		isActive && questions.length > 0 && !isComplete ? 1000 : null,
	);

	const currentQuestion = questions?.[currentIndex] ?? null;
	const totalQuestions = questions.length;

	const start = useCallback(() => {
		setCurrentIndex(0);
		setCorrectAnswers(0);
		setCorrectness([]);
		setElapsedTime(0);
		setIsComplete(false);
		setIsActive(true);
	}, []);

	const recordAnswer = useCallback(
		(correct: boolean, detail?: AnswerDetail) => {
			setCorrectness((prev) => [...prev, correct]);
			if (correct) setCorrectAnswers((prev) => prev + 1);
		},
		[],
	);

	const next = useCallback(() => {
		if (currentIndex < totalQuestions - 1) {
			setCurrentIndex((prev) => prev + 1);
		} else {
			setIsComplete(true);
			setIsActive(false);
		}
	}, [currentIndex, totalQuestions]);

	const previous = useCallback(() => {
		setCurrentIndex((prev) => Math.max(0, prev - 1));
	}, []);

	const stop = useCallback(() => {
		setIsComplete(true);
		setIsActive(false);
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
		},
		actions: { start, recordAnswer, next, previous, stop, restart },
	};
}
