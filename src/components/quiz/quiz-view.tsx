"use client";

import { File01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { animate, m, useMotionValue } from "framer-motion";
import { useTranslations } from "next-intl";
import { useCallback, useEffect } from "react";
import { QuestionCard, QuizSubjectPrompt } from "@/components/quiz";
import { useImmersiveMode } from "@/components/shared/immersive-mode";
import type { Question } from "@/lib/question-engine/types";
import type { QuizCompleteResult } from "@/lib/quiz";
import { useQuizView } from "./hooks/use-quiz-view";
import { QuizFooter } from "./quiz-footer";
import { QuizHeader } from "./quiz-header";
import { DecorativeRightPanel } from "./quiz-view/decorative-right-panel";
import { QuizErrorState } from "./quiz-view/quiz-error-state";
import { QuizLoadingState } from "./quiz-view/quiz-loading-state";
import { QuizNoQuestionsState } from "./quiz-view/quiz-no-questions-state";
import { QuizResultsState } from "./quiz-view/quiz-results-state";
import { QuizSubjectSelection } from "./quiz-view/quiz-subject-selection";

export type QuizResults = QuizCompleteResult;

export type QuizViewVariant = "full" | "compact";

export interface QuizViewProps {
	variant?: QuizViewVariant;
	initialSubject?: string;
	topic?: string;
	questionCount?: number;
	maxTime?: number;
	pastPaperMode?: boolean;
	packQuestions?: Question[];
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
	pastPaperMode,
	packQuestions,
	onQuit,
	onFinish,
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
		sources,
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
		packQuestions,
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
			<QuizErrorState
				loadError={loadError}
				onRetry={() => {
					setLoadError(null);
					window.location.reload();
				}}
				onBack={handleStop}
			/>
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
		return <QuizSubjectSelection onSelect={(s) => handleStartWithSubject(s)} />;
	}

	if (isLoading) {
		return (
			<QuizLoadingState
				resolvedTopic={resolvedTopic}
				topicCompetencyLevel={competencyData.topicCompetencyLevel}
				topicCompetencyScore={competencyData.topicCompetencyScore}
			/>
		);
	}

	if (isError) {
		return (
			<div className="grid min-h-dvh grid-cols-12 gap-0 bg-background">
				<div className="col-span-12 col-start-1 flex items-center justify-center p-4 pb-(--space-20) md:col-span-7">
					<QuizNoQuestionsState
						selectedSubject={selectedSubject}
						onBack={handleStop}
					/>
				</div>
				<DecorativeRightPanel variant="destructive" />
			</div>
		);
	}

	if (questions.length === 0) {
		return (
			<QuizNoQuestionsState
				selectedSubject={selectedSubject}
				onBack={handleStop}
			/>
		);
	}

	if (state.isComplete) {
		return (
			<QuizResultsState
				totalQuestions={state.totalQuestions}
				correctAnswers={state.correctAnswers}
				elapsedTime={state.elapsedTime}
				subject={selectedSubject ?? "Quiz"}
				sources={sources}
				questions={state.questions}
				correctness={state.correctness}
				userAnswers={state.userAnswers}
				onRestart={handleRestart}
				onDashboard={handleStop}
			/>
		);
	}

	return (
		<section className="min-h-dvh bg-background" aria-label="Quiz Practice">
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
					<div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-warning text-xs">
						<HugeiconsIcon icon={File01Icon} className="size-4" />
						<span>{t("quiz.pastPaperMode")}</span>
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
