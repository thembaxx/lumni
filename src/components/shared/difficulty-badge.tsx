import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
	type Difficulty,
	getDifficultyColor,
	getQuizDifficultyColor,
} from "@/lib/utils/colors";

export type DifficultyBadgeVariant = "default" | "quiz";

type DifficultyInput = "easy" | "medium" | "hard" | "Easy" | "Medium" | "Hard";

function normalizeDifficulty(difficulty: DifficultyInput): Difficulty {
	return difficulty.toLowerCase() as Difficulty;
}

interface DifficultyBadgeProps {
	difficulty: DifficultyInput;
	variant?: DifficultyBadgeVariant;
	className?: string;
}

export function DifficultyBadge({
	difficulty,
	variant = "default",
	className,
}: DifficultyBadgeProps) {
	const normalizedDifficulty = normalizeDifficulty(difficulty);
	const colorClass =
		variant === "quiz"
			? getQuizDifficultyColor(normalizedDifficulty)
			: getDifficultyColor(normalizedDifficulty);

	return (
		<Badge
			className={cn(
				"px-3 py-0.5 text-[10px] uppercase font-medium bg-primary/10 rounded-full",
				colorClass,
				className,
			)}
		>
			{normalizedDifficulty}
		</Badge>
	);
}
