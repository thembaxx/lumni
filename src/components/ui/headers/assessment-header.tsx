"use client";

import { Target, X } from "@phosphor-icons/react";
import { TimerDisplay } from "@/components/shared/timer-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface AssessmentHeaderProps {
	title: string;
	elapsedTime: number;
	currentQuestionIndex: number;
	totalQuestions: number;
	progressValue: number;
	onQuit?: () => void;
	showAccuracy?: boolean;
	accuracy?: number;
	difficulty?: "easy" | "medium" | "hard";
	showMarks?: boolean;
	marks?: number;
	totalMarks?: number;
	showProgress?: boolean;
	timeRemaining?: number;
	formatTime?: (seconds: number) => string;
	className?: string;
}

const difficultyColors = {
	easy: "bg-success/20 text-success-foreground dark:text-success-foreground border-success/30",
	medium:
		"bg-warning/20 text-warning-foreground dark:text-warning-foreground border-warning/30",
	hard: "bg-destructive/20 text-destructive-foreground dark:text-destructive-foreground border-destructive/30",
};

export function AssessmentHeader({
	title,
	elapsedTime,
	currentQuestionIndex,
	totalQuestions,
	progressValue,
	onQuit,
	showAccuracy,
	accuracy,
	difficulty,
	showMarks,
	marks,
	totalMarks,
	showProgress = true,
	timeRemaining,
	formatTime,
	className,
}: AssessmentHeaderProps) {
	const isExam = timeRemaining !== undefined;

	return (
		<div className={cn("space-y-4", className)}>
			<div className="flex items-center justify-between gap-2 flex-wrap">
				{/* Left: Quit button */}
				{onQuit && (
					<Button
						variant="ghost"
						size="sm"
						onClick={onQuit}
						className="font-medium text-muted-foreground hover:text-foreground hover:bg-destructive/10"
					>
						<span className="text-lg leading-none">×</span>
						<span className="ml-1">Quit</span>
					</Button>
				)}

				{/* Center: Timer + difficulty/accuracy + question counter */}
				<div className="flex items-center gap-2 flex-wrap">
					<TimerDisplay
						elapsedTime={elapsedTime}
						variant="inline"
						showIcon={false}
						formatTimeFn={formatTime}
					/>

					{isExam && timeRemaining !== undefined && (
						<>
							<span className="text-muted-foreground">·</span>
							<span className="text-sm font-mono text-muted-foreground">
								{typeof formatTime === "function"
									? formatTime(timeRemaining)
									: `${Math.floor(timeRemaining / 60)}m ${timeRemaining % 60}s`}
							</span>
						</>
					)}

					<span className="text-muted-foreground">·</span>

					{difficulty && (
						<>
							<Badge
								variant="outline"
								className={cn(
									"font-mono text-xs border",
									difficultyColors[difficulty],
								)}
							>
								{difficulty}
							</Badge>
							<span className="text-muted-foreground">·</span>
						</>
					)}

					{showAccuracy && accuracy !== undefined && (
						<>
							<Target className="size-3.5 text-muted-foreground" />
							<span className="text-sm font-semibold tabular-nums text-muted-foreground">
								{accuracy}%
							</span>
							<span className="text-muted-foreground">·</span>
						</>
					)}

					<span className="text-sm font-mono text-muted-foreground">
						{currentQuestionIndex + 1}/{totalQuestions}
					</span>
				</div>

				{/* Right: Marks display (exam context) */}
				{showMarks && marks !== undefined && totalMarks !== undefined && (
					<div className="flex items-center gap-1.5">
						<span className="text-sm text-muted-foreground">Marks:</span>
						<span className="text-sm font-semibold tabular-nums text-muted-foreground">
							{marks}/{totalMarks}
						</span>
					</div>
				)}
			</div>

			{/* Optional progress bar */}
			{showProgress && <Progress value={progressValue} className="h-1.5" />}
		</div>
	);
}
