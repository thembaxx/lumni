"use client";

import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import { startTransition, useCallback } from "react";
import { QuestionCard } from "@/components/quiz/question-card";
import { Anim } from "@/components/shared/anim";
import { TimerDisplay } from "@/components/shared/timer-display";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { Question } from "@/lib/question-engine/types";
import { cn } from "@/lib/shared";
import { iOSEase } from "@/lib/utils/animation";

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
			<div className="flex w-full max-w-2xl flex-col gap-4 px-4 pb-6">
				<div className="flex animate-fade-in flex-col gap-4">
					<div className="flex items-center justify-between">
						<Button
							variant="ghost"
							size="sm"
							onClick={onQuit}
							className="font-medium hover:bg-destructive/10 hover:text-foreground"
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
						<HugeiconsIcon icon={ArrowLeft01Icon} data-icon />
						Previous
					</Button>
					<Button onClick={onNext} className="gap-2">
						{currentQuestionIndex < totalQuestions - 1 ? "Next" : "Finish"}
						<HugeiconsIcon icon={ArrowRight01Icon} data-icon />
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
		<span className="font-medium font-mono text-sm">
			{currentQuestionIndex + 1}/{totalQuestions}
		</span>
	);
}

function AccuracyDisplay({ accuracy }: { accuracy: number }) {
	return (
		<div className="flex items-center gap-1.5">
			<span className="font-mono font-semibold text-sm text-success tabular-nums">
				{accuracy}%
			</span>
		</div>
	);
}
