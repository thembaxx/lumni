"use client";

import {
	MinusSignFreeIcons,
	PauseFreeIcons,
	PlayFreeIcons,
	PlusSignFreeIcons,
	RotateClockwiseFreeIcons,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadialChart } from "@/components/ui/charts/radial-chart";
import { useInterval } from "@/hooks/use-interval";
import { cn } from "@/lib/shared";

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
			<CardContent className="flex items-center justify-between gap-4 p-4">
				<div className="flex items-center gap-4">
					<RadialChart
						value={progress}
						size={80}
						color="var(--system-accent)"
						className="shrink-0"
					>
						<span className="font-extrabold font-mono text-[11px] tabular-nums tracking-tight">
							{formatTime(timeLeft)}
						</span>
					</RadialChart>
					<div>
						<h3 className="font-semibold text-[12.8px]">Focus Timer</h3>
						<p className="text-muted-foreground text-xs">
							{isRunning
								? "Running…"
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
						className="size-8 rounded-full"
						aria-label="Subtract 5 minutes"
					>
						<HugeiconsIcon icon={MinusSignFreeIcons} className="size-4" />
					</Button>

					<Button
						variant={isRunning ? "secondary" : "default"}
						size="icon-sm"
						onClick={isRunning ? handleStop : handleStart}
						className={cn(
							"size-10 rounded-full",
							!isRunning && "bg-system-accent hover:bg-system-accent/90",
						)}
						aria-label={isRunning ? "Pause timer" : "Start timer"}
					>
						{isRunning ? (
							<HugeiconsIcon
								icon={PauseFreeIcons}
								className="size-4 fill-current"
							/>
						) : (
							<HugeiconsIcon
								icon={PlayFreeIcons}
								className="ml-0.5 size-4 fill-current"
							/>
						)}
					</Button>

					<Button
						variant="ghost"
						size="icon-sm"
						onClick={handleAddFive}
						disabled={isRunning || timeLeft >= MAX_TIME}
						className="size-8 rounded-full"
						aria-label="Add 5 minutes"
					>
						<HugeiconsIcon icon={PlusSignFreeIcons} className="size-4" />
					</Button>

					<Button
						variant="ghost"
						size="icon-sm"
						onClick={handleReset}
						className="size-8 rounded-full text-muted-foreground"
						aria-label="Reset timer"
					>
						<HugeiconsIcon icon={RotateClockwiseFreeIcons} className="size-4" />
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
