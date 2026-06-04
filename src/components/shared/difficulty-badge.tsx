import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/shared";
import { normalizeDifficulty } from "@/lib/shared/difficulty";
import { getDifficultyColor, getQuizDifficultyColor } from "@/lib/utils/colors";

export type DifficultyBadgeVariant = "default" | "quiz";

interface DifficultyBadgeProps {
	difficulty: string;
	variant?: DifficultyBadgeVariant;
	className?: string;
}

export function DifficultyBadge({
	difficulty,
	variant = "default",
	className,
}: DifficultyBadgeProps) {
	const normalized = normalizeDifficulty(difficulty);
	const colorClass =
		variant === "quiz"
			? getQuizDifficultyColor(normalized)
			: getDifficultyColor(normalized);

	return (
		<Badge
			variant="outline"
			className={cn(
				"rounded-full bg-[--system-accent]/10 px-3 py-0.5 font-medium text-[10px] uppercase",
				colorClass,
				className,
			)}
		>
			{normalized}
		</Badge>
	);
}
