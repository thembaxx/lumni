"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { Question } from "@/types/questions";
import { useQuestionEngine } from "./use-question-engine";

export interface UseQuizSessionOptions {
	subject?: string;
	topic?: string;
	questionCount?: number;
	maxTime?: number;
	onFinish?: (results: { correctAnswers: number; elapsedTime: number }) => void;
	enabled?: boolean;
}

export interface QuizSessionState {
	isRunning: boolean;
	elapsedTime: number;
	currentQuestionIndex: number;
	selectedAnswer: string | null;
	showFeedback: boolean;
	correctAnswers: number;
	totalQuestions: number;
}

export interface UseQuizSessionActions {
	handleStart: () => void;
	handleStartWithSubject: (subject: string) => void;
	handleSelectSubject: (subject: string) => void;
	handleStop: () => void;
	handleRestart: () => void;
	handleSelectAnswer: (optionId: string) => void;
	handleAnswer: (optionId: string, isCorrect: boolean) => void;
	handleNext: () => void;
	handlePrevious: () => void;
	handleSkip: () => void;
	reset: () => void;
}

export interface UseQuizSessionResult {
	state: QuizSessionState & {
		questions: Question[];
		currentQuestion: Question | undefined;
		isLoading: boolean;
		hasSubject: boolean;
		selectedSubject: string;
		points: number;
	};
	actions: UseQuizSessionActions;
}

const defaultSubject = "";

export function useQuizSession({
	subject: initialSubject = defaultSubject,
	topic,
	questionCount = 10,
	maxTime = 90 * 60,
	onFinish,
	enabled = true,
}: UseQuizSessionOptions = {}): UseQuizSessionResult {
	const [selectedSubject, setSelectedSubject] = useState<string>(initialSubject);
	const [points, setPoints] = useState(() => Math.floor(Math.random() * 101));
	const [sessionStarted, setSessionStarted] = useState(false);

	const normalizedSubject =
		initialSubject || selectedSubject.toLowerCase();

	const engineParams = useMemo(
		() => ({
			subject: normalizedSubject,
			topic,
			count: questionCount,
			questionType: "multiple-choice" as const,
		}),
		[normalizedSubject, topic, questionCount],
	);

	const { questions: loadedQuestions, isLoading } = useQuestionEngine(
		engineParams,
		{ enabled: enabled && sessionStarted && selectedSubject !== "" },
	);

	const questionsToUse = loadedQuestions ?? [];

	// Quiz engine state
	const [isRunning, setIsRunning] = useState(false);
	const [elapsedTime, setElapsedTime] = useState(0);
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
	const [showFeedback, setShowFeedback] = useState(false);
	const [correctAnswers, setCorrectAnswers] = useState(0);
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const startTimer = useCallback(() => {
		if (timerRef.current) clearInterval(timerRef.current);
		timerRef.current = setInterval(() => {
			setElapsedTime((prev) => {
				if (prev >= maxTime) {
					if (timerRef.current) clearInterval(timerRef.current);
					onFinish?.({ correctAnswers, elapsedTime: prev });
					return prev;
				}
				return prev + 1;
			});
		}, 1000);
	}, [maxTime, onFinish, correctAnswers]);

	const stopTimer = useCallback(() => {
		if (timerRef.current) {
			clearInterval(timerRef.current);
			timerRef.current = null;
		}
	}, []);

	const handleStart = useCallback(() => {
		setIsRunning(true);
		setCurrentQuestionIndex(0);
		setSelectedAnswer(null);
		setShowFeedback(false);
		setCorrectAnswers(0);
		setElapsedTime(0);
		startTimer();
	}, [startTimer]);

	const handleStartWithSubject = useCallback(
		(subject: string) => {
			setSelectedSubject(subject);
			setSessionStarted(true);
		},
		[],
	);

	const handleSelectSubject = useCallback((subject: string) => {
		setSelectedSubject(subject);
	}, []);

	const handleStop = useCallback(() => {
		setIsRunning(false);
		stopTimer();
		onFinish?.({ correctAnswers, elapsedTime });
	}, [stopTimer, onFinish, correctAnswers, elapsedTime]);

	const handleRestart = useCallback(() => {
		setPoints(Math.floor(Math.random() * 101));
		setCurrentQuestionIndex(0);
		setSelectedAnswer(null);
		setShowFeedback(false);
		setCorrectAnswers(0);
		setElapsedTime(0);
		setIsRunning(true);
		startTimer();
	}, [startTimer]);

	const reset = useCallback(() => {
		setIsRunning(false);
		setElapsedTime(0);
		setCurrentQuestionIndex(0);
		setSelectedAnswer(null);
		setShowFeedback(false);
		setCorrectAnswers(0);
		stopTimer();
	}, [stopTimer]);

	const handleSelectAnswer = useCallback(
		(optionId: string) => {
			if (showFeedback) return;
			setSelectedAnswer(optionId);
		},
		[showFeedback],
	);

	const handleAnswer = useCallback(
		(_optionId: string, isCorrect: boolean) => {
			setShowFeedback(true);
			if (isCorrect) {
				setCorrectAnswers((prev) => prev + 1);
			}
		},
		[],
	);

	const handleNext = useCallback(() => {
		if (currentQuestionIndex < questionsToUse.length - 1) {
			setCurrentQuestionIndex((prev) => prev + 1);
			setSelectedAnswer(null);
			setShowFeedback(false);
		} else {
			handleStop();
		}
	}, [currentQuestionIndex, questionsToUse.length, handleStop]);

	const handlePrevious = useCallback(() => {
		if (currentQuestionIndex > 0) {
			setCurrentQuestionIndex((prev) => prev - 1);
			setSelectedAnswer(null);
			setShowFeedback(false);
		}
	}, [currentQuestionIndex]);

	const handleSkip = useCallback(() => {
		if (currentQuestionIndex < questionsToUse.length - 1) {
			setCurrentQuestionIndex((prev) => prev + 1);
			setSelectedAnswer(null);
			setShowFeedback(false);
		} else {
			handleStop();
		}
	}, [currentQuestionIndex, questionsToUse.length, handleStop]);

	const currentQuestion = questionsToUse[currentQuestionIndex];

	const state: QuizSessionState = {
		isRunning,
		elapsedTime,
		currentQuestionIndex,
		selectedAnswer,
		showFeedback,
		correctAnswers,
		totalQuestions: questionsToUse.length || questionCount,
	};

	const actions: UseQuizSessionActions = {
		handleStart,
		handleStartWithSubject,
		handleSelectSubject,
		handleStop,
		handleRestart,
		handleSelectAnswer,
		handleAnswer,
		handleNext,
		handlePrevious,
		handleSkip,
		reset,
	};

	return {
		state: {
			...state,
			questions: questionsToUse,
			currentQuestion,
			isLoading,
			hasSubject: selectedSubject !== "",
			selectedSubject,
			points,
		},
		actions,
	};
}
