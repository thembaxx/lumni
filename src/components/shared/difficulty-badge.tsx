import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/shared";
import {
	type DifficultyInput,
	getDifficultyColor,
	getQuizDifficultyColor,
} from "@/lib/utils/colors";

export type DifficultyBadgeVariant = "default" | "quiz";

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
	const normalizedDifficulty = difficulty.toLowerCase() as
		| "easy"
		| "medium"
		| "hard";
	const colorClass =
		variant === "quiz"
			? getQuizDifficultyColor(normalizedDifficulty)
			: getDifficultyColor(normalizedDifficulty);

	return (
		<Badge
			className={cn(
				"px-3 py-0.5 text-[10px] uppercase font-medium bg-[--system-accent]/10 rounded-full",
				colorClass,
				className,
			)}
		>
			{normalizedDifficulty}
		</Badge>
	);
}
