"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSubjectQuestions } from "@/lib/hooks/use-subject-questions";
import type { QAQuestion } from "@/lib/types/questions";
import {
	type QuizEngineActions,
	type QuizEngineState,
	useQuizEngine,
} from "./use-quiz-engine";

export interface UseQuizSessionOptions {
	subject?: string;
	topic?: string;
	questionCount?: number;
	maxTime?: number;
	onFinish?: (results: { correctAnswers: number; elapsedTime: number }) => void;
	enabled?: boolean;
}

export interface UseQuizSessionActions extends QuizEngineActions {
	handleStartWithSubject: (subject: string) => void;
	handleSelectSubject: (subject: string) => void;
	handleStop: () => void;
	handleRestart: () => void;
}

export interface UseQuizSessionResult {
	state: QuizEngineState & {
		questions: QAQuestion[];
		currentQuestion: QAQuestion | undefined;
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
	const [points, setPoints] = useState(() => Math.floor(Math.random() * 101));

	const normalizedTopic =
		topic ||
		(selectedSubject === "Random" ? "physics" : selectedSubject.toLowerCase());

	const { data: questions, isLoading } = useSubjectQuestions(
		normalizedTopic,
		questionCount,
		{
			enabled: enabled && selectedSubject !== "",
		},
	);

	const questionsToUse = useMemo(() => {
		if (isLoading === false && questions?.length) {
			return questions;
		}
		return [];
	}, [questions, isLoading]);

	const { state: engineState, actions: engineActions } = useQuizEngine({
		maxTime,
		totalQuestions: questionsToUse.length || questionCount,
		onFinish: useCallback(
			(results: { correctAnswers: number; elapsedTime: number }) => {
				setPoints(Math.floor(Math.random() * 101));
				onFinish?.(results);
			},
			[onFinish],
		),
	});

	const handleStartWithSubject = useCallback(
		(subject: string) => {
			setSelectedSubject(subject);
			engineActions.handleStart();
		},
		[engineActions],
	);

	const handleSelectSubject = useCallback((subject: string) => {
		setSelectedSubject(subject);
	}, []);

	const handleStop = useCallback(() => {
		engineActions.handleStop();
	}, [engineActions]);

	const handleRestart = useCallback(() => {
		setPoints(Math.floor(Math.random() * 101));
		engineActions.handleRestart();
	}, [engineActions]);

	const currentQuestion = questionsToUse[engineState.currentQuestionIndex];

	const combinedState = {
		...engineState,
		questions: questionsToUse,
		currentQuestion,
		isLoading,
		hasSubject: selectedSubject !== "",
		selectedSubject,
		points,
		totalQuestions: questionsToUse.length || questionCount,
	};

	const combinedActions = {
		...engineActions,
		handleStartWithSubject,
		handleSelectSubject,
		handleStop,
		handleRestart,
	};

	return {
		state: combinedState,
		actions: combinedActions,
	};
}
