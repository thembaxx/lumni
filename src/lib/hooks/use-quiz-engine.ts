"use client";

import { useCallback, useEffect, useState } from "react";

export interface QuizEngineState {
	isRunning: boolean;
	elapsedTime: number;
	currentQuestionIndex: number;
	selectedAnswer: string | null;
	showFeedback: boolean;
	correctAnswers: number;
	totalQuestions: number;
}

export interface QuizEngineActions {
	handleStart: () => void;
	handleStop: () => void;
	handleSelectAnswer: (optionId: string) => void;
	handleAnswer: (optionId: string, isCorrect: boolean) => void;
	handleNext: () => void;
	handlePrevious: () => void;
	handleSkip: () => void;
	handleRestart: () => void;
	reset: () => void;
}

export interface UseQuizEngineOptions {
	maxTime?: number;
	totalQuestions: number;
	onFinish?: (results: { correctAnswers: number; elapsedTime: number }) => void;
	enabled?: boolean;
}

const defaultOnFinish = () => {};

export function useQuizEngine({
	maxTime = 90 * 60,
	totalQuestions: initialTotal,
	onFinish = defaultOnFinish,
}: UseQuizEngineOptions) {
	const [isRunning, setIsRunning] = useState(false);
	const [elapsedTime, setElapsedTime] = useState(0);
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
	const [showFeedback, setShowFeedback] = useState(false);
	const [correctAnswers, setCorrectAnswers] = useState(0);
	const [totalQuestions, setTotalQuestions] = useState(initialTotal);

	const handleStart = useCallback(() => {
		setIsRunning(true);
		setCurrentQuestionIndex(0);
		setSelectedAnswer(null);
		setShowFeedback(false);
		setCorrectAnswers(0);
		setElapsedTime(0);
	}, []);

	const handleStop = useCallback(() => {
		setIsRunning(false);
		onFinish?.({ correctAnswers, elapsedTime });
	}, [correctAnswers, elapsedTime, onFinish]);

	const handleSelectAnswer = useCallback(
		(optionId: string) => {
			if (showFeedback) return;
			setSelectedAnswer(optionId);
		},
		[showFeedback],
	);

	const handleAnswer = useCallback((_optionId: string, isCorrect: boolean) => {
		setShowFeedback(true);
		if (isCorrect) {
			setCorrectAnswers((prev) => prev + 1);
		}
	}, []);

	const handleNext = useCallback(() => {
		if (currentQuestionIndex < totalQuestions - 1) {
			setCurrentQuestionIndex((prev) => prev + 1);
			setSelectedAnswer(null);
			setShowFeedback(false);
		} else {
			handleStop();
		}
	}, [currentQuestionIndex, totalQuestions, handleStop]);

	const handlePrevious = useCallback(() => {
		if (currentQuestionIndex > 0) {
			setCurrentQuestionIndex((prev) => prev - 1);
			setSelectedAnswer(null);
			setShowFeedback(false);
		}
	}, [currentQuestionIndex]);

	const handleSkip = useCallback(() => {
		if (currentQuestionIndex < totalQuestions - 1) {
			setCurrentQuestionIndex((prev) => prev + 1);
			setSelectedAnswer(null);
			setShowFeedback(false);
		} else {
			handleStop();
		}
	}, [currentQuestionIndex, totalQuestions, handleStop]);

	const handleRestart = useCallback(() => {
		setCurrentQuestionIndex(0);
		setSelectedAnswer(null);
		setShowFeedback(false);
		setCorrectAnswers(0);
		setElapsedTime(0);
		setIsRunning(true);
	}, []);

	const reset = useCallback(() => {
		setIsRunning(false);
		setElapsedTime(0);
		setCurrentQuestionIndex(0);
		setSelectedAnswer(null);
		setShowFeedback(false);
		setCorrectAnswers(0);
	}, []);

	useEffect(() => {
		let interval: NodeJS.Timeout;

		if (isRunning && elapsedTime < maxTime) {
			interval = setInterval(() => {
				setElapsedTime((prev) => {
					if (prev >= maxTime) {
						handleStop();
						return maxTime;
					}
					return prev + 1;
				});
			}, 1000);
		}

		return () => clearInterval(interval);
	}, [isRunning, elapsedTime, maxTime, handleStop]);

	const state: QuizEngineState = {
		isRunning,
		elapsedTime,
		currentQuestionIndex,
		selectedAnswer,
		showFeedback,
		correctAnswers,
		totalQuestions,
	};

	const actions: QuizEngineActions = {
		handleStart,
		handleStop,
		handleSelectAnswer,
		handleAnswer,
		handleNext,
		handlePrevious,
		handleSkip,
		handleRestart,
		reset,
	};

	return { state, actions, setTotalQuestions };
}
