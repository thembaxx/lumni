"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuestionEngine } from "@/hooks/use-question-engine";
import { useQuizSession } from "@/lib/quiz-session";
import type { UseQuizParams } from "./types";

export function useQuiz(params: UseQuizParams) {
	const {
		subject,
		topic,
		count = 10,
		questionType = "any",
		maxTime,
		autoStart = false,
		enabled = true,
		pastPaperMode,
		suggestedBloomLevel,
		suggestedDifficulty,
		topicCompetencyLevel,
		topicCompetencyScore,
		onComplete,
	} = params;

	const engineParams = useMemo(
		() => ({
			subject: subject.toLowerCase(),
			topic,
			count,
			questionType: questionType as "any",
			...(pastPaperMode ? { pastPaperMode: true } : {}),
			...(suggestedBloomLevel ? { suggestedBloomLevel } : {}),
			...(suggestedDifficulty ? { suggestedDifficulty } : {}),
			...(topicCompetencyLevel ? { topicCompetencyLevel } : {}),
			...(topicCompetencyScore !== undefined ? { topicCompetencyScore } : {}),
		}),
		[
			subject,
			topic,
			count,
			questionType,
			pastPaperMode,
			suggestedBloomLevel,
			suggestedDifficulty,
			topicCompetencyLevel,
			topicCompetencyScore,
		],
	);

	const { questions, sources, isLoading, isError } = useQuestionEngine(
		engineParams,
		{ enabled: enabled && !!subject },
	);

	const { state, actions } = useQuizSession(questions ?? [], { maxTime });

	const [currentAnswered, setCurrentAnswered] = useState(false);

	useEffect(() => {
		if (autoStart && questions.length > 0 && !state.isComplete) {
			actions.start();
		}
	}, [autoStart, questions, state.isComplete, actions]);

	const stateRef = useRef(state);
	stateRef.current = state;

	const handleNext = useCallback(() => {
		const s = stateRef.current;
		const wasLast = s.questionNumber - 1 >= s.totalQuestions - 1;
		actions.next();
		setCurrentAnswered(false);
		if (wasLast) {
			onComplete?.({
				reason: "completed",
				questions: s.questions,
				correctness: s.correctness,
				correctAnswers: s.correctAnswers,
				totalQuestions: s.totalQuestions,
				elapsedTime: s.elapsedTime,
			});
		}
	}, [actions, onComplete]);

	const handlePrevious = useCallback(() => {
		actions.previous();
		setCurrentAnswered(false);
	}, [actions]);

	const handleSkip = useCallback(() => {
		handleNext();
	}, [handleNext]);

	const handleAnswered = useCallback(
		(correct: boolean) => {
			setCurrentAnswered(true);
			actions.recordAnswer(correct);
		},
		[actions],
	);

	const handleStop = useCallback(() => {
		const s = stateRef.current;
		actions.stop();
		onComplete?.({
			reason: "quit",
			questions: s.questions,
			correctness: s.correctness,
			correctAnswers: s.correctAnswers,
			totalQuestions: s.totalQuestions,
			elapsedTime: s.elapsedTime,
		});
	}, [actions, onComplete]);

	const handleRestart = useCallback(() => {
		actions.restart();
		setCurrentAnswered(false);
	}, [actions]);

	return {
		questions,
		sources,
		isLoading,
		isError,
		state,
		actions,
		currentAnswered,
		handleNext,
		handlePrevious,
		handleSkip,
		handleAnswered,
		handleStop,
		handleRestart,
	};
}
