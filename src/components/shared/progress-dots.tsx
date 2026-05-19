"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/shared";

export type ProgressDotsVariant = "quiz" | "engine" | "results";

interface ProgressDotsProps {
	total: number;
	currentIndex: number;
	completedCount?: number;
	variant?: ProgressDotsVariant;
	className?: string;
	onDotClick?: (index: number) => void;
}

const variantStyles = {
	quiz: {
		current: "bg-[--system-accent]",
		completed: "bg-success",
		pending: "bg-muted",
	},
	engine: {
		current: "bg-[--system-accent]",
		completed: "bg-[--system-accent]/50",
		pending: "bg-muted",
	},
	results: {
		current: "bg-success",
		completed: "bg-success",
		pending: "bg-muted",
	},
};

export function ProgressDots({
	total,
	currentIndex,
	completedCount,
	variant = "quiz",
	className,
	onDotClick,
}: ProgressDotsProps) {
	const styles = variantStyles[variant];

	return (
		<div className={cn("flex justify-center gap-1", className)}>
			{Array.from({ length: total }).map((_, idx) => {
				const isCompleted =
					completedCount !== undefined
						? idx < completedCount
						: idx < currentIndex;
				const isCurrent = idx === currentIndex;

				let dotClass = styles.pending;
				if (variant === "results") {
					dotClass = isCompleted ? styles.completed : styles.pending;
				} else {
					dotClass = isCurrent
						? styles.current
						: isCompleted
							? styles.completed
							: styles.pending;
				}

				return (
					<Button
						key={idx}
						type="button"
						variant="ghost"
						onClick={() => onDotClick?.(idx)}
						aria-label={`Go to question ${idx + 1}`}
						aria-current={isCurrent ? "step" : undefined}
						className={cn(
							"size-1.5 min-h-0 rounded-full p-0",
							dotClass,
							onDotClick && "hover:scale-125",
						)}
						disabled={!onDotClick}
					/>
				);
			})}
		</div>
	);
}
