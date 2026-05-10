"use client";

import { TimerDisplay } from "@/components/shared/timer-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface QuizEngineHeaderProps {
	elapsedTime: number;
	currentQuestionIndex: number;
	totalQuestions: number;
	difficulty: "easy" | "medium" | "hard";
	onQuit?: () => void;
	className?: string;
}

export function QuizEngineHeader({
	elapsedTime,
	currentQuestionIndex,
	totalQuestions,
	difficulty,
	onQuit,
	className,
}: QuizEngineHeaderProps) {
	const progressValue = ((currentQuestionIndex + 1) / totalQuestions) * 100;

	const difficultyColors = {
		easy: "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30",
		medium:
			"bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
		hard: "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30",
	};

	return (
		<div className={cn("space-y-3", className)}>
			<div className="flex items-center justify-between">
				<Button
					variant="ghost"
					size="sm"
					onClick={onQuit}
					className="font-medium text-muted-foreground hover:text-foreground hover:bg-destructive/10"
				>
					<span className="text-lg">×</span>
					<span className="ml-1">Quit</span>
				</Button>
				<div className="flex items-center gap-2">
					<TimerDisplay
						elapsedTime={elapsedTime}
						variant="inline"
						showIcon={false}
					/>
					<span className="text-muted-foreground">·</span>
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
					<span className="text-sm font-mono text-muted-foreground">
						{currentQuestionIndex + 1}/{totalQuestions}
					</span>
				</div>
			</div>

			<Progress value={progressValue} className="h-1.5" />
		</div>
	);
}
