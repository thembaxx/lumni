"use client";

import { Timer } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizTimerProps {
	elapsedTime: number;
	formatTime: (seconds: number) => string;
	className?: string;
}

export function QuizTimer({
	elapsedTime,
	formatTime,
	className,
}: QuizTimerProps) {
	return (
		<div className={cn("flex items-center gap-2 min-w-16", className)}>
			<Timer className="size-4 text-muted-foreground" />
			<span className="text-sm font-medium tabular-nums font-mono tracking-tight">
				{formatTime(elapsedTime)}
			</span>
		</div>
	);
}
