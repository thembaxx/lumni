"use client";

import { ChevronLeft, ChevronRight, SkipForward } from "lucide-react";
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
			<div className="space-y-2">
				<Button ref={nextButtonRef} className="w-full" onClick={onNext}>
					{isLast ? "See Results" : "Next Question"}
					{!isLast && <ChevronRight className="size-4 ml-2" />}
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
				<ChevronLeft className="size-4 mr-2" />
				Previous
			</Button>
			{showSkip && onSkip && (
				<Button variant="outline" onClick={onSkip} className="flex-1">
					Skip
					<SkipForward className="size-4 ml-2" />
				</Button>
			)}
		</div>
	);
}
