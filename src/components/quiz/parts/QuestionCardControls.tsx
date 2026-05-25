"use client";

import { useTranslations } from "next-intl";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import type { UserAnswer } from "@/lib/question-engine/types";
import { cn } from "@/lib/shared";

interface QuestionCardControlsOptions {
	isMCQ?: boolean;
	isGrading?: boolean;
	isSubmitted?: boolean;
	isSolverEnabled?: boolean;
}

interface QuestionCardControlsProps {
	options: QuestionCardControlsOptions;
	handleGrade?: (answer: UserAnswer) => Promise<void>;
	onNext?: () => void;
	onAnswered?: (correct: boolean, score: number) => void;
	questionNumber?: number;
	totalQuestions?: number;
}

const DEFAULT_OPTIONS: QuestionCardControlsOptions = {};

export function QuestionCardControls({
	options: {
		isMCQ: _isMCQ,
		isGrading: _isGrading,
		isSubmitted,
		isSolverEnabled: _isSolverEnabled,
	} = DEFAULT_OPTIONS,
	onNext,
	questionNumber,
	totalQuestions,
}: QuestionCardControlsProps) {
	const t = useTranslations();
	return (
		<div
			className={cn(
				"flex items-center justify-between gap-3",
				isSubmitted && "opacity-0",
			)}
		>
			<div />
			{onNext && (
				<Button onClick={onNext} className="gap-2">
					{questionNumber != null &&
					totalQuestions != null &&
					questionNumber < totalQuestions
						? t("common.next")
						: t("common.finish")}
					<HugeiconsIcon icon={ArrowRight01Icon} data-icon />
				</Button>
			)}
		</div>
	);
}
