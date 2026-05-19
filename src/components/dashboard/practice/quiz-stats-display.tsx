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
				"flex items-center gap-3 rounded-full border border-muted bg-muted/30 py-2 pl-4 transition-opacity duration-300",
				isDisabled && "pointer-events-none opacity-30",
				className,
			)}
		>
			<TimerDisplay
				elapsedTime={elapsedTime}
				formatTimeFn={formatTime}
				showIcon={false}
			/>

			<div className="h-4 w-px bg-muted" />

			<div className="flex min-w-14 items-center gap-2">
				<HugeiconsIcon icon={FlashIcon} className="size-4 text-warning" />
				<span className="font-mono font-semibold text-sm tabular-nums">
					{points}
				</span>
			</div>
		</div>
	);
}
