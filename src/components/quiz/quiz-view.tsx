"use client";

import { RadialIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
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
import type {
	BloomLevel,
	Difficulty,
	Question,
} from "@/lib/question-engine/types";
import { useQuizSession } from "@/lib/quiz-session";

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
	const [currentAnswered, setCurrentAnswered] = useState(false);
	const [competencyData, setCompetencyData] = useState<{
		topicCompetencyLevel?: "novice" | "developing" | "proficient" | "mastered";
		topicCompetencyScore?: number;
		suggestedBloomLevel?: BloomLevel;
		suggestedDifficulty?: Difficulty;
	}>({});
	const [resolvedTopic, setResolvedTopic] = useState<string | undefined>(topic);

	useEffect(() => {
		setResolvedTopic(topic);
	}, [topic]);
	const hasAutoStarted = useRef(false);
	const _quizContainerRef = useRef<HTMLDivElement>(null);

	// Auto-start when a subject is provided via URL params (e.g., from TodayFocusCard)
	useEffect(() => {
		if (initialSubject && !hasAutoStarted.current) {
			hasAutoStarted.current = true;
			handleStartWithSubject(initialSubject);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

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
				const { competencyService } = await import("@/lib/competency-engine");
				const { computeCompetencyLevel } = await import(
					"@/lib/competency-engine/types"
				);
				const { mapCompetencyToBloom, mapCompetencyToDifficulty } =
					await import("@/lib/question-engine/competency-mapper");

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

				// Cross-topic awareness: when no topic specified,
				// auto-detect the weakest topic
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
						e.preventDefault();
						break;
					case "ArrowRight":
					case "ArrowDown":
						e.preventDefault();
						break;
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
								<HugeiconsIcon
									icon={RadialIcon}
									className="size-12 text-muted-foreground"
								/>
							</m.div>
							<p className="text-muted-foreground">
								Preparing your questions...
							</p>
							{resolvedTopic && competencyData.topicCompetencyLevel && (
								<div className="flex flex-col items-center gap-1">
									<p className="text-xs text-muted-foreground">
										Focusing on{" "}
										<span className="font-semibold text-foreground">
											{resolvedTopic}
										</span>
									</p>
									<p className="text-xs text-muted-foreground">
										Level:{" "}
										<span className="font-semibold capitalize text-foreground">
											{competencyData.topicCompetencyLevel}
										</span>
										{competencyData.topicCompetencyScore !== undefined && (
											<> · Score: {competencyData.topicCompetencyScore}%</>
										)}
									</p>
								</div>
							)}
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

	if (state.isComplete) {
		return (
			<div className="min-h-dvh bg-background grid grid-cols-12 gap-0">
				<div className="col-span-12 md:col-span-7 col-start-1 flex items-center justify-center p-4 pb-20">
					<QuizResultsCard
						totalQuestions={state.totalQuestions}
						correctAnswers={state.correctAnswers}
						elapsedTime={state.elapsedTime}
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
			<main
				className="col-span-12 md:col-span-7 col-start-1 flex flex-col gap-6 p-4 md:p-6 pb-20"
				tabIndex={-1}
			>
				<AssessmentHeader
					title="Quiz Practice"
					elapsedTime={state.elapsedTime}
					currentQuestionIndex={currentIndex}
					totalQuestions={state.totalQuestions}
					progressValue={((currentIndex + 1) / state.totalQuestions) * 100}
					showAccuracy
					accuracy={
						state.totalQuestions > 0
							? Math.round(
									(state.correctAnswers / (currentIndex + 1 || 1)) * 100,
								)
							: 0
					}
					onQuit={handleStop}
				/>

				{state.currentQuestion && (
					<QuestionCard
						question={state.currentQuestion}
						subject={selectedSubject}
						questionNumber={state.questionNumber}
						totalQuestions={state.totalQuestions}
						onNext={handleNext}
						onAnswered={handleAnswered}
					/>
				)}

				<QuizControls
					currentQuestionIndex={currentIndex}
					totalQuestions={state.totalQuestions}
					hasSelected={currentAnswered}
					showFeedback={currentAnswered}
					onPrevious={handlePrevious}
					onNext={handleNext}
					onSkip={handleSkip}
					showSkip={variant === "full" && !currentAnswered}
				/>

				<ProgressDots
					total={state.totalQuestions}
					currentIndex={currentIndex}
					variant="quiz"
				/>
			</main>

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
