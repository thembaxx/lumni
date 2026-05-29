"use client";

import { RadialIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { animate, m, useMotionValue } from "framer-motion";
import { useTranslations } from "next-intl";
import { useCallback, useEffect } from "react";
import {
	EmptyStateWithIllustration,
	QuestionCard,
	QuizEmptyState,
	QuizResultsCard,
	QuizSelectSubject,
	QuizSubjectPrompt,
} from "@/components/quiz";
import { useImmersiveMode } from "@/components/shared/immersive-mode";
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
	pastPaperMode?: boolean;
	onQuit?: () => void;
	onFinish?: (results: QuizResults) => void;
	className?: string;
}

// TODO(react-doctor): Extract QuizErrorState into separate component (~40 lines)
// TODO(react-doctor): Extract QuizSubjectSelection into separate component (~30 lines)
// TODO(react-doctor): Extract QuizLoadingState into separate component (~45 lines)
// TODO(react-doctor): Extract QuizResultsState into separate component (~25 lines)
// TODO(react-doctor): Extract QuizNoQuestionsState into separate component (~25 lines)
// TODO(react-doctor): Extract DecorativeRightPanel into separate component (repeated ~50 lines)
export function QuizView({
	variant = "full",
	initialSubject,
	topic,
	questionCount = 10,
	maxTime = 90 * 60,
	pastPaperMode,
	onQuit,
	onFinish,
	className: _className,
}: QuizViewProps) {
	const t = useTranslations();
	const { setImmersive } = useImmersiveMode();
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
		pastPaperMode,
		onQuit,
		onFinish,
	});

	const isQuizActive =
		sessionActive && questions.length > 0 && !state.isComplete;

	useEffect(() => {
		setImmersive(isQuizActive);
		return () => setImmersive(false);
	}, [isQuizActive, setImmersive]);

	const dragX = useMotionValue(0);

	const handleDragEnd = useCallback(
		(_: unknown, info: { offset: { x: number } }) => {
			const threshold = 80;
			if (info.offset.x > threshold) handlePrevious();
			else if (info.offset.x < -threshold) handleNext();
			animate(dragX, 0, { type: "spring", stiffness: 300, damping: 30 });
		},
		[handleNext, handlePrevious, dragX],
	);

	if (loadError) {
		return (
			<div className="grid min-h-dvh grid-cols-12 gap-0 bg-background">
				<div className="col-span-12 col-start-1 flex items-center justify-center p-4 pb-20 md:col-span-7">
					<Card size="sm" className="w-full max-w-md">
						<CardContent className="flex flex-col gap-4">
							<CardTitle className="font-extrabold text-xl tracking-tight">
								{t("common.error")}
							</CardTitle>
							<EmptyStateWithIllustration
								animation="error"
								title={t("quiz.loadError")}
								description={loadError}
								action={{
									label: t("common.retry"),
									onClick: () => {
										setLoadError(null);
										window.location.reload();
									},
								}}
								secondaryAction={{
									label: t("common.back"),
									onClick: handleStop,
								}}
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
								{t("quiz.title")}
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
								{t("quiz.preparingQuestions")}
							</p>
							{resolvedTopic && competencyData.topicCompetencyLevel && (
								<div className="flex flex-col items-center gap-1">
									<p className="text-muted-foreground text-xs">
										{t("quiz.focusingOn", { topic: resolvedTopic })}
									</p>
									<p className="text-muted-foreground text-xs">
										{t("quiz.level", {
											level: competencyData.topicCompetencyLevel,
										})}
										{competencyData.topicCompetencyScore !== undefined &&
											t("quiz.scorePercent", {
												score: competencyData.topicCompetencyScore,
											})}
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
								{t("quiz.loadError")}
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
								{t("quiz.noQuestions")}
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
						subject={selectedSubject ?? "Quiz"}
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
		<section className="min-h-dvh bg-background" aria-labelledby="quiz-title">
			<m.main
				className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 md:p-6"
				tabIndex={-1}
				drag={isQuizActive ? "x" : false}
				dragElastic={0.3}
				whileDrag={{ scale: 0.97, transition: { duration: 0.1 } }}
				style={{ x: dragX }}
				onDragEnd={handleDragEnd}
			>
				{pastPaperMode && (
					<div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-amber-600 text-xs dark:text-amber-400">
						<span>📝</span>
						<span>Past Paper Mode: questions styled after NSC exam papers</span>
					</div>
				)}

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
			</m.main>
		</section>
	);
}
