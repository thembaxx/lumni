"use client";

import {
	ArrowLeft01Icon,
	ArrowRight01Icon,
	Forward01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
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
	hasSelected: _hasSelected,
	showFeedback,
	onPrevious,
	onNext,
	onSkip,
	showSkip = false,
}: QuizControlsProps) {
	const t = useTranslations();
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
					{isLast ? t("quiz.seeResults") : t("quiz.nextQuestion")}
					{!isLast && (
						<HugeiconsIcon icon={ArrowRight01Icon} data-icon="inline-end" />
					)}
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
				<HugeiconsIcon icon={ArrowLeft01Icon} data-icon="inline-start" />
				{t("quiz.previous")}
			</Button>
			{showSkip && onSkip && (
				<Button variant="outline" onClick={onSkip} className="flex-1">
					{t("common.skip")}
					<HugeiconsIcon icon={Forward01Icon} data-icon="inline-end" />
				</Button>
			)}
		</div>
	);
}
