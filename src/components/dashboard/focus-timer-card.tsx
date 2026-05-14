"use client";

import {
	ArrowCounterClockwise,
	Minus,
	Pause,
	Play,
	Plus,
} from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useInterval } from "@/hooks/use-interval";
import { cn } from "@/lib/utils";

const DEFAULT_TIME = 25 * 60;
const MAX_TIME = 60 * 60;

function formatTime(seconds: number): string {
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function FocusTimerCard() {
	const [timeLeft, setTimeLeft] = useState(DEFAULT_TIME);
	const [isRunning, setIsRunning] = useState(false);
	const [initialTime, setInitialTime] = useState(DEFAULT_TIME);

	const progress = initialTime > 0 ? (timeLeft / initialTime) * 100 : 0;

	useInterval(
		() => {
			setTimeLeft((prev) => {
				if (prev <= 1) {
					setIsRunning(false);
					return 0;
				}
				return prev - 1;
			});
		},
		isRunning && timeLeft > 0 ? 1000 : null,
	);

	const handleStart = () => {
		if (timeLeft === 0) setTimeLeft(initialTime);
		setIsRunning(true);
	};

	const handleStop = () => setIsRunning(false);

	const handleReset = () => {
		setIsRunning(false);
		setTimeLeft(DEFAULT_TIME);
		setInitialTime(DEFAULT_TIME);
	};

	const handleMinusFive = () => {
		const newTime = Math.max(60, timeLeft - 5 * 60);
		setTimeLeft(newTime);
		if (!isRunning) setInitialTime(newTime);
	};

	const handleAddFive = () => {
		const newTime = Math.min(MAX_TIME, timeLeft + 5 * 60);
		setTimeLeft(newTime);
		if (!isRunning) setInitialTime(newTime);
	};

	return (
		<Card className="overflow-hidden rounded-[1.5rem]">
			<CardContent className="p-4 flex items-center justify-between gap-4">
				<div className="flex items-center gap-4">
					<div className="relative size-14 shrink-0">
						<svg className="absolute inset-0 size-full -rotate-90">
							<circle
								cx="28"
								cy="28"
								r="24"
								fill="none"
								stroke="currentColor"
								strokeWidth="4"
								className="text-muted/20"
							/>
							<circle
								cx="28"
								cy="28"
								r="24"
								fill="none"
								stroke="currentColor"
								strokeWidth="4"
								strokeDasharray={2 * Math.PI * 24}
								strokeDashoffset={2 * Math.PI * 24 * (1 - progress / 100)}
								strokeLinecap="round"
								className="text-system-accent transition-all duration-500"
							/>
						</svg>
						<span className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums tracking-tight">
							{formatTime(timeLeft)}
						</span>
					</div>
					<div>
						<h3 className="text-sm font-semibold">Focus Timer</h3>
						<p className="text-xs text-muted-foreground">
							{isRunning
								? "Running..."
								: timeLeft === 0
									? "Time's up!"
									: "Paused"}
						</p>
					</div>
				</div>

				<div className="flex items-center gap-1.5">
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={handleMinusFive}
						disabled={isRunning || timeLeft <= 60}
						className="rounded-full size-8"
						aria-label="Subtract 5 minutes"
					>
						<Minus className="size-4" />
					</Button>

					<Button
						variant={isRunning ? "secondary" : "default"}
						size="icon-sm"
						onClick={isRunning ? handleStop : handleStart}
						className={cn(
							"rounded-full size-10",
							!isRunning && "bg-system-accent hover:bg-system-accent/90",
						)}
						aria-label={isRunning ? "Pause timer" : "Start timer"}
					>
						{isRunning ? (
							<Pause className="size-4 fill-current" />
						) : (
							<Play className="size-4 ml-0.5 fill-current" />
						)}
					</Button>

					<Button
						variant="ghost"
						size="icon-sm"
						onClick={handleAddFive}
						disabled={isRunning || timeLeft >= MAX_TIME}
						className="rounded-full size-8"
						aria-label="Add 5 minutes"
					>
						<Plus className="size-4" />
					</Button>

					<Button
						variant="ghost"
						size="icon-sm"
						onClick={handleReset}
						className="rounded-full size-8 text-muted-foreground"
						aria-label="Reset timer"
					>
						<ArrowCounterClockwise className="size-4" />
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
