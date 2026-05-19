"use client";

import { RadialIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import {
	EmptyStateWithIllustration,
	QuestionCard,
	QuizEmptyState,
	QuizResultsCard,
	QuizSelectSubject,
	QuizSubjectPrompt,
} from "@/components/quiz";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import type { Question } from "@/lib/question-engine/types";
import { useQuizView } from "./hooks/use-quiz-view";
import { QuizFooter } from "./quiz-footer";
import { QuizHeader } from "./quiz-header";

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
	const {
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
	} = useQuizView({
		initialSubject,
		topic,
		questionCount,
		maxTime,
		onQuit,
		onFinish,
	});

	if (loadError) {
		return (
			<div className="grid min-h-dvh grid-cols-12 gap-0 bg-background">
				<div className="col-span-12 col-start-1 flex items-center justify-center p-4 pb-20 md:col-span-7">
					<Card size="sm" className="w-full max-w-md">
						<CardContent className="flex flex-col gap-4">
							<CardTitle className="font-extrabold text-xl tracking-tight">
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
				<div className="relative col-span-12 col-start-1 overflow-hidden bg-system-surface/30 md:col-span-5 md:col-start-8">
					<div className="absolute inset-0 bg-linear-to-br from-destructive/5 via-transparent to-transparent" />
					<div className="absolute inset-0 flex items-center justify-center p-8">
						<div className="aspect-square h-full w-full max-w-xs animate-float-slow rounded-3xl bg-destructive/10 blur-2xl" />
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
			<div className="grid min-h-dvh grid-cols-12 gap-0 bg-background">
				<div className="col-span-12 col-start-1 flex items-center justify-center p-4 pb-20 md:col-span-7">
					<Card size="sm" className="w-full max-w-md">
						<CardContent className="flex flex-col gap-4">
							<CardTitle className="ios-title-2 font-extrabold tracking-tight">
								Quiz Practice
							</CardTitle>
							<QuizSelectSubject onSelect={(s) => handleStartWithSubject(s)} />
						</CardContent>
					</Card>
				</div>
				<div className="relative col-span-12 col-start-1 overflow-hidden bg-system-surface/30 md:col-span-5 md:col-start-8">
					<div className="absolute inset-0 bg-linear-to-br from-[--system-accent]/10 via-transparent to-transparent" />
					<div className="absolute inset-0 flex items-center justify-center p-8">
						<div className="aspect-square h-full w-full max-w-xs animate-float-slow rounded-3xl bg-system-accent/10 blur-2xl" />
					</div>
				</div>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="grid min-h-dvh grid-cols-12 gap-0 bg-background">
				<div className="col-span-12 col-start-1 flex items-center justify-center p-4 pb-20 md:col-span-7">
					<Card size="sm" className="w-full max-w-md">
						<CardContent className="flex flex-col items-center gap-4 p-8 text-left">
							<m.div
								animate={{ rotate: 360 }}
								transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
								className="mx-auto h-3 w-12"
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
									<p className="text-muted-foreground text-xs">
										Focusing on{" "}
										<span className="font-semibold text-foreground">
											{resolvedTopic}
										</span>
									</p>
									<p className="text-muted-foreground text-xs">
										Level:{" "}
										<span className="font-semibold text-foreground capitalize">
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
				<div className="relative col-span-12 col-start-1 overflow-hidden bg-system-surface/30 md:col-span-5 md:col-start-8">
					<div className="absolute inset-0 bg-linear-to-br from-[--system-accent]/10 via-transparent to-transparent" />
					<div className="absolute inset-0 flex items-center justify-center p-8">
						<div className="aspect-square h-full w-full max-w-xs animate-float-slow rounded-3xl bg-system-accent/10 blur-2xl" />
					</div>
				</div>
			</div>
		);
	}

	if (isError) {
		return (
			<div className="grid min-h-dvh grid-cols-12 gap-0 bg-background">
				<div className="col-span-12 col-start-1 flex items-center justify-center p-4 pb-20 md:col-span-7">
					<Card size="sm" className="w-full max-w-md">
						<CardContent>
							<CardTitle className="text-center font-extrabold text-xl tracking-tight">
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
				<div className="relative col-span-12 col-start-1 overflow-hidden bg-system-surface/30 md:col-span-5 md:col-start-8">
					<div className="absolute inset-0 bg-linear-to-br from-destructive/5 via-transparent to-transparent" />
					<div className="absolute inset-0 flex items-center justify-center p-8">
						<div className="aspect-square h-full w-full max-w-xs animate-float-slow rounded-3xl bg-destructive/10 blur-2xl" />
					</div>
				</div>
			</div>
		);
	}

	if (questions.length === 0) {
		return (
			<div className="grid min-h-dvh grid-cols-12 gap-0 bg-background">
				<div className="col-span-12 col-start-1 flex items-center justify-center p-4 pb-20 md:col-span-7">
					<Card size="sm" className="w-full max-w-md">
						<CardContent>
							<CardTitle className="font-extrabold text-xl tracking-tight">
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
				<div className="relative col-span-12 col-start-1 overflow-hidden bg-system-surface/30 md:col-span-5 md:col-start-8">
					<div className="absolute inset-0 bg-linear-to-br from-[--system-accent]/10 via-transparent to-transparent" />
					<div className="absolute inset-0 flex items-center justify-center p-8">
						<div className="aspect-square h-full w-full max-w-xs animate-float-slow rounded-3xl bg-system-accent/10 blur-2xl" />
					</div>
				</div>
			</div>
		);
	}

	if (state.isComplete) {
		return (
			<div className="grid min-h-dvh grid-cols-12 gap-0 bg-background">
				<div className="col-span-12 col-start-1 flex items-center justify-center p-4 pb-20 md:col-span-7">
					<QuizResultsCard
						totalQuestions={state.totalQuestions}
						correctAnswers={state.correctAnswers}
						elapsedTime={state.elapsedTime}
						onRestart={handleRestart}
						onDashboard={handleStop}
					/>
				</div>
				<div className="relative col-span-12 col-start-1 overflow-hidden bg-system-surface/30 md:col-span-5 md:col-start-8">
					<div className="absolute inset-0 bg-linear-to-br from-[--system-accent]/10 via-transparent to-transparent" />
					<div className="absolute inset-0 flex items-center justify-center p-8">
						<div className="aspect-square h-full w-full max-w-xs animate-float-slow rounded-3xl bg-system-accent/10 blur-2xl" />
					</div>
				</div>
			</div>
		);
	}

	return (
		<div
			className="grid min-h-dvh grid-cols-12 gap-0 bg-background"
			role="region"
			aria-labelledby="quiz-title"
		>
			<main
				className="col-span-12 col-start-1 flex flex-col gap-6 p-4 pb-20 md:col-span-7 md:p-6"
				tabIndex={-1}
			>
				<QuizHeader
					elapsedTime={state.elapsedTime}
					currentIndex={currentIndex}
					totalQuestions={state.totalQuestions}
					correctAnswers={state.correctAnswers}
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

				<QuizFooter
					currentIndex={currentIndex}
					totalQuestions={state.totalQuestions}
					hasSelected={currentAnswered}
					showFeedback={currentAnswered}
					variant={variant}
					onPrevious={handlePrevious}
					onNext={handleNext}
					onSkip={handleSkip}
				/>
			</main>

			<div
				className="relative col-span-12 col-start-1 overflow-hidden bg-system-surface/30 md:col-span-5 md:col-start-8"
				aria-hidden="true"
			>
				<div className="absolute inset-0 bg-linear-to-br from-[--system-accent]/10 via-transparent to-transparent" />
				<div className="absolute inset-0 flex items-center justify-center p-8">
					<div className="aspect-square h-full w-full max-w-xs animate-float-slow rounded-3xl bg-system-accent/10 blur-2xl" />
				</div>
			</div>
		</div>
	);
}
