"use client";

import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuizTimer } from "./quiz-timer";

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
			<QuizTimer elapsedTime={elapsedTime} formatTime={formatTime} />

			<div className="w-px h-4 bg-muted" />

			<div className="flex items-center gap-2 min-w-14">
				<Zap className="size-4 text-yellow-500 dark:text-yellow-400" />
				<span className="text-sm font-semibold tabular-nums font-mono">
					{points}
				</span>
			</div>
		</div>
	);
}
