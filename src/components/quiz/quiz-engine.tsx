"use client";

import { RadialIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, m } from "framer-motion";
import { Anim } from "@/components/shared/anim";
import { ProgressDots } from "@/components/shared/progress-dots";
import { Card, CardContent } from "@/components/ui/card";
import { AssessmentHeader } from "@/components/ui/headers/assessment-header";
import type { QuizCompleteResult } from "@/lib/quiz";
import { useQuiz } from "@/lib/quiz";
import { iOSEase } from "@/lib/utils/animation";
import { AnimatedIcon } from "@/lib/utils/icon-mapping";
import { QuestionCard } from "./question-card";
import { QuizControls } from "./quiz-controls";
import { QuizResultsCard } from "./quiz-results";
import { DecorativeRightPanel } from "./quiz-view/decorative-right-panel";

export type { QuizCompleteResult as QuizResults };

interface QuizEngineProps {
	subjectId: string;
	onComplete?: (results: QuizCompleteResult) => void;
}

export function QuizEngine({ subjectId, onComplete }: QuizEngineProps) {
	const {
		questions,
		sources,
		isLoading,
		isError,
		state,
		currentAnswered,
		handleNext,
		handlePrevious,
		handleSkip,
		handleAnswered,
		handleStop,
		handleRestart,
	} = useQuiz({
		subject: subjectId,
		count: 10,
		questionType: "multiple-choice",
		autoStart: true,
		onComplete,
	});

	if (isLoading) {
		return (
			<div className="grid grid-cols-12 gap-0">
				<div className="col-span-12 col-start-1 flex items-center justify-center p-4 pb-20 md:col-span-7">
					<Card className="w-full max-w-md">
						<CardContent className="flex flex-col items-center gap-4 p-6">
							<m.div
								animate={{ rotate: 360 }}
								transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
								className="mx-auto size-8"
							>
								<HugeiconsIcon
									icon={RadialIcon}
									className="size-8 text-muted-foreground"
								/>
							</m.div>
							<p className="text-muted-foreground text-sm">
								Generating questions…
							</p>
						</CardContent>
					</Card>
				</div>
				<DecorativeRightPanel variant="accent" />
			</div>
		);
	}

	if (isError) {
		return (
			<div className="grid grid-cols-12 gap-0">
				<div className="col-span-12 col-start-1 flex items-center justify-center p-4 pb-20 md:col-span-7">
					<Card className="w-full max-w-md">
						<CardContent className="flex flex-col items-center gap-4 p-8">
							<AnimatedIcon name="error-state" className="size-16" />
							<p className="font-medium text-destructive">
								Failed to load questions.
							</p>
						</CardContent>
					</Card>
				</div>
				<DecorativeRightPanel variant="destructive" />
			</div>
		);
	}

	if (!questions?.length) {
		return (
			<div className="grid grid-cols-12 gap-0">
				<div className="col-span-12 col-start-1 flex items-center justify-center p-4 pb-20 md:col-span-7">
					<Card className="w-full max-w-md">
						<CardContent className="flex flex-col items-center gap-4 p-8">
							<AnimatedIcon name="empty-search" className="size-16" />
							<p className="text-muted-foreground">
								No questions available for this subject.
							</p>
							<p className="text-sm">Select a subject to start practicing.</p>
						</CardContent>
					</Card>
				</div>
				<DecorativeRightPanel variant="accent" />
			</div>
		);
	}

	if (state.isComplete) {
		return (
			<Anim>
				<QuizResultsCard
					totalQuestions={state.totalQuestions}
					correctAnswers={state.correctAnswers}
					elapsedTime={state.elapsedTime}
					subject={subjectId}
					sources={sources}
					onRestart={handleRestart}
					onDashboard={handleStop}
				/>
			</Anim>
		);
	}

	if (!state.currentQuestion) return null;

	return (
		<Anim>
			<div className="flex flex-col gap-4">
				<AssessmentHeader
					title={subjectId}
					elapsedTime={state.elapsedTime}
					currentQuestionIndex={state.questionNumber - 1}
					totalQuestions={state.totalQuestions}
					progressValue={(state.questionNumber / state.totalQuestions) * 100}
					difficulty={
						state.currentQuestion.difficulty.toLowerCase() as
							| "easy"
							| "medium"
							| "hard"
					}
					onQuit={handleStop}
				/>

				<AnimatePresence mode="wait" initial={false}>
					<m.div
						key={state.currentQuestion.id}
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -20 }}
						transition={{ duration: 0.2, ease: iOSEase }}
					>
						<QuestionCard
							question={state.currentQuestion}
							subject={subjectId}
							questionNumber={state.questionNumber}
							totalQuestions={state.totalQuestions}
							onNext={handleNext}
							onAnswered={handleAnswered}
						/>
					</m.div>
				</AnimatePresence>

				<QuizControls
					currentQuestionIndex={state.questionNumber - 1}
					totalQuestions={state.totalQuestions}
					hasSelected={currentAnswered}
					showFeedback={currentAnswered}
					onPrevious={handlePrevious}
					onNext={handleNext}
					onSkip={handleSkip}
					showSkip
				/>

				<ProgressDots
					total={state.totalQuestions}
					currentIndex={state.questionNumber - 1}
					variant="engine"
				/>
			</div>
		</Anim>
	);
}
