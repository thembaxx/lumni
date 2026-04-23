"use client";

import { Home, RotateCcw, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { calculateAccuracy, formatTime } from "@/lib/utils/time";

interface QuizResultsCardProps {
	totalQuestions: number;
	correctAnswers: number;
	elapsedTime: number;
	onRestart?: () => void;
	onDashboard?: () => void;
	className?: string;
}

export function QuizResultsCard({
	totalQuestions,
	correctAnswers,
	elapsedTime,
	onRestart,
	onDashboard,
	className,
}: QuizResultsCardProps) {
	const accuracy = calculateAccuracy(correctAnswers, totalQuestions);

	return (
		<Card className={className}>
			<CardHeader className="text-center">
				<CardTitle>Quiz Complete!</CardTitle>
				<CardDescription>Great effort! Here are your results:</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid grid-cols-3 gap-4 text-center">
					<div className="p-4 rounded-lg bg-muted">
						<p className="text-2xl font-bold">{totalQuestions}</p>
						<p className="text-xs text-muted-foreground">Questions</p>
					</div>
					<div className="p-4 rounded-lg bg-muted">
						<p className="text-2xl font-bold text-green-500">
							{correctAnswers}
						</p>
						<p className="text-xs text-muted-foreground">Correct</p>
					</div>
					<div className="p-4 rounded-lg bg-muted">
						<p className="text-2xl font-bold">{accuracy}%</p>
						<p className="text-xs text-muted-foreground">Accuracy</p>
					</div>
				</div>
				<div className="flex items-center justify-center gap-2 text-muted-foreground">
					<Timer className="size-4" />
					<span className="text-sm">{formatTime(elapsedTime)}</span>
				</div>
				<div className="flex gap-2">
					{onDashboard && (
						<Button variant="outline" className="flex-1" onClick={onDashboard}>
							<Home className="size-4 mr-2" />
							Dashboard
						</Button>
					)}
					{onRestart && (
						<Button className="flex-1" onClick={onRestart}>
							<RotateCcw className="size-4 mr-2" />
							Try Again
						</Button>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

interface QuizResultsInlineProps {
	currentQuestionIndex: number;
	totalQuestions: number;
	correctAnswers: number;
}

export function QuizResultsInline({
	currentQuestionIndex,
	totalQuestions,
}: QuizResultsInlineProps) {
	return (
		<div className="flex justify-center gap-1">
			{Array.from({ length: totalQuestions }).map((_, idx) => (
				<div
					key={idx}
					className={
						idx < currentQuestionIndex
							? "h-1.5 w-1.5 rounded-full bg-green-500"
							: "h-1.5 w-1.5 rounded-full bg-muted"
					}
				/>
			))}
		</div>
	);
}
