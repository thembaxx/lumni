"use client";

import {
	ArrowDown,
	Lightning,
	PlayIcon,
	Square,
	Timer,
} from "@phosphor-icons/react";
import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useState } from "react";
import { SubjectsDrawer } from "@/components/dashboard/drawers/subjects-drawer";
import {
	QuizControls,
	QuizStartState,
	QuizSubjectPrompt,
} from "@/components/quiz";
import { QuestionCard } from "@/components/quiz/question-card";
import { Anim } from "@/components/shared/anim";
import { PerpetualFloat } from "@/components/shared/perpetual-float";
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
	const shouldReduceMotion = useReducedMotion();

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
			<div className="grid grid-cols-12 gap-0 min-h-[calc(100dvh-var(--spacing-safe-pt))]">
				{/* Main quiz — left column */}
				<div className="col-span-12 md:col-span-7 col-start-1 p-4 pb-20">
					<Anim>
						<div className="w-full max-w-2xl flex flex-col gap-4">
							<div className="animate-fade-in flex flex-col gap-4">
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
													(correctAnswers / (currentQuestionIndex + 1 || 1)) *
														100,
												)
											: 0
									}
									onQuit={handleStop}
								/>
							</div>

							<motion.div
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
							</motion.div>

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
					</Anim>
				</div>

				{/* Decorative accent — right zone */}
				<div className="col-span-12 md:col-span-5 col-start-1 md:col-start-8 relative overflow-hidden bg-system-surface/30">
					{!shouldReduceMotion && (
						<PerpetualFloat
							className="absolute right-8 top-1/2 -translate-y-1/2"
							duration={10}
							offsetY={-16}
						>
							<div className="size-24 rounded-2xl bg-[--system-accent]/10 blur-xl" />
						</PerpetualFloat>
					)}
					<div className="absolute inset-0 bg-gradient-to-br from-[--system-accent]/10 via-transparent to-transparent" />
					<div className="absolute inset-0 flex items-center justify-center p-8">
						<div className="w-full h-full max-w-xs aspect-square rounded-3xl bg-system-accent/10 blur-2xl animate-float-slow" />
					</div>
				</div>
			</div>
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
						size="sm"
						className="rounded-md pl-3 border-muted bg-muted/50"
						disabled={isRunning}
					>
						<div className="flex items-center gap-3">
							{hasSubject ? selectedSubject : "Subject"}
							<ArrowDown />
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
						<Lightning className="size-4 text-warning" />
						<span className="text-sm font-semibold tabular-nums font-mono">
							{points}
						</span>
					</div>
				</div>

				{isRunning ? (
					<Button
						size="icon"
						onClick={handleStop}
						className="rounded-full bg-destructive hover:bg-destructive/90"
					>
						<Square className="size-4" />
					</Button>
				) : (
					<Button
						size="icon"
						onClick={doStart}
						disabled={!hasSubject}
						className={cn(
							"rounded-full",
							hasSubject
								? "bg-[--system-accent] hover:bg-[--system-accent]/90 animate-fade-in-scale"
								: "bg-muted cursor-not-allowed",
						)}
					>
						<PlayIcon className="size-4 ml-0.5" />
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
