"use client";

import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import type { useSolver } from "@/hooks/use-solver";
import type { Option, UserAnswer } from "@/lib/question-engine/types";
import { cn } from "@/lib/shared";

type Solver = ReturnType<typeof useSolver>;

interface QuestionCardControlsProps {
	isMCQ: boolean;
	options: Option[];
	handleMCQSelect: (optionId: string) => void;
	handleMCQSubmit: () => void;
	handleGrade: (answer: UserAnswer) => Promise<void>;
	isGrading: boolean;
	onNext?: () => void;
	onAnswered?: (correct: boolean, score: number) => void;
	isSubmitted: boolean;
	questionNumber?: number;
	totalQuestions?: number;
	effectiveSubject: string;
	solver: Solver;
	isSolverEnabled: boolean;
	handleFollowUp: () => void;
	followUpInput: string;
	setFollowUpInput: React.Dispatch<React.SetStateAction<string>>;
}

export function QuestionCardControls({
	isMCQ: _isMCQ,
	options: _options,
	handleMCQSelect: _handleMCQSelect,
	handleMCQSubmit: _handleMCQSubmit,
	handleGrade: _handleGrade,
	isGrading: _isGrading,
	onNext,
	isSubmitted,
	questionNumber,
	totalQuestions,
	effectiveSubject: _effectiveSubject,
	solver: _solver,
	isSolverEnabled: _isSolverEnabled,
	handleFollowUp: _handleFollowUp,
	followUpInput: _followUpInput,
	setFollowUpInput: _setFollowUpInput,
}: QuestionCardControlsProps) {
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
						? "Next"
						: "Finish"}
					<HugeiconsIcon icon={ArrowRight01Icon} data-icon />
				</Button>
			)}
		</div>
	);
}
