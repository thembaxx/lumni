"use client";

import { CircleNotch } from "@phosphor-icons/react";
import { m } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	EmptyStateWithIllustration,
	QuestionCard,
	QuizControls,
	QuizEmptyState,
	QuizResultsCard,
	QuizSelectSubject,
	QuizSubjectPrompt,
} from "@/components/quiz";
import { ProgressDots } from "@/components/shared/progress-dots";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AssessmentHeader } from "@/components/ui/headers/assessment-header";
import { useQuestionEngine } from "@/hooks/use-question-engine";
import type { Question } from "@/lib/question-engine/types";

export interface QuizResults {
	questions: Question[];
	correctness: boolean[];
	correctAnswers: number;
	totalQuestions: number;
	elapsedTime: number;
}

export type QuizViewVariant = "full" | "compact";

export interface QuizViewProps {
	variant?: QuizViewVariant;
	initialSubject?: string;
	topic?: string;
	questionCount?: number;
	maxTime?: number;
	onQuit?: () => void;
	onFinish?: (results: QuizResults) => void;
	className?: string;
}

export function QuizView({
	variant = "full",
	initialSubject,
	topic,
	questionCount = 10,
	maxTime = 90 * 60,
	onQuit,
	onFinish,
	className,
}: QuizViewProps) {
	const [selectedSubject, setSelectedSubject] = useState(initialSubject ?? "");
	const [sessionActive, setSessionActive] = useState(false);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [correctAnswers, setCorrectAnswers] = useState(0);
	const [correctness, setCorrectness] = useState<boolean[]>([]);
	const [currentAnswered, setCurrentAnswered] = useState(false);
	const [elapsedTime, setElapsedTime] = useState(0);
	const [isComplete, setIsComplete] = useState(false);
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const _quizContainerRef = useRef<HTMLDivElement>(null);

	const engineParams = useMemo(
		() => ({
			subject: selectedSubject.toLowerCase(),
			topic,
			count: questionCount,
			questionType: "any" as const,
		}),
		[selectedSubject, topic, questionCount],
	);

	const { questions, isLoading, isError } = useQuestionEngine(engineParams, {
		enabled: sessionActive && !!selectedSubject,
	});

	const currentQuestion = questions?.[currentIndex] ?? null;
	const totalQuestions = questions?.length ?? questionCount;

	const handleStartWithSubject = useCallback((subject: string) => {
		setSelectedSubject(subject);
		setSessionActive(true);
		setCurrentIndex(0);
		setCorrectAnswers(0);
		setCorrectness([]);
		setCurrentAnswered(false);
		setElapsedTime(0);
		setIsComplete(false);
		setLoadError(null);
	}, []);

	const buildResults = useCallback(
		(correct: number, time: number) => {
			const result: QuizResults = {
				questions: questions ?? [],
				correctness,
				correctAnswers: correct,
				totalQuestions: questions?.length ?? 0,
				elapsedTime: time,
			};
			return result;
		},
		[questions, correctness],
	);

	const handleStop = useCallback(() => {
		setSessionActive(false);
		if (timerRef.current) clearInterval(timerRef.current);
		onFinish?.(buildResults(correctAnswers, elapsedTime));
	}, [onFinish, correctAnswers, elapsedTime, buildResults]);

	const handleRestart = useCallback(() => {
		setCurrentIndex(0);
		setCorrectAnswers(0);
		setCorrectness([]);
		setElapsedTime(0);
		setIsComplete(false);
	}, []);

	const handleNext = useCallback(() => {
		if (currentIndex < totalQuestions - 1) {
			setCurrentIndex((prev) => prev + 1);
			setCurrentAnswered(false);
		} else {
			setIsComplete(true);
			if (timerRef.current) clearInterval(timerRef.current);
			onFinish?.(buildResults(correctAnswers, elapsedTime));
		}
	}, [
		currentIndex,
		totalQuestions,
		onFinish,
		correctAnswers,
		elapsedTime,
		buildResults,
	]);

	const handlePrevious = useCallback(() => {
		if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
		setCurrentAnswered(false);
	}, [currentIndex]);

	const handleSkip = useCallback(() => {
		handleNext();
	}, [handleNext]);

	const handleAnswered = useCallback((correct: boolean) => {
		setCurrentAnswered(true);
		setCorrectness((prev) => [...prev, correct]);
		if (correct) setCorrectAnswers((prev) => prev + 1);
	}, []);

	useEffect(() => {
		if (sessionActive && questions.length > 0) {
			if (timerRef.current) clearInterval(timerRef.current);
			timerRef.current = setInterval(() => {
				setElapsedTime((prev) => {
					if (prev >= maxTime) {
						if (timerRef.current) clearInterval(timerRef.current);
						setIsComplete(true);
						return prev;
					}
					return prev + 1;
				});
			}, 1000);
		}
		return () => {
			if (timerRef.current) clearInterval(timerRef.current);
		};
	}, [sessionActive, questions.length, maxTime]);

	// Handle keyboard navigation for quiz controls
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!sessionActive || !currentQuestion) return;

			// Handle arrow keys for multiple choice
			if (
				currentQuestion.type === "multiple-choice" &&
				currentAnswered === false
			) {
				switch (e.key) {
					case "ArrowLeft":
					case "ArrowUp":
						e.preventDefault();
						// Focus previous option - would need refs to options
						break;
					case "ArrowRight":
					case "ArrowDown":
						e.preventDefault();
						// Focus next option - would need refs to options
						break;
					case "Enter":
					case " ":
						e.preventDefault();
						// Trigger answer submission - would need to find selected option
						break;
				}
			}

			// Handle quiz navigation
			switch (e.key) {
				case "ArrowLeft":
					if (currentIndex > 0) {
						e.preventDefault();
						handlePrevious();
					}
					break;
				case "ArrowRight":
					if (currentIndex < totalQuestions - 1) {
						e.preventDefault();
						handleNext();
					}
					break;
				case "Escape":
					if (isComplete) {
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
		currentQuestion,
		currentIndex,
		totalQuestions,
		currentAnswered,
		handlePrevious,
		handleNext,
		handleStop,
		isComplete,
	]);

	if (loadError) {
		return (
			<div className="min-h-dvh bg-background grid grid-cols-12 gap-0">
				<div className="col-span-12 md:col-span-7 col-start-1 flex items-center justify-center p-4 pb-20">
					<Card size="sm" className="max-w-md w-full">
						<CardContent className="flex flex-col gap-4">
							<CardTitle className="text-xl font-extrabold tracking-tight">
								Unable to Load
							</CardTitle>
							<EmptyStateWithIllustration
								animation="error"
								title="Unable to Load Questions"
								description={loadError}
								action={{
									label: "Try Again",
									onClick: () => {
										setLoadError(null);
										window.location.reload();
									},
								}}
								secondaryAction={{ label: "Go Back", onClick: handleStop }}
							/>
						</CardContent>
					</Card>
				</div>
				<div className="col-span-12 md:col-span-5 col-start-1 md:col-start-8 relative overflow-hidden bg-system-surface/30">
					<div className="absolute inset-0 bg-linear-to-br from-destructive/5 via-transparent to-transparent" />
					<div className="absolute inset-0 flex items-center justify-center p-8">
						<div className="w-full h-full max-w-xs aspect-square rounded-3xl bg-destructive/10 blur-2xl animate-float-slow" />
					</div>
				</div>
			</div>
		);
	}

	if (!sessionActive || !selectedSubject) {
		if (variant === "compact") {
			return (
				<QuizSubjectPrompt
					onSelect={() => handleStartWithSubject("")}
					hasSubject={false}
				/>
			);
		}
		return (
			<div className="min-h-dvh bg-background grid grid-cols-12 gap-0">
				<div className="col-span-12 md:col-span-7 col-start-1 flex items-center justify-center p-4 pb-20">
					<Card size="sm" className="max-w-md w-full">
						<CardContent className="flex flex-col gap-4">
							<CardTitle className="ios-title-2 font-extrabold tracking-tight">
								Quiz Practice
							</CardTitle>
							<QuizSelectSubject onSelect={(s) => handleStartWithSubject(s)} />
						</CardContent>
					</Card>
				</div>
				<div className="col-span-12 md:col-span-5 col-start-1 md:col-start-8 relative overflow-hidden bg-system-surface/30">
					<div className="absolute inset-0 bg-linear-to-br from-[--system-accent]/10 via-transparent to-transparent" />
					<div className="absolute inset-0 flex items-center justify-center p-8">
						<div className="w-full h-full max-w-xs aspect-square rounded-3xl bg-system-accent/10 blur-2xl animate-float-slow" />
					</div>
				</div>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="min-h-dvh bg-background grid grid-cols-12 gap-0">
				<div className="col-span-12 md:col-span-7 col-start-1 flex items-center justify-center p-4 pb-20">
					<Card size="sm" className="max-w-md w-full">
						<CardContent className="flex flex-col items-center gap-4 p-8 text-left">
							<m.div
								animate={{ rotate: 360 }}
								transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
								className="w-12 h-3 mx-auto"
							>
								<CircleNotch className="size-12 text-muted-foreground" />
							</m.div>
							<p className="text-muted-foreground">Loading questions...</p>
						</CardContent>
					</Card>
				</div>
				<div className="col-span-12 md:col-span-5 col-start-1 md:col-start-8 relative overflow-hidden bg-system-surface/30">
					<div className="absolute inset-0 bg-linear-to-br from-[--system-accent]/10 via-transparent to-transparent" />
					<div className="absolute inset-0 flex items-center justify-center p-8">
						<div className="w-full h-full max-w-xs aspect-square rounded-3xl bg-system-accent/10 blur-2xl animate-float-slow" />
					</div>
				</div>
			</div>
		);
	}

	if (isError) {
		return (
			<div className="min-h-dvh bg-background grid grid-cols-12 gap-0">
				<div className="col-span-12 md:col-span-7 col-start-1 flex items-center justify-center p-4 pb-20">
					<Card size="sm" className="max-w-md w-full">
						<CardContent>
							<CardTitle className="text-xl font-extrabold tracking-tight">
								Unable to Load Questions
							</CardTitle>
							<QuizEmptyState
								variant="no-questions"
								subject={selectedSubject}
								onBack={handleStop}
							/>
						</CardContent>
					</Card>
				</div>
				<div className="col-span-12 md:col-span-5 col-start-1 md:col-start-8 relative overflow-hidden bg-system-surface/30">
					<div className="absolute inset-0 bg-linear-to-br from-destructive/5 via-transparent to-transparent" />
					<div className="absolute inset-0 flex items-center justify-center p-8">
						<div className="w-full h-full max-w-xs aspect-square rounded-3xl bg-destructive/10 blur-2xl animate-float-slow" />
					</div>
				</div>
			</div>
		);
	}

	if (questions.length === 0) {
		return (
			<div className="min-h-dvh bg-background grid grid-cols-12 gap-0">
				<div className="col-span-12 md:col-span-7 col-start-1 flex items-center justify-center p-4 pb-20">
					<Card size="sm" className="max-w-md w-full">
						<CardContent>
							<CardTitle className="text-xl font-extrabold tracking-tight">
								No Questions
							</CardTitle>
							<QuizEmptyState
								variant="no-questions"
								subject={selectedSubject}
								onBack={handleStop}
							/>
						</CardContent>
					</Card>
				</div>
				<div className="col-span-12 md:col-span-5 col-start-1 md:col-start-8 relative overflow-hidden bg-system-surface/30">
					<div className="absolute inset-0 bg-linear-to-br from-[--system-accent]/10 via-transparent to-transparent" />
					<div className="absolute inset-0 flex items-center justify-center p-8">
						<div className="w-full h-full max-w-xs aspect-square rounded-3xl bg-system-accent/10 blur-2xl animate-float-slow" />
					</div>
				</div>
			</div>
		);
	}

	if (isComplete) {
		return (
			<div className="min-h-dvh bg-background grid grid-cols-12 gap-0">
				<div className="col-span-12 md:col-span-7 col-start-1 flex items-center justify-center p-4 pb-20">
					<QuizResultsCard
						totalQuestions={totalQuestions}
						correctAnswers={correctAnswers}
						elapsedTime={elapsedTime}
						onRestart={handleRestart}
						onDashboard={handleStop}
					/>
				</div>
				<div className="col-span-12 md:col-span-5 col-start-1 md:col-start-8 relative overflow-hidden bg-system-surface/30">
					<div className="absolute inset-0 bg-linear-to-br from-[--system-accent]/10 via-transparent to-transparent" />
					<div className="absolute inset-0 flex items-center justify-center p-8">
						<div className="w-full h-full max-w-xs aspect-square rounded-3xl bg-system-accent/10 blur-2xl animate-float-slow" />
					</div>
				</div>
			</div>
		);
	}

	return (
		<div
			className="min-h-dvh bg-background grid grid-cols-12 gap-0"
			role="region"
			aria-labelledby="quiz-title"
		>
			{/* Main quiz content — left column */}
			<main
				className="col-span-12 md:col-span-7 col-start-1 flex flex-col gap-6 p-4 md:p-6 pb-20"
				tabIndex={-1}
			>
				<AssessmentHeader
					title="Quiz Practice"
					elapsedTime={elapsedTime}
					currentQuestionIndex={currentIndex}
					totalQuestions={totalQuestions}
					progressValue={((currentIndex + 1) / totalQuestions) * 100}
					showAccuracy
					accuracy={
						totalQuestions > 0
							? Math.round((correctAnswers / (currentIndex + 1 || 1)) * 100)
							: 0
					}
					onQuit={handleStop}
				/>

				{currentQuestion && (
					<QuestionCard
						question={currentQuestion}
						subject={selectedSubject}
						questionNumber={currentIndex + 1}
						totalQuestions={totalQuestions}
						onNext={handleNext}
						onAnswered={handleAnswered}
					/>
				)}

				<QuizControls
					currentQuestionIndex={currentIndex}
					totalQuestions={totalQuestions}
					hasSelected={currentAnswered}
					showFeedback={currentAnswered}
					onPrevious={handlePrevious}
					onNext={handleNext}
					onSkip={handleSkip}
					showSkip={variant === "full" && !currentAnswered}
				/>

				<ProgressDots
					total={totalQuestions}
					currentIndex={currentIndex}
					variant="quiz"
				/>
			</main>

			{/* Decorative accent — right zone */}
			<div
				className="col-span-12 md:col-span-5 col-start-1 md:col-start-8 relative overflow-hidden bg-system-surface/30"
				aria-hidden="true"
			>
				<div className="absolute inset-0 bg-linear-to-br from-[--system-accent]/10 via-transparent to-transparent" />
				<div className="absolute inset-0 flex items-center justify-center p-8">
					<div className="w-full h-full max-w-xs aspect-square rounded-3xl bg-system-accent/10 blur-2xl animate-float-slow" />
				</div>
			</div>
		</div>
	);
}
