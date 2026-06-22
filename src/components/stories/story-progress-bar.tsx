"use client";

import CheckmarkCircle01Icon from "@hugeicons/core-free-icons/CheckmarkCircle01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";

interface StoryProgressBarProps {
	scrollPercent: number;
	completed: boolean;
}

export function StoryProgressBar({
	scrollPercent,
	completed,
}: StoryProgressBarProps) {
	const pct = Math.min(Math.max(scrollPercent, 0), 100);

	const barColor = completed
		? "bg-emerald-500"
		: pct >= 50
			? "bg-sky-500"
			: "bg-emerald-500/70";

	return (
		<div className="flex items-center gap-3">
			<progress
				className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
				value={pct}
				max={100}
				aria-label={`Reading progress: ${pct}%`}
			>
				<div
					className={cn(
						"absolute inset-y-0 left-0 rounded-full transition-all duration-300",
						barColor,
					)}
					style={{ width: `${pct}%` }}
				/>
			</progress>
			{completed ? (
				<span className="flex items-center gap-1 whitespace-nowrap font-medium text-emerald-500 text-xs">
					<HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-3.5" />
					Completed
				</span>
			) : (
				<span className="whitespace-nowrap text-muted-foreground text-xs tabular-nums">
					{pct}%
				</span>
			)}
		</div>
	);
}
