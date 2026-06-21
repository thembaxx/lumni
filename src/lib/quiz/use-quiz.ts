"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useQuestionEngine } from "@/hooks/use-question-engine";
import { flashcardEngine } from "@/lib/flashcard-engine";
import type { Question, UserAnswer } from "@/lib/question-engine/types";
import { useQuizSession } from "@/lib/quiz-session";
import { logError } from "@/lib/shared/logger";
import type { UseQuizParams } from "./types";

function getCorrectAnswerText(q: Question): string {
	if (q.type === "multiple-choice") {
		const body = q.body as {
			options?: { id: string; text: string; isCorrect: boolean }[];
		};
		const correct = body?.options?.find((o) => o.isCorrect);
		return correct?.text ?? "";
	}
	if (q.type === "short-answer") {
		const body = q.body as {
			modelAnswer?: string;
			acceptableAnswers?: string[];
		};
		return body?.modelAnswer ?? body?.acceptableAnswers?.[0] ?? "";
	}
	if (q.type === "calculation") {
		const body = q.body as { correctValue?: number; unit?: string };
		return `${body?.correctValue ?? ""} ${body?.unit ?? ""}`.trim();
	}
	return q.explanation?.split(".")[0] ?? "";
}

export function useQuiz(params: UseQuizParams) {
	const {
		subject,
		topic,
		count = 10,
		questionType = "any",
		maxTime,
		enabled = true,
		pastPaperMode,
		preloadedQuestions,
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

	const usePreloaded = Boolean(
		preloadedQuestions && preloadedQuestions.length > 0,
	);

	const engineResult = useQuestionEngine(engineParams, {
		enabled: enabled && !!subject && !usePreloaded,
	});

	const questions = usePreloaded
		? (preloadedQuestions as Question[])
		: engineResult.questions;
	const sources = usePreloaded ? [] : engineResult.sources;
	const isLoading = usePreloaded ? false : engineResult.isLoading;
	const isError = usePreloaded ? false : engineResult.isError;

	const { state, actions } = useQuizSession(questions ?? [], { maxTime });

	const [currentAnswered, setCurrentAnswered] = useState(false);

	const stateRef = useRef(state);
	stateRef.current = state;

	const createFlashcardsForWrongAnswers = useCallback(
		(s: typeof state) => {
			const wrongIndices: number[] = [];
			for (let i = 0; i < s.correctness.length; i++) {
				if (!s.correctness[i]) wrongIndices.push(i);
			}
			if (wrongIndices.length === 0) return;
			Promise.all(
				wrongIndices.map(async (i) => {
					const q = s.questions[i];
					if (!q) return;
					try {
						await flashcardEngine.create(
							q.questionText,
							getCorrectAnswerText(q) || "Review this topic",
							params.subject,
						);
					} catch (err) {
						logError("CreateFlashcardFromQuiz", err);
					}
				}),
			);
		},
		[params.subject],
	);

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
			createFlashcardsForWrongAnswers(s);
		}
	}, [actions, onComplete, createFlashcardsForWrongAnswers]);

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
