"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { Question } from "@/lib/question-engine/types";
import { useInterval } from "./use-interval";
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
	correctAnswers: number;
	totalQuestions: number;
}

export interface UseQuizSessionActions {
	handleStart: () => void;
	handleStartWithSubject: (subject: string) => void;
	handleStop: () => void;
	handleRestart: () => void;
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
	const [selectedSubject, setSelectedSubject] =
		useState<string>(initialSubject);
	const [points, setPoints] = useState(0);
	const [sessionStarted, setSessionStarted] = useState(false);

	const normalizedSubject = initialSubject || selectedSubject.toLowerCase();

	const engineParams = useMemo(
		() => ({
			subject: normalizedSubject,
			topic,
			count: questionCount,
			questionType: "any" as const,
		}),
		[normalizedSubject, topic, questionCount],
	);

	const { questions: loadedQuestions, isLoading } = useQuestionEngine(
		engineParams,
		{ enabled: enabled && sessionStarted && selectedSubject !== "" },
	);

	const questionsToUse = loadedQuestions ?? [];

	const [isRunning, setIsRunning] = useState(false);
	const [elapsedTime, setElapsedTime] = useState(0);
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [correctAnswers, setCorrectAnswers] = useState(0);
	const correctAnswersRef = useRef(correctAnswers);
	correctAnswersRef.current = correctAnswers;

	useInterval(
		() => {
			setElapsedTime((prev) => {
				if (prev >= maxTime) {
					onFinish?.({
						correctAnswers: correctAnswersRef.current,
						elapsedTime: prev,
					});
					return prev;
				}
				return prev + 1;
			});
		},
		isRunning ? 1000 : null,
	);

	const handleStart = useCallback(() => {
		setIsRunning(true);
		setCurrentQuestionIndex(0);
		setCorrectAnswers(0);
		setElapsedTime(0);
	}, []);

	const handleStartWithSubject = useCallback((subject: string) => {
		setSelectedSubject(subject);
		setSessionStarted(true);
	}, []);

	const handleStop = useCallback(() => {
		setIsRunning(false);
		onFinish?.({ correctAnswers, elapsedTime });
	}, [onFinish, correctAnswers, elapsedTime]);

	const handleRestart = useCallback(() => {
		setPoints(0);
		setCurrentQuestionIndex(0);
		setCorrectAnswers(0);
		setElapsedTime(0);
		setIsRunning(true);
	}, []);

	const reset = useCallback(() => {
		setIsRunning(false);
		setElapsedTime(0);
		setCurrentQuestionIndex(0);
		setCorrectAnswers(0);
	}, []);

	const handleNext = useCallback(() => {
		if (currentQuestionIndex < questionsToUse.length - 1) {
			setCurrentQuestionIndex((prev) => prev + 1);
		} else {
			handleStop();
		}
	}, [currentQuestionIndex, questionsToUse.length, handleStop]);

	const handlePrevious = useCallback(() => {
		if (currentQuestionIndex > 0) {
			setCurrentQuestionIndex((prev) => prev - 1);
		}
	}, [currentQuestionIndex]);

	const handleSkip = useCallback(() => {
		handleNext();
	}, [handleNext]);

	const currentQuestion = questionsToUse[currentQuestionIndex];

	const state: QuizSessionState = {
		isRunning,
		elapsedTime,
		currentQuestionIndex,
		correctAnswers,
		totalQuestions: questionsToUse.length || questionCount,
	};

	const actions: UseQuizSessionActions = {
		handleStart,
		handleStartWithSubject,
		handleStop,
		handleRestart,
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
