"use client";

import { ArrowDown01Icon, Play, Square } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { domAnimation, LazyMotion, m } from "framer-motion";
import { Timer, Zap } from "lucide-react";
import { useCallback, useState } from "react";
import { SubjectsDrawer } from "@/components/dashboard/drawers/subjects-drawer";
import {
	QuizControls,
	QuizStartState,
	QuizSubjectPrompt,
} from "@/components/quiz";
import { QuestionCard } from "@/components/quiz/question-card";
import { Button } from "@/components/ui/button";
import { AssessmentHeader } from "@/components/ui/headers/assessment-header";
import { useQuizSession } from "@/hooks/use-quiz-session";
import { cn } from "@/lib/utils";
import { iOSEase } from "@/lib/utils/animation";
import { formatTime } from "@/lib/utils/time";

interface QuizTabProps {
	className?: string;
	onHeaderChange?: (show: boolean) => void;
}

const MAX_TIME = 90 * 60;
const DEFAULT_QUESTION_COUNT = 10;

export function QuizTab({ className, onHeaderChange }: QuizTabProps) {
	const [isTransitioning, setIsTransitioning] = useState(false);

	const { state, actions } = useQuizSession({
		questionCount: DEFAULT_QUESTION_COUNT,
		maxTime: MAX_TIME,
		onFinish: useCallback(() => {
			onHeaderChange?.(true);
		}, [onHeaderChange]),
	});

	const {
		isRunning,
		elapsedTime,
		currentQuestionIndex,
		correctAnswers,
		currentQuestion,
		hasSubject,
		selectedSubject,
		totalQuestions,
		points,
	} = state;

	const { handleStartWithSubject, handleStop } = actions;

	const doStart = useCallback(() => {
		if (hasSubject) {
			handleStartWithSubject(selectedSubject);
			onHeaderChange?.(false);
		}
	}, [hasSubject, handleStartWithSubject, selectedSubject, onHeaderChange]);

	const handleNext = useCallback(() => {
		const maxIndex = totalQuestions - 1;
		if (currentQuestionIndex < maxIndex) {
			setIsTransitioning(true);
			setTimeout(() => {
				actions.handleNext();
				setIsTransitioning(false);
			}, 150);
		} else {
			handleStop();
		}
	}, [currentQuestionIndex, totalQuestions, actions, handleStop]);

	const handlePrevious = useCallback(() => {
		if (currentQuestionIndex > 0) {
			setIsTransitioning(true);
			setTimeout(() => {
				actions.handlePrevious();
				setIsTransitioning(false);
			}, 150);
		}
	}, [currentQuestionIndex, actions]);

	if (isRunning && currentQuestion) {
		return (
			<LazyMotion features={domAnimation}>
				<div className="w-full max-w-2xl px-4 pb-6 space-y-4">
					<div className="animate-fade-in space-y-4">
						<AssessmentHeader
							title={selectedSubject}
							elapsedTime={elapsedTime}
							currentQuestionIndex={currentQuestionIndex}
							totalQuestions={totalQuestions}
							progressValue={
								((currentQuestionIndex + 1) / totalQuestions) * 100
							}
							showAccuracy
							accuracy={
								totalQuestions > 0
									? Math.round(
											(correctAnswers / (currentQuestionIndex + 1 || 1)) * 100,
										)
									: 0
							}
							onQuit={handleStop}
						/>
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
							subject={selectedSubject}
							questionNumber={currentQuestionIndex + 1}
							totalQuestions={totalQuestions}
							onNext={handleNext}
						/>
					</m.div>

					<div
						className={cn(
							"flex items-center justify-between gap-3",
							isTransitioning && "opacity-0",
						)}
					>
						<QuizControls
							currentQuestionIndex={currentQuestionIndex}
							totalQuestions={totalQuestions}
							hasSelected={false}
							showFeedback={false}
							onPrevious={handlePrevious}
							onNext={handleNext}
						/>
					</div>
				</div>
			</LazyMotion>
		);
	}

	return (
		<div className="w-full h-full flex flex-col">
			<div
				className={cn(
					"flex items-center gap-3 justify-between w-full",
					className,
				)}
			>
				<SubjectsDrawer onSelect={handleStartWithSubject}>
					<Button
						variant="secondary"
						className="h-9 rounded-md pl-3 border-muted bg-muted/50"
						disabled={isRunning}
					>
						<div className="flex items-center gap-3">
							{hasSubject ? selectedSubject : "Subject"}
							<HugeiconsIcon icon={ArrowDown01Icon} />
						</div>
					</Button>
				</SubjectsDrawer>

				<div
					className={cn(
						"flex items-center gap-3 pl-4 py-2 rounded-full bg-muted/30 border border-muted transition-opacity duration-300",
						!hasSubject && "opacity-30 pointer-events-none",
					)}
				>
					<div className="flex items-center gap-2 min-w-16">
						<Timer className="size-4 text-muted-foreground" />
						<span className="text-sm font-medium -mb-0.5 tabular-nums font-mono tracking-tight">
							{formatTime(elapsedTime)}
						</span>
					</div>

					<div className="w-px h-4 bg-muted" />

					<div className="flex items-center gap-2 min-w-14">
						<Zap className="size-4 text-yellow-500 dark:text-yellow-400" />
						<span className="text-sm font-semibold tabular-nums font-mono">
							{points}
						</span>
					</div>
				</div>

				{isRunning ? (
					<Button
						size="icon"
						onClick={handleStop}
						className="size-11 rounded-full bg-destructive hover:bg-destructive/90"
					>
						<HugeiconsIcon icon={Square} className="size-4" />
					</Button>
				) : (
					<Button
						size="icon"
						onClick={doStart}
						disabled={!hasSubject}
						className={cn(
							"size-11 rounded-full",
							hasSubject
								? "bg-[--system-accent] hover:bg-[--system-accent]/90 animate-fade-in-scale"
								: "bg-muted cursor-not-allowed",
						)}
					>
						<HugeiconsIcon icon={Play} className="size-4 ml-0.5" />
					</Button>
				)}
			</div>

			{hasSubject ? (
				<QuizStartState onSelect={doStart} />
			) : (
				<QuizSubjectPrompt onSelect={() => {}} hasSubject={false} />
			)}
		</div>
	);
}
