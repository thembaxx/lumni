"use client";

import { QuizControls } from "@/components/quiz";
import { ProgressDots } from "@/components/shared/progress-dots";

interface QuizFooterProps {
	currentIndex: number;
	totalQuestions: number;
	hasSelected: boolean;
	showFeedback: boolean;
	variant?: "full" | "compact";
	onPrevious: () => void;
	onNext: () => void;
	onSkip: () => void;
}

export function QuizFooter({
	currentIndex,
	totalQuestions,
	hasSelected,
	showFeedback,
	variant = "full",
	onPrevious,
	onNext,
	onSkip,
}: QuizFooterProps) {
	return (
		<>
			<QuizControls
				currentQuestionIndex={currentIndex}
				totalQuestions={totalQuestions}
				hasSelected={hasSelected}
				showFeedback={showFeedback}
				onPrevious={onPrevious}
				onNext={onNext}
				onSkip={onSkip}
				showSkip={variant === "full" && !hasSelected}
			/>
			<ProgressDots
				total={totalQuestions}
				currentIndex={currentIndex}
				variant="quiz"
			/>
		</>
	);
}
