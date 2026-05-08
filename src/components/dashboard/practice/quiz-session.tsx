"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { startTransition, useCallback, useState, ViewTransition } from "react";
import { QuestionCard } from "@/components/quiz/question-card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { QAQuestion } from "@/types/questions";
import { cn } from "@/lib/utils";

interface QuizSessionProps {
	currentQuestion: QAQuestion;
	currentQuestionIndex: number;
	totalQuestions: number;
	selectedAnswer: string | null;
	showFeedback: boolean;
	isTransitioning: boolean;
	elapsedTime: number;
	correctAnswers: number;
	onSelectAnswer: (optionId: string) => void;
	onAnswer: (optionId: string, isCorrect: boolean) => void;
	onNext: () => void;
	onPrevious: () => void;
	onQuit: () => void;
	formatTime: (seconds: number) => string;
	calculateAccuracy: () => number;
}

export function QuizSession({
	currentQuestion,
	currentQuestionIndex,
	totalQuestions,
	selectedAnswer,
	showFeedback,
	isTransitioning,
	elapsedTime,
	correctAnswers,
	onSelectAnswer,
	onAnswer,
	onNext,
	onPrevious,
	onQuit,
	formatTime,
	calculateAccuracy,
}: QuizSessionProps) {
	const progressValue = ((currentQuestionIndex + 1) / totalQuestions) * 100;

	const handlePrevious = useCallback(() => {
		if (currentQuestionIndex > 0) {
			startTransition(() => {
				onPrevious();
			});
		}
	}, [currentQuestionIndex, onPrevious]);

	return (
		<div className="w-full max-w-2xl px-4 pb-6 space-y-4">
			<div className="animate-fade-in space-y-4">
				<div className="flex items-center justify-between">
					<Button
						variant="ghost"
						size="sm"
						onClick={onQuit}
						className="font-medium hover:text-foreground hover:bg-destructive/10"
					>
						Quit
					</Button>
					<div className="flex items-center gap-3">
						<TimerDisplay elapsedTime={elapsedTime} formatTime={formatTime} />
						<span className="text-muted-foreground">|</span>
						<QuestionCounter
							currentQuestionIndex={currentQuestionIndex}
							totalQuestions={totalQuestions}
						/>
					</div>
					<AccuracyDisplay accuracy={calculateAccuracy()} />
				</div>

				<Progress value={progressValue} className="h-1.5" />
			</div>

			<ViewTransition>
				<QuestionCard
					key={currentQuestion.id}
					question={currentQuestion}
					questionNumber={currentQuestionIndex + 1}
					totalQuestions={totalQuestions}
					selectedAnswer={selectedAnswer}
					showFeedback={showFeedback}
					onSelectAnswer={onSelectAnswer}
					onAnswer={onAnswer}
				/>
			</ViewTransition>

			<div
				className={cn(
					"flex items-center justify-between gap-3",
					isTransitioning && "opacity-0",
				)}
			>
				<Button
					variant="outline"
					onClick={handlePrevious}
					disabled={currentQuestionIndex === 0}
					className="gap-2"
				>
					<ChevronLeft className="size-4" />
					Previous
				</Button>
				<Button onClick={onNext} disabled={!showFeedback} className="gap-2">
					{currentQuestionIndex < totalQuestions - 1 ? "Next" : "Finish"}
					<ChevronRight className="size-4" />
				</Button>
			</div>
		</div>
	);
}

function TimerDisplay({
	elapsedTime,
	formatTime,
}: {
	elapsedTime: number;
	formatTime: (seconds: number) => string;
}) {
	return (
		<div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50">
			<span className="text-sm font-medium tabular-nums font-mono">
				{formatTime(elapsedTime)}
			</span>
		</div>
	);
}

function QuestionCounter({
	currentQuestionIndex,
	totalQuestions,
}: {
	currentQuestionIndex: number;
	totalQuestions: number;
}) {
	return (
		<span className="font-mono text-sm font-medium">
			{currentQuestionIndex + 1}/{totalQuestions}
		</span>
	);
}

function AccuracyDisplay({ accuracy }: { accuracy: number }) {
	return (
		<div className="flex items-center gap-1.5">
			<span className="text-sm font-semibold tabular-nums font-mono text-green-500">
				{accuracy}%
			</span>
		</div>
	);
}
