"use client";

import { AnimatePresence, domAnimation, LazyMotion, m } from "framer-motion";
import { useCallback, useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubjectQuestions } from "@/hooks/use-subject-questions";
import { useQuizEngine } from "@/hooks/use-quiz-engine";
import { QuizControls } from "./quiz-controls";
import { QuestionCard } from "./question-card";
import { QuizEngineHeader } from "./quiz-engine-header";
import { QuizResult } from "./quiz-result";
import { ProgressDots } from "@/components/shared/progress-dots";

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

	const {
		data: questions,
		isLoading,
		isFetching,
	} = useSubjectQuestions(subjectId, 10);

	const { state: engineState, actions: engineActions } = useQuizEngine({
		maxTime: 90 * 60,
		totalQuestions: questions?.length ?? 0,
		onFinish: useCallback(
			({
				correctAnswers,
				elapsedTime,
			}: {
				correctAnswers: number;
				elapsedTime: number;
			}) => {
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
			},
			[onComplete, questions, incorrectAnswers],
		),
		enabled: (questions?.length ?? 0) > 0,
	});

	const currentQuestion = questions?.[engineState.currentQuestionIndex];

	function handleAnswer(optionId: string, isCorrect: boolean) {
		engineActions.handleAnswer(optionId, isCorrect);

		// Celebrations are handled inside QuestionCard.
		// Track incorrect answers for final results display.
		if (!isCorrect && currentQuestion) {
			const selectedOpt = currentQuestion.options.find(
				(o) => o.id === optionId,
			);
			const correctOpt = currentQuestion.options.find(
				(o) => o.isCorrect,
			);
			setIncorrectAnswers((prev) => [
				...prev,
				{
					questionId: currentQuestion.id,
					selectedAnswer: selectedOpt?.text ?? optionId,
					correctAnswer: correctOpt?.text ?? "",
				},
			]);
		}
	}

	function handleQuit() {
		engineActions.handleStop();
		if (questions) {
			onComplete?.(
				buildResults(
					questions.length,
					engineState.correctAnswers,
					engineState.elapsedTime,
					incorrectAnswers,
				),
			);
		}
	}

	if (isLoading || isFetching) {
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

	// Quiz complete - show final results
	if (engineState.currentQuestionIndex >= questions.length) {
		return (
			<LazyMotion features={domAnimation}>
				<AnimatePresence mode="wait">
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
								engineState.correctAnswers,
								engineState.elapsedTime,
								incorrectAnswers,
							)}
							onRestart={() => {
								setIncorrectAnswers([]);
								engineActions.handleRestart();
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
				{/* Header - extracted into QuizEngineHeader */}
				<QuizEngineHeader
					elapsedTime={engineState.elapsedTime}
					currentQuestionIndex={engineState.currentQuestionIndex}
					totalQuestions={questions.length}
					difficulty={
						currentQuestion.difficulty.toLowerCase() as
							| "easy"
							| "medium"
							| "hard"
					}
					onQuit={handleQuit}
				/>

				{/* Question card - owns celebration, step-by-step, and diagram */}
				<AnimatePresence mode="wait">
					<m.div
						key={currentQuestion.id}
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -20 }}
						transition={{ duration: 0.2 }}
					>
						<QuestionCard
							question={currentQuestion}
							questionNumber={engineState.currentQuestionIndex + 1}
							totalQuestions={questions.length}
							selectedAnswer={engineState.selectedAnswer}
							showFeedback={engineState.showFeedback}
							onSelectAnswer={engineActions.handleSelectAnswer}
							onAnswer={handleAnswer}
						/>
					</m.div>
				</AnimatePresence>

				{/* Navigation controls */}
				<QuizControls
					currentQuestionIndex={engineState.currentQuestionIndex}
					totalQuestions={questions.length}
					hasSelected={!!engineState.selectedAnswer}
					showFeedback={engineState.showFeedback}
					onPrevious={engineActions.handlePrevious}
					onNext={engineActions.handleNext}
					onSkip={engineActions.handleSkip}
					showSkip
				/>

				{/* Progress */}
				<ProgressDots
					total={questions.length}
					currentIndex={engineState.currentQuestionIndex}
					variant="engine"
				/>
			</div>
		</LazyMotion>
	);
}
