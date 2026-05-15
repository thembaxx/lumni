"use client";

import { m } from "framer-motion";
import { Progress, ProgressIndicator } from "@/components/ui/progress";
import { cn } from "@/lib/shared";
import { iOSEase } from "@/lib/utils/animation";

export type AccuracyBarVariant = "default" | "animated" | "simple";

interface AccuracyBarProps {
	accuracy: number;
	showLabel?: boolean;
	variant?: AccuracyBarVariant;
	size?: "sm" | "md" | "lg";
	className?: string;
}

function getAccuracyColor(accuracy: number): string {
	if (accuracy >= 70) return "bg-success";
	if (accuracy >= 50) return "bg-warning";
	return "bg-destructive";
}

function getAccuracyLabel(accuracy: number): string {
	if (accuracy >= 70) return "Excellent";
	if (accuracy >= 50) return "Good";
	if (accuracy >= 30) return "Needs Practice";
	return "Keep Trying";
}

const sizeStyles = {
	sm: "h-1",
	md: "h-2",
	lg: "h-3",
};

export function AccuracyBar({
	accuracy,
	showLabel = true,
	variant = "default",
	size = "md",
	className,
}: AccuracyBarProps) {
	const colorClass = getAccuracyColor(accuracy);

	if (variant === "simple") {
		return (
			<Progress value={accuracy} className={cn(sizeStyles[size], className)}>
				<ProgressIndicator className={colorClass} />
			</Progress>
		);
	}

	if (variant === "animated") {
		return (
			<div className={cn("w-full", className)}>
				{showLabel && (
					<div className="flex items-center justify-between mb-2">
						<span className="text-sm text-muted-foreground">
							{getAccuracyLabel(accuracy)}
						</span>
						<span className="text-sm font-medium tabular-nums">
							{accuracy}%
						</span>
					</div>
				)}
				<div
					className={cn(
						"bg-muted rounded-full overflow-hidden",
						sizeStyles[size],
					)}
				>
					<m.div
						className={cn("h-full rounded-full", colorClass)}
						initial={{ width: 0 }}
						animate={{ width: `${accuracy}%` }}
						transition={{
							duration: 0.8,
							ease: iOSEase,
						}}
					/>
				</div>
			</div>
		);
	}

	return (
		<div className={cn("w-full", className)}>
			{showLabel && (
				<div className="flex items-center justify-between mb-2">
					<span className="text-sm text-muted-foreground">Accuracy</span>
					<span className="text-sm font-medium tabular-nums">{accuracy}%</span>
				</div>
			)}
			<div
				className={cn(
					"bg-muted rounded-full overflow-hidden",
					sizeStyles[size],
				)}
			>
				<div
					className={cn("h-full rounded-full", colorClass)}
					style={{ width: `${accuracy}%` }}
				/>
			</div>
		</div>
	);
}

export { getAccuracyColor, getAccuracyLabel };
