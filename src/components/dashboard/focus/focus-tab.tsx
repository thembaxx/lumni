"use client";

import {
	Add01Icon,
	MinusSignIcon,
	PlayFreeIcons,
	SquareIcon,
	UndoIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RadialChart } from "@/components/ui/charts/radial-chart";
import { useInterval } from "@/hooks";
import { cn } from "@/lib/shared";

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

	return (
		<div className={cn("flex flex-col items-center gap-6", className)}>
			<RadialChart value={progress} size={192} color="var(--foreground)">
				<span className="text-4xl font-extrabold tabular-nums tracking-tight">
					{formatTime(timeLeft)}
				</span>
			</RadialChart>

			<div className="flex items-center gap-3">
				<Button
					variant="outline"
					size="icon"
					onClick={handleMinusFive}
					disabled={isRunning || timeLeft <= 60}
				>
					<HugeiconsIcon icon={MinusSignIcon} className="size-5" />
				</Button>

				{isRunning ? (
					<Button size="icon" onClick={handleStop} className="rounded-full">
						<HugeiconsIcon icon={SquareIcon} className="size-6 fill-current" />
					</Button>
				) : (
					<Button size="icon" onClick={handleStart} className="rounded-full">
						<HugeiconsIcon icon={PlayFreeIcons} className="size-6 ml-1" />
					</Button>
				)}

				<Button
					variant="outline"
					size="icon"
					onClick={handleAddFive}
					disabled={isRunning || timeLeft >= MAX_TIME}
				>
					<HugeiconsIcon icon={Add01Icon} className="size-5" />
				</Button>
			</div>

			<Button
				variant="ghost"
				size="sm"
				onClick={handleReset}
				className="text-muted-foreground hover:text-foreground"
			>
				<HugeiconsIcon icon={UndoIcon} className="size-4 mr-2" />
				Reset Timer01Icon
			</Button>
		</div>
	);
}
