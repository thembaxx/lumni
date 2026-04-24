import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Difficulty, getDifficultyColor } from "@/lib/utils/colors";

interface DifficultyBadgeProps {
	difficulty: Difficulty;
	className?: string;
}

export function DifficultyBadge({
	difficulty,
	className,
}: DifficultyBadgeProps) {
	return (
		<Badge
			className={cn(
				"px-3 py-0.5 text-[10px] uppercase font-medium bg-primary/10 rounded-full",
				getDifficultyColor(difficulty),
				className,
			)}
		>
			{difficulty}
		</Badge>
	);
}
