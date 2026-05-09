"use client";

import { TimerDisplay } from "@/components/shared/timer-display";

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
		<TimerDisplay
			elapsedTime={elapsedTime}
			formatTimeFn={formatTime}
			variant="default"
			className={className}
		/>
	);
}

export { TimerDisplay };
