"use client";

import { Minus, Play, Plus, RotateCcw, Square } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { useInterval } from "@/hooks";
import { cn } from "@/lib/utils";

const DEFAULT_TIME = 25 * 60;
const MAX_TIME = 60 * 60;

interface FocusTabProps {
	className?: string;
}

export function FocusTab({ className }: FocusTabProps) {
	const [timeLeft, setTimeLeft] = useState(DEFAULT_TIME);
	const [isRunning, setIsRunning] = useState(false);
	const [initialTime, setInitialTime] = useState(DEFAULT_TIME);

	const progress = initialTime > 0 ? (timeLeft / initialTime) * 100 : 0;

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
	};

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
		if (timeLeft === 0) {
			setTimeLeft(initialTime);
		}
		setIsRunning(true);
	};

	const handleStop = () => {
		setIsRunning(false);
	};

	const handleReset = () => {
		setIsRunning(false);
		setTimeLeft(DEFAULT_TIME);
		setInitialTime(DEFAULT_TIME);
	};

	const handleMinusFive = () => {
		const newTime = Math.max(60, timeLeft - 5 * 60);
		setTimeLeft(newTime);
		if (!isRunning) {
			setInitialTime(newTime);
		}
	};

	const handleAddFive = () => {
		const newTime = Math.min(MAX_TIME, timeLeft + 5 * 60);
		setTimeLeft(newTime);
		if (!isRunning) {
			setInitialTime(newTime);
		}
	};

	const _chartData = [
		{
			fill: "var(--color-timer)",
			value: progress,
		},
	];

	const chartConfig = {
		timer: {
			label: "Time",
			color: "hsl(var(--chart-2))",
		},
	};

	return (
		<div className={cn("flex flex-col items-center gap-6", className)}>
			<div className="relative">
				<ChartContainer config={chartConfig} className="size-48">
					<div className="absolute inset-0 flex items-center justify-center">
						<span className="text-4xl font-bold tabular-nums tracking-tight">
							{formatTime(timeLeft)}
						</span>
					</div>
					<ChartTooltip
						content={<ChartTooltipContent hideIndicator />}
						cursor={false}
					/>
				</ChartContainer>
				<svg className="absolute inset-0 size-full pointer-events-none -rotate-90">
					<circle
						cx="50%"
						cy="50%"
						r="42%"
						fill="none"
						stroke="currentColor"
						strokeWidth="8"
						className="text-muted/20"
					/>
					<circle
						cx="50%"
						cy="50%"
						r="42%"
						fill="none"
						stroke="currentColor"
						strokeWidth="8"
						strokeDasharray="264"
						strokeDashoffset={264 - (264 * progress) / 100}
						strokeLinecap="round"
						className="text-foreground transition-colors duration-500 ease-in-out"
					/>
				</svg>
			</div>

			<div className="flex items-center gap-3">
				<Button
					variant="outline"
					size="icon"
					onClick={handleMinusFive}
					disabled={isRunning || timeLeft <= 60}
					className="size-12"
				>
					<Minus className="size-5" />
				</Button>

				{isRunning ? (
					<Button
						size="icon"
						onClick={handleStop}
						className="size-16 rounded-full"
					>
						<Square className="size-6 fill-current" />
					</Button>
				) : (
					<Button
						size="icon"
						onClick={handleStart}
						className="size-16 rounded-full"
					>
						<Play className="size-6 ml-1" />
					</Button>
				)}

				<Button
					variant="outline"
					size="icon"
					onClick={handleAddFive}
					disabled={isRunning || timeLeft >= MAX_TIME}
					className="size-12"
				>
					<Plus className="size-5" />
				</Button>
			</div>

			<Button
				variant="ghost"
				size="sm"
				onClick={handleReset}
				className="text-muted-foreground hover:text-foreground"
			>
				<RotateCcw className="size-4 mr-2" />
				Reset Timer
			</Button>
		</div>
	);
}
