"use client";

import {
	CircleNotch,
	MagnifyingGlass,
	WarningCircle,
} from "@phosphor-icons/react";
import { AnimatePresence, m, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Anim } from "@/components/shared/anim";
import { ProgressDots } from "@/components/shared/progress-dots";
import { Card, CardContent } from "@/components/ui/card";
import { AssessmentHeader } from "@/components/ui/headers/assessment-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuestionEngine } from "@/hooks/use-question-engine";
import type { Question } from "@/lib/question-engine/types";
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

	// Internal quiz state
	const [currentIndex, setCurrentIndex] = useState(0);
	const [correctAnswers, setCorrectAnswers] = useState(0);
	const [elapsedTime, setElapsedTime] = useState(0);
	const [isComplete, setIsComplete] = useState(false);
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		if (questions.length > 0) {
			timerRef.current = setInterval(() => {
				setElapsedTime((prev) => {
					if (prev >= 90 * 60) {
						if (timerRef.current) clearInterval(timerRef.current);
						return prev;
					}
					return prev + 1;
				});
			}, 1000);
		}
		return () => {
			if (timerRef.current) clearInterval(timerRef.current);
		};
	}, [questions.length]);

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
			<div className="grid grid-cols-12 gap-0">
				<div className="col-span-12 md:col-span-7 col-start-1 flex items-center justify-center p-4 pb-20">
					<Card className="max-w-md w-full p-6 flex flex-col items-center gap-4">
						<motion.div
							animate={{ rotate: 360 }}
							transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
							className="h-8 w-8 mx-auto"
						>
							<CircleNotch className="size-8 text-muted-foreground" />
						</motion.div>
						<p className="text-sm text-muted-foreground">
							Generating questions...
						</p>
					</Card>
				</div>
				<div className="col-span-12 md:col-span-5 col-start-1 md:col-start-8 relative overflow-hidden bg-system-surface/30">
					<div className="absolute inset-0 bg-gradient-to-br from-[--system-accent]/10 via-transparent to-transparent" />
					<div className="absolute inset-0 flex items-center justify-center p-8">
						<div className="w-full h-full max-w-xs aspect-square rounded-3xl bg-[--system-accent]/10 blur-2xl animate-float-slow" />
					</div>
				</div>
			</div>
		);
	}

	if (isError) {
		return (
			<div className="grid grid-cols-12 gap-0">
				<div className="col-span-12 md:col-span-7 col-start-1 flex items-center justify-center p-4 pb-20">
					<Card className="max-w-md w-full p-8 flex flex-col items-center gap-4">
						<AnimatedIcon name="error-state" className="size-16" />
						<p className="text-destructive font-medium">
							Failed to load questions.
						</p>
					</Card>
				</div>
				<div className="col-span-12 md:col-span-5 col-start-1 md:col-start-8 relative overflow-hidden bg-system-surface/30">
					<div className="absolute inset-0 bg-gradient-to-br from-destructive/5 via-transparent to-transparent" />
					<div className="absolute inset-0 flex items-center justify-center p-8">
						<div className="w-full h-full max-w-xs aspect-square rounded-3xl bg-destructive/10 blur-2xl animate-float-slow" />
					</div>
				</div>
			</div>
		);
	}

	if (!questions?.length) {
		return (
			<div className="grid grid-cols-12 gap-0">
				<div className="col-span-12 md:col-span-7 col-start-1 flex items-center justify-center p-4 pb-20">
					<Card className="max-w-md w-full p-8 flex flex-col items-center gap-4">
						<AnimatedIcon name="empty-search" className="size-16" />
						<p className="text-muted-foreground">
							No questions available for this subject.
						</p>
						<p className="text-sm">Select a subject to start practicing.</p>
					</Card>
				</div>
				<div className="col-span-12 md:col-span-5 col-start-1 md:col-start-8 relative overflow-hidden bg-system-surface/30">
					<div className="absolute inset-0 bg-gradient-to-br from-[--system-accent]/10 via-transparent to-transparent" />
					<div className="absolute inset-0 flex items-center justify-center p-8">
						<div className="w-full h-full max-w-xs aspect-square rounded-3xl bg-[--system-accent]/10 blur-2xl animate-float-slow" />
					</div>
				</div>
			</div>
		);
	}

	if (isComplete) {
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
						/>
					</m.div>
				</AnimatePresence>
			</Anim>
		);
	}

	if (!currentQuestion) return null;

	return (
		<Anim>
			<div className="flex flex-col gap-4">
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
						transition={{ duration: 0.2, ease: iOSEase }}
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
		</Anim>
	);
}
