"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
	QuestionCard,
	QuizControls,
	QuizEmptyState,
	QuizHeader,
	QuizResultsCard,
	QuizSelectSubject,
	QuizStartState,
	QuizSubjectPrompt,
} from "@/components/quiz";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuizSession } from "@/hooks/use-quiz-session";

export type QuizViewVariant = "full" | "compact";

export interface QuizViewProps {
	variant?: QuizViewVariant;
	initialSubject?: string;
	topic?: string;
	questionCount?: number;
	maxTime?: number;
	onQuit?: () => void;
	onFinish?: (results: { correctAnswers: number; elapsedTime: number }) => void;
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
	const [hasStarted, setHasStarted] = useState(false);

	// Auto-start when subject comes from URL params
	useEffect(() => {
		if (initialSubject && !hasStarted) {
			setHasStarted(true);
		}
	}, [initialSubject, hasStarted]);

	const { state, actions } = useQuizSession({
		subject: initialSubject,
		topic,
		questionCount,
		maxTime,
		onFinish,
		enabled: hasStarted,
	});

	const {
		elapsedTime,
		currentQuestionIndex,
		selectedAnswer,
		showFeedback,
		correctAnswers,
		questions,
		currentQuestion,
		isLoading,
		hasSubject,
		selectedSubject,
		totalQuestions,
	} = state;

	const {
		handleStartWithSubject,
		handleStop,
		handleRestart,
		handleSelectAnswer,
		handleAnswer,
		handleNext,
		handlePrevious,
		handleSkip,
	} = actions;

	const handleStart = useCallback(() => {
		if (selectedSubject) {
			setHasStarted(true);
			handleStartWithSubject(selectedSubject);
		}
	}, [handleStartWithSubject, selectedSubject]);

	const handleQuitWithStop = useCallback(() => {
		handleStop();
		onQuit?.();
	}, [handleStop, onQuit]);

	const isComplete = useMemo(() => {
		return (
			correctAnswers > 0 &&
			currentQuestionIndex === questions.length - 1 &&
			showFeedback
		);
	}, [correctAnswers, currentQuestionIndex, questions.length, showFeedback]);

	// State 1: No subject selected yet - show landing/selection UI
	if (!hasSubject) {
		if (variant === "compact") {
			return <QuizSubjectPrompt onSelect={handleStart} hasSubject={false} />;
		}
		return (
			<div className="min-h-screen bg-background p-4 flex items-center justify-center pb-20">
				<Card className="max-w-md w-full card-elevated">
					<CardHeader className="text-center">
						<CardTitle className="text-2xl">Quiz Practice</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<QuizSelectSubject onSelect={handleStart} />
					</CardContent>
				</Card>
			</div>
		);
	}

	// State 2: Loading questions
	if (isLoading) {
		return (
			<div className="min-h-screen bg-background p-4 flex items-center justify-center pb-20">
				<Card className="max-w-md w-full card-elevated">
					<CardContent className="p-8 text-center">
						<p className="text-muted-foreground">Loading questions...</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	// State 3: No questions available for subject
	if (questions.length === 0) {
		return (
			<div className="min-h-screen bg-background p-4 flex items-center justify-center pb-20">
				<Card className="max-w-md w-full card-elevated">
					<CardHeader className="text-center">
						<CardTitle>No Questions</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<QuizEmptyState
							variant="no-questions"
							subject={selectedSubject}
							onBack={handleStop}
						/>
					</CardContent>
				</Card>
			</div>
		);
	}

	// State 4: Quiz complete - show results
	if (isComplete) {
		return (
			<div className="min-h-screen bg-background p-4 flex items-center justify-center pb-20">
				<QuizResultsCard
					totalQuestions={questions.length}
					correctAnswers={correctAnswers}
					elapsedTime={elapsedTime}
					onRestart={handleRestart}
					onDashboard={handleStop}
				/>
			</div>
		);
	}

	// State 5: Quiz active - show question
	return (
		<div className="min-h-screen bg-background p-4 space-y-6 pb-20 max-w-md mx-auto">
			<QuizHeader
				elapsedTime={elapsedTime}
				currentQuestionIndex={currentQuestionIndex}
				totalQuestions={totalQuestions}
				correctAnswers={correctAnswers}
				onQuit={handleQuitWithStop}
			/>

			{currentQuestion && (
				<QuestionCard
					question={currentQuestion}
					questionNumber={currentQuestionIndex + 1}
					totalQuestions={totalQuestions}
					selectedAnswer={selectedAnswer}
					showFeedback={showFeedback}
					onSelectAnswer={handleSelectAnswer}
					onAnswer={handleAnswer}
				/>
			)}

			<QuizControls
				currentQuestionIndex={currentQuestionIndex}
				totalQuestions={totalQuestions}
				hasSelected={!!selectedAnswer}
				showFeedback={showFeedback}
				onPrevious={handlePrevious}
				onNext={handleNext}
				onSkip={handleSkip}
				showSkip={variant === "full"}
			/>

			<div className="flex justify-center gap-1">
				{questions.map((q, idx) => (
					<div
						key={q.id || `question-${idx}`}
						className={
							idx === currentQuestionIndex
								? "h-1.5 w-1.5 rounded-full bg-primary"
								: idx < currentQuestionIndex
									? "h-1.5 w-1.5 rounded-full bg-green-500"
									: "h-1.5 w-1.5 rounded-full bg-muted"
						}
					/>
				))}
			</div>
		</div>
	);
}
