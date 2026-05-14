"use client";

import { CaretLeft, CaretRight, SkipForward } from "@phosphor-icons/react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";

interface QuizControlsProps {
	currentQuestionIndex: number;
	totalQuestions: number;
	hasSelected: boolean;
	showFeedback: boolean;
	onPrevious: () => void;
	onNext: () => void;
	onSkip?: () => void;
	showSkip?: boolean;
}

export function QuizControls({
	currentQuestionIndex,
	totalQuestions,
	hasSelected,
	showFeedback,
	onPrevious,
	onNext,
	onSkip,
	showSkip = false,
}: QuizControlsProps) {
	const isFirst = currentQuestionIndex === 0;
	const isLast = currentQuestionIndex === totalQuestions - 1;
	const nextButtonRef = useRef<HTMLButtonElement>(null);

	// Auto-focus the action button after feedback appears (accessibility)
	if (showFeedback && nextButtonRef.current) {
		nextButtonRef.current.focus();
	}

	if (showFeedback) {
		return (
			<div className="flex flex-col gap-2">
				<Button ref={nextButtonRef} className="w-full" onClick={onNext}>
					{isLast ? "See Results" : "Next Question"}
					{!isLast && <CaretRight data-icon="inline-end" />}
				</Button>
			</div>
		);
	}

	return (
		<div className="flex gap-2">
			<Button
				variant="outline"
				onClick={onPrevious}
				disabled={isFirst}
				className="flex-1"
			>
				<CaretLeft data-icon="inline-start" />
				Previous
			</Button>
			{showSkip && onSkip && (
				<Button variant="outline" onClick={onSkip} className="flex-1">
					Skip
					<SkipForward data-icon="inline-end" />
				</Button>
			)}
		</div>
	);
}
