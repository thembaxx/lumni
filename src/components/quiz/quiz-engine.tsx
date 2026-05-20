"use client";

import { RadialIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, m } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Anim } from "@/components/shared/anim";
import { ProgressDots } from "@/components/shared/progress-dots";
import { Card } from "@/components/ui/card";
import { AssessmentHeader } from "@/components/ui/headers/assessment-header";
import { useQuestionEngine } from "@/hooks/use-question-engine";
import { useQuizSession } from "@/lib/quiz-session";
import { iOSEase } from "@/lib/utils/animation";
import { AnimatedIcon } from "@/lib/utils/icon-mapping";
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

	const { state, actions } = useQuizSession(questions ?? []);

	const prevStarted = useRef(false);
	useEffect(() => {
		if (questions.length > 0 && !prevStarted.current) {
			actions.start();
			prevStarted.current = true;
		}
	}, [questions.length, actions]);

	const handleNext = useCallback(() => {
		actions.next();
	}, [actions]);

	const handlePrevious = useCallback(() => {
		actions.previous();
	}, [actions]);

	const handleSkip = useCallback(() => {
		actions.next();
	}, [actions]);

	const handleQuit = useCallback(() => {
		onComplete?.(
			buildResults(
				state.totalQuestions,
				state.correctAnswers,
				state.elapsedTime,
				incorrectAnswers,
			),
		);
	}, [
		state.totalQuestions,
		state.correctAnswers,
		state.elapsedTime,
		incorrectAnswers,
		onComplete,
	]);

	if (isLoading) {
		return (
			<div className="grid grid-cols-12 gap-0">
				<div className="col-span-12 col-start-1 flex items-center justify-center p-4 pb-20 md:col-span-7">
					<Card className="flex w-full max-w-md flex-col items-center gap-4 p-6">
						<m.div
							animate={{ rotate: 360 }}
							transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
							className="mx-auto size-8"
						>
							<HugeiconsIcon
								icon={RadialIcon}
								className="size-8 text-muted-foreground"
							/>
						</m.div>
						<p className="text-muted-foreground text-sm">
							Generating questions…
						</p>
					</Card>
				</div>
				<div className="relative col-span-12 col-start-1 overflow-hidden bg-system-surface/30 md:col-span-5 md:col-start-8">
					<div className="absolute inset-0 bg-gradient-to-br from-[--system-accent]/10 via-transparent to-transparent" />
					<div className="absolute inset-0 flex items-center justify-center p-8">
						<div className="aspect-square h-full w-full max-w-xs animate-float-slow rounded-3xl bg-[--system-accent]/10 blur-2xl" />
					</div>
				</div>
			</div>
		);
	}

	if (isError) {
		return (
			<div className="grid grid-cols-12 gap-0">
				<div className="col-span-12 col-start-1 flex items-center justify-center p-4 pb-20 md:col-span-7">
					<Card className="flex w-full max-w-md flex-col items-center gap-4 p-8">
						<AnimatedIcon name="error-state" className="size-16" />
						<p className="font-medium text-destructive">
							Failed to load questions.
						</p>
					</Card>
				</div>
				<div className="relative col-span-12 col-start-1 overflow-hidden bg-system-surface/30 md:col-span-5 md:col-start-8">
					<div className="absolute inset-0 bg-gradient-to-br from-destructive/5 via-transparent to-transparent" />
					<div className="absolute inset-0 flex items-center justify-center p-8">
						<div className="aspect-square h-full w-full max-w-xs animate-float-slow rounded-3xl bg-destructive/10 blur-2xl" />
					</div>
				</div>
			</div>
		);
	}

	if (!questions?.length) {
		return (
			<div className="grid grid-cols-12 gap-0">
				<div className="col-span-12 col-start-1 flex items-center justify-center p-4 pb-20 md:col-span-7">
					<Card className="flex w-full max-w-md flex-col items-center gap-4 p-8">
						<AnimatedIcon name="empty-search" className="size-16" />
						<p className="text-muted-foreground">
							No questions available for this subject.
						</p>
						<p className="text-sm">Select a subject to start practicing.</p>
					</Card>
				</div>
				<div className="relative col-span-12 col-start-1 overflow-hidden bg-system-surface/30 md:col-span-5 md:col-start-8">
					<div className="absolute inset-0 bg-gradient-to-br from-[--system-accent]/10 via-transparent to-transparent" />
					<div className="absolute inset-0 flex items-center justify-center p-8">
						<div className="aspect-square h-full w-full max-w-xs animate-float-slow rounded-3xl bg-[--system-accent]/10 blur-2xl" />
					</div>
				</div>
			</div>
		);
	}

	if (state.isComplete) {
		return (
			<Anim>
				<AnimatePresence mode="wait" initial={false}>
					<m.div
						key="results"
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.9 }}
						transition={{ duration: 0.4, ease: iOSEase }}
					>
						<QuizResult
							results={buildResults(
								state.totalQuestions,
								state.correctAnswers,
								state.elapsedTime,
								incorrectAnswers,
							)}
							onRestart={() => {
								setIncorrectAnswers([]);
								prevStarted.current = false;
								actions.restart();
							}}
							onClose={handleQuit}
						/>
					</m.div>
				</AnimatePresence>
			</Anim>
		);
	}

	if (!state.currentQuestion) return null;

	return (
		<Anim>
			<div className="flex flex-col gap-4">
				<AssessmentHeader
					title={subjectId}
					elapsedTime={state.elapsedTime}
					currentQuestionIndex={state.questionNumber - 1}
					totalQuestions={state.totalQuestions}
					progressValue={(state.questionNumber / state.totalQuestions) * 100}
					difficulty={
						state.currentQuestion.difficulty.toLowerCase() as
							| "easy"
							| "medium"
							| "hard"
					}
					onQuit={handleQuit}
				/>

				<AnimatePresence mode="wait" initial={false}>
					<m.div
						key={state.currentQuestion.id}
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -20 }}
						transition={{ duration: 0.2, ease: iOSEase }}
					>
						<QuestionCard
							question={state.currentQuestion}
							subject={subjectId}
							questionNumber={state.questionNumber}
							totalQuestions={state.totalQuestions}
							onNext={handleNext}
						/>
					</m.div>
				</AnimatePresence>

				<QuizControls
					currentQuestionIndex={state.questionNumber - 1}
					totalQuestions={state.totalQuestions}
					hasSelected={false}
					showFeedback={false}
					onPrevious={handlePrevious}
					onNext={handleNext}
					onSkip={handleSkip}
					showSkip
				/>

				<ProgressDots
					total={state.totalQuestions}
					currentIndex={state.questionNumber - 1}
					variant="engine"
				/>
			</div>
		</Anim>
	);
}
