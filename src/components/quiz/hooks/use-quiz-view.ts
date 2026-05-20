"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuestionEngine } from "@/hooks/use-question-engine";
import type { BloomLevel, Difficulty } from "@/lib/question-engine/types";
import { useQuizSession } from "@/lib/quiz-session";
import type { QuizViewProps } from "../quiz-view";

export function useQuizView({
	initialSubject,
	topic,
	questionCount = 10,
	maxTime = 90 * 60,
	onQuit,
	onFinish,
}: QuizViewProps) {
	const [selectedSubject, setSelectedSubject] = useState(initialSubject ?? "");
	const [sessionActive, setSessionActive] = useState(false);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [currentAnswered, setCurrentAnswered] = useState(false);
	const [competencyData, setCompetencyData] = useState<{
		topicCompetencyLevel?: "novice" | "developing" | "proficient" | "mastered";
		topicCompetencyScore?: number;
		suggestedBloomLevel?: BloomLevel;
		suggestedDifficulty?: Difficulty;
	}>({});
	const [resolvedTopic, setResolvedTopic] = useState<string | undefined>(topic);
	const prevTopicRef = useRef(topic);

	if (topic !== prevTopicRef.current) {
		prevTopicRef.current = topic;
		setResolvedTopic(topic);
	}

	const hasAutoStarted = useRef(false);

	const engineParams = useMemo(
		() => ({
			subject: selectedSubject.toLowerCase(),
			topic: resolvedTopic,
			count: questionCount,
			questionType: "any" as const,
			...competencyData,
		}),
		[selectedSubject, resolvedTopic, questionCount, competencyData],
	);

	const { questions, isLoading, isError } = useQuestionEngine(engineParams, {
		enabled: sessionActive && !!selectedSubject,
	});

	const { state, actions } = useQuizSession(questions ?? [], { maxTime });

	const currentIndex = state.questionNumber - 1;

	const handleStartWithSubject = useCallback(
		async (subject: string) => {
			setSelectedSubject(subject);

			let loadedCompData: {
				topicCompetencyLevel?:
					| "novice"
					| "developing"
					| "proficient"
					| "mastered";
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
				const competencies =
					await competencyService.getCompetencies(normalizedSubject);

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

				const topicComps = competencies.filter(
					(c) => c.topicId === targetTopic,
				);

				if (topicComps.length > 0) {
					const avgScore =
						topicComps.reduce((s, c) => s + c.score, 0) / topicComps.length;
					const level = computeCompetencyLevel(avgScore);
					loadedCompData = {
						topicCompetencyLevel: level,
						topicCompetencyScore: Math.round(avgScore),
						suggestedBloomLevel: mapCompetencyToBloom(level, avgScore),
						suggestedDifficulty: mapCompetencyToDifficulty(level),
					};
				}

				setResolvedTopic(targetTopic);
			} catch {
				// silent fallback — non-personalized
			}

			setCompetencyData(loadedCompData);
			setSessionActive(true);
			setLoadError(null);
		},
		[topic],
	);

	// Auto-start when a subject is provided via URL params
	useEffect(() => {
		if (initialSubject && !hasAutoStarted.current) {
			hasAutoStarted.current = true;
			handleStartWithSubject(initialSubject);
		}
	}, [initialSubject, handleStartWithSubject]);

	useEffect(() => {
		if (sessionActive && questions.length > 0 && !state.isComplete) {
			actions.start();
		}
	}, [sessionActive, questions.length, state.isComplete, actions]);

	const prevComplete = useRef(state.isComplete);
	useEffect(() => {
		if (state.isComplete && !prevComplete.current) {
			onFinish?.({
				questions: state.questions,
				correctness: state.correctness,
				correctAnswers: state.correctAnswers,
				totalQuestions: state.totalQuestions,
				elapsedTime: state.elapsedTime,
			});
		}
		prevComplete.current = state.isComplete;
	}, [
		state.isComplete,
		state.questions,
		state.correctness,
		state.correctAnswers,
		state.totalQuestions,
		state.elapsedTime,
		onFinish,
	]);

	const handleStop = useCallback(() => {
		setSessionActive(false);
		actions.stop();
		onQuit?.();
	}, [actions, onQuit]);

	const handleRestart = useCallback(() => {
		actions.restart();
		setCurrentAnswered(false);
	}, [actions]);

	const handleNext = useCallback(() => {
		actions.next();
		setCurrentAnswered(false);
	}, [actions]);

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

	// Keyboard handler
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!sessionActive || !state.currentQuestion) return;

			if (
				state.currentQuestion.type === "multiple-choice" &&
				currentAnswered === false
			) {
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
		currentAnswered,
		handlePrevious,
		handleNext,
		handleStop,
		state.isComplete,
	]);

	return {
		selectedSubject,
		sessionActive,
		loadError,
		currentAnswered,
		competencyData,
		resolvedTopic,
		questions,
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
