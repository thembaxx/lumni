"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { BloomLevel, Difficulty } from "@/lib/question-engine/types";
import { useQuiz } from "@/lib/quiz";
import type { QuizViewProps } from "../quiz-view";

export function useQuizView({
	initialSubject,
	topic,
	questionCount = 10,
	maxTime = 90 * 60,
	pastPaperMode,
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

	const shared = useQuiz({
		subject: selectedSubject,
		topic: resolvedTopic,
		count: questionCount,
		questionType: "any",
		maxTime,
		enabled: sessionActive && !!selectedSubject,
		pastPaperMode,
		suggestedBloomLevel: competencyData.suggestedBloomLevel,
		suggestedDifficulty: competencyData.suggestedDifficulty,
		topicCompetencyLevel: competencyData.topicCompetencyLevel,
		topicCompetencyScore: competencyData.topicCompetencyScore,
		onComplete: useCallback(
			(result) => {
				if (result.reason === "completed") {
					onFinish?.(result);
				}
			},
			[onFinish],
		),
	});

	const { state, actions } = shared;
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
		if (sessionActive && shared.questions.length > 0 && !state.isComplete) {
			actions.start();
		}
	}, [sessionActive, shared.questions, state.isComplete, actions]);

	const handleStop = useCallback(() => {
		setSessionActive(false);
		shared.handleStop();
		onQuit?.();
	}, [shared, onQuit]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!sessionActive || !state.currentQuestion) return;

			if (
				state.currentQuestion.type === "multiple-choice" &&
				shared.currentAnswered === false
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
						shared.handlePrevious();
					}
					break;
				case "ArrowRight":
					if (currentIndex < state.totalQuestions - 1) {
						e.preventDefault();
						shared.handleNext();
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
		shared.currentAnswered,
		shared.handlePrevious,
		shared.handleNext,
		handleStop,
		state.isComplete,
	]);

	return {
		selectedSubject,
		sessionActive,
		loadError,
		currentAnswered: shared.currentAnswered,
		competencyData,
		resolvedTopic,
		questions: shared.questions,
		sources: shared.sources,
		isLoading: shared.isLoading,
		isError: shared.isError,
		state,
		currentIndex,
		handleStartWithSubject,
		handleStop,
		handleRestart: shared.handleRestart,
		handleNext: shared.handleNext,
		handlePrevious: shared.handlePrevious,
		handleSkip: shared.handleSkip,
		handleAnswered: shared.handleAnswered,
		setLoadError,
	};
}
