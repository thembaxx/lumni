"use client";

import { Target, Timer, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { calculateAccuracy, formatTime } from "@/lib/utils/time";

interface QuizHeaderProps {
	elapsedTime: number;
	currentQuestionIndex: number;
	totalQuestions: number;
	correctAnswers: number;
	onQuit?: () => void;
	className?: string;
}

export function QuizHeader({
	elapsedTime,
	currentQuestionIndex,
	totalQuestions,
	correctAnswers,
	onQuit,
	className,
}: QuizHeaderProps) {
	const accuracy = calculateAccuracy(correctAnswers, currentQuestionIndex);
	const progressValue = ((currentQuestionIndex + 1) / totalQuestions) * 100;

	return (
		<div className={cn("space-y-4", className)}>
			<div className="flex items-center justify-between">
				<Button
					variant="ghost"
					size="sm"
					onClick={onQuit}
					className="font-medium hover:text-foreground hover:bg-destructive/10"
				>
					<X className="size-4 mr-1" />
					Quit
				</Button>
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50">
						<Timer className="size-3.5 text-muted-foreground" />
						<span className="text-sm font-medium tabular-nums font-mono">
							{formatTime(elapsedTime)}
						</span>
					</div>
					<span className="text-muted-foreground">|</span>
					<Badge variant="secondary" className="font-mono">
						{currentQuestionIndex + 1}/{totalQuestions}
					</Badge>
				</div>
				<div className="flex items-center gap-1.5">
					<Target className="size-3.5 text-green-500" />
					<span className="text-sm font-semibold tabular-nums font-mono text-green-500">
						{accuracy}%
					</span>
				</div>
			</div>

			<Progress value={progressValue} className="h-1.5" />
		</div>
	);
}
