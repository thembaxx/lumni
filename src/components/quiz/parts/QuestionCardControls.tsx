import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { m, motion } from "framer-motion";
import { useCallback } from "react";
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
	isMCQ,
	options,
	handleMCQSelect,
	handleMCQSubmit,
	handleGrade,
	isGrading,
	onNext,
	isSubmitted,
	questionNumber,
	totalQuestions,
	effectiveSubject,
	solver,
	isSolverEnabled,
	handleFollowUp,
	followUpInput,
	setFollowUpInput,
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
					<CaretRight data-icon />
				</Button>
			)}
		</div>
	);
}
