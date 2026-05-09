"use client";

import { cn } from "@/lib/utils";

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
		current: "bg-primary",
		completed: "bg-green-500",
		pending: "bg-muted",
	},
	engine: {
		current: "bg-primary",
		completed: "bg-primary/50",
		pending: "bg-muted",
	},
	results: {
		current: "bg-green-500",
		completed: "bg-green-500",
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
					<button
						key={idx}
						type="button"
						onClick={() => onDotClick?.(idx)}
						className={cn(
							"h-1.5 w-1.5 rounded-full transition-all",
							dotClass,
							onDotClick && "cursor-pointer hover:scale-125",
						)}
						disabled={!onDotClick}
					/>
				);
			})}
		</div>
	);
}
