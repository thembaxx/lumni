"use client";

import { AnimatePresence, domAnimation, LazyMotion, m } from "framer-motion";
import { useCallback, useMemo, useState } from "react";
import { ProgressDots } from "@/components/shared/progress-dots";
import { Card } from "@/components/ui/card";
import { AssessmentHeader } from "@/components/ui/headers/assessment-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuestionEngine } from "@/hooks/use-question-engine";
import type { Question } from "@/types/questions";
import { QuestionCard } from "./question-card";
import { QuizControls } from "./quiz-controls";
import { QuizResult } from "./quiz-result";

interface QuizEngineProps {
	subjectId: string;
	onComplete?: (results: QuizResults) => void;
}

export interface QuizResults {
	totalQuestions: number;
	correctAnswers: number;
	accuracy: number;
	elapsedTime: number;
	incorrectAnswers: {
		questionId: string;
		selectedAnswer: string;
		correctAnswer: string;
	}[];
}

function buildResults(
	total: number,
	correct: number,
	elapsedTime: number,
	incorrect: QuizResults["incorrectAnswers"],
): QuizResults {
	return {
		totalQuestions: total,
		correctAnswers: correct,
		accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
		elapsedTime,
		incorrectAnswers: incorrect,
	};
}

export function QuizEngine({ subjectId, onComplete }: QuizEngineProps) {
	const [incorrectAnswers, setIncorrectAnswers] = useState<
		QuizResults["incorrectAnswers"]
	>([]);

	const engineParams = useMemo(
		() => ({
			subject: subjectId,
			count: 10,
			questionType: "multiple-choice" as const,
		}),
		[subjectId],
	);

	const { questions, isLoading, isError } = useQuestionEngine(engineParams, {
		enabled: true,
	});

	// Internal quiz state
	const [currentIndex, setCurrentIndex] = useState(0);
	const [correctAnswers, setCorrectAnswers] = useState(0);
	const [elapsedTime, setElapsedTime] = useState(0);
	const [isComplete, setIsComplete] = useState(false);
	const [timerStarted, setTimerStarted] = useState(false);

	// Start timer on first render
	if (!timerStarted && questions.length > 0) {
		setTimerStarted(true);
		const interval = setInterval(() => {
			setElapsedTime((prev) => {
				if (prev >= 90 * 60) {
					clearInterval(interval);
					return prev;
				}
				return prev + 1;
			});
		}, 1000);
	}

	const currentQuestion = questions?.[currentIndex];

	const handleNext = useCallback(() => {
		if (currentIndex < questions.length - 1) {
			setCurrentIndex((prev) => prev + 1);
		} else {
			setIsComplete(true);
		}
	}, [currentIndex, questions.length]);

	const handlePrevious = useCallback(() => {
		if (currentIndex > 0) {
			setCurrentIndex((prev) => prev - 1);
		}
	}, [currentIndex]);

	const handleSkip = useCallback(() => {
		if (currentIndex < questions.length - 1) {
			setCurrentIndex((prev) => prev + 1);
		} else {
			setIsComplete(true);
		}
	}, [currentIndex, questions.length]);

	const handleRestart = () => {
		setCurrentIndex(0);
		setCorrectAnswers(0);
		setElapsedTime(0);
		setIsComplete(false);
		setIncorrectAnswers([]);
	};

	const handleQuit = useCallback(() => {
		if (questions) {
			onComplete?.(
				buildResults(
					questions.length,
					correctAnswers,
					elapsedTime,
					incorrectAnswers,
				),
			);
		}
	}, [questions, correctAnswers, elapsedTime, incorrectAnswers, onComplete]);

	if (isLoading) {
		return (
			<Card className="p-6 space-y-4">
				<div className="flex items-center justify-between">
					<Skeleton className="h-5 w-32" />
					<Skeleton className="h-5 w-16" />
				</div>
				<Skeleton className="h-6 w-full" />
				<Skeleton className="h-24 w-full rounded-lg" />
				<div className="space-y-2">
					{[1, 2, 3, 4].map((i) => (
						<Skeleton key={i} className="h-12 w-full rounded-lg" />
					))}
				</div>
			</Card>
		);
	}

	if (isError) {
		return (
			<Card className="p-8 flex flex-col items-center justify-center gap-4">
				<p className="text-destructive">Failed to load questions.</p>
			</Card>
		);
	}

	if (!questions?.length) {
		return (
			<Card className="p-8 flex flex-col items-center justify-center gap-4">
				<p className="text-muted-foreground">
					No questions available for this subject.
				</p>
				<p className="text-sm">Select a subject to start practicing.</p>
			</Card>
		);
	}

	if (isComplete) {
		return (
			<LazyMotion features={domAnimation}>
				<AnimatePresence mode="wait" initial={false}>
					<m.div
						key="results"
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.9 }}
						transition={{ duration: 0.4 }}
					>
						<QuizResult
							results={buildResults(
								questions.length,
								correctAnswers,
								elapsedTime,
								incorrectAnswers,
							)}
							onRestart={() => {
								setIncorrectAnswers([]);
								handleRestart();
							}}
							onClose={handleQuit}
							useLottie={false}
						/>
					</m.div>
				</AnimatePresence>
			</LazyMotion>
		);
	}

	if (!currentQuestion) return null;

	return (
		<LazyMotion features={domAnimation}>
			<div className="space-y-4">
				<AssessmentHeader
					title={subjectId}
					elapsedTime={elapsedTime}
					currentQuestionIndex={currentIndex}
					totalQuestions={questions.length}
					progressValue={((currentIndex + 1) / questions.length) * 100}
					difficulty={
						currentQuestion.difficulty.toLowerCase() as
							| "easy"
							| "medium"
							| "hard"
					}
					onQuit={handleQuit}
				/>

				<AnimatePresence mode="wait" initial={false}>
					<m.div
						key={currentQuestion.id}
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -20 }}
						transition={{ duration: 0.2 }}
					>
						<QuestionCard
							question={currentQuestion}
							subject={subjectId}
							questionNumber={currentIndex + 1}
							totalQuestions={questions.length}
							onNext={handleNext}
						/>
					</m.div>
				</AnimatePresence>

				<QuizControls
					currentQuestionIndex={currentIndex}
					totalQuestions={questions.length}
					hasSelected={false}
					showFeedback={false}
					onPrevious={handlePrevious}
					onNext={handleNext}
					onSkip={handleSkip}
					showSkip
				/>

				<ProgressDots
					total={questions.length}
					currentIndex={currentIndex}
					variant="engine"
				/>
			</div>
		</LazyMotion>
	);
}
