"use client";

import { FlashIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { TimerDisplay } from "@/components/shared/timer-display";
import { cn } from "@/lib/shared";

interface QuizStatsDisplayProps {
	elapsedTime: number;
	points: number;
	formatTime: (seconds: number) => string;
	isDisabled?: boolean;
	className?: string;
}

export function QuizStatsDisplay({
	elapsedTime,
	points,
	formatTime,
	isDisabled,
	className,
}: QuizStatsDisplayProps) {
	return (
		<div
			className={cn(
				"flex items-center gap-3 pl-4 py-2 rounded-full bg-muted/30 border border-muted transition-opacity duration-300",
				isDisabled && "opacity-30 pointer-events-none",
				className,
			)}
		>
			<TimerDisplay
				elapsedTime={elapsedTime}
				formatTimeFn={formatTime}
				showIcon={false}
			/>

			<div className="w-px h-4 bg-muted" />

			<div className="flex items-center gap-2 min-w-14">
				<HugeiconsIcon icon={FlashIcon} className="size-4 text-warning" />
				<span className="text-sm font-semibold tabular-nums font-mono">
					{points}
				</span>
			</div>
		</div>
	);
}
