"use client";

import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { m } from "framer-motion";
import { startTransition, useCallback, useState } from "react";
import { QuestionCard } from "@/components/quiz/question-card";
import { Anim } from "@/components/shared/anim";
import { TimerDisplay } from "@/components/shared/timer-display";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/shared";
import { iOSEase } from "@/lib/utils/animation";
import type { Question } from "@/types/questions";

interface QuizSessionProps {
	currentQuestion: Question;
	currentQuestionIndex: number;
	totalQuestions: number;
	isTransitioning: boolean;
	elapsedTime: number;
	correctAnswers: number;
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
	isTransitioning,
	elapsedTime,
	correctAnswers,
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
		<Anim>
			<div className="w-full max-w-2xl px-4 pb-6 flex flex-col gap-4">
				<div className="animate-fade-in flex flex-col gap-4">
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
							<TimerDisplay
								elapsedTime={elapsedTime}
								formatTimeFn={formatTime}
								showIcon={false}
							/>
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

				<m.div
					key={currentQuestion.id}
					initial={{ opacity: 0, y: 12 }}
					animate={{
						opacity: 1,
						y: 0,
						transition: {
							duration: 0.28,
							ease: iOSEase,
						},
					}}
					exit={{
						opacity: 0,
						y: -8,
						transition: {
							duration: 0.15,
							ease: iOSEase,
						},
					}}
				>
					<QuestionCard
						question={currentQuestion}
						subject={currentQuestion.subject}
						questionNumber={currentQuestionIndex + 1}
						totalQuestions={totalQuestions}
						onNext={onNext}
					/>
				</m.div>

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
						<CaretLeft data-icon />
						Previous
					</Button>
					<Button onClick={onNext} className="gap-2">
						{currentQuestionIndex < totalQuestions - 1 ? "Next" : "Finish"}
						<CaretRight data-icon />
					</Button>
				</div>
			</div>
		</Anim>
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
			<span className="text-sm font-semibold tabular-nums font-mono text-success">
				{accuracy}%
			</span>
		</div>
	);
}
