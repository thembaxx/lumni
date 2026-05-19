import { m } from "framer-motion";
import { cn } from "@/lib/shared";
import { iOSEase } from "@/lib/utils/animation";

type ProgressBarColor = "accent" | "success" | "warning" | "destructive";

const colorRecord: Record<ProgressBarColor, string> = {
	accent: "bg-[--system-accent]",
	success: "bg-success",
	warning: "bg-warning",
	destructive: "bg-destructive",
};

interface AnimatedProgressBarProps {
	value: number;
	size?: "sm" | "md" | "lg" | "xl";
	color?: ProgressBarColor;
	animated?: boolean;
	trackClassName?: string;
	className?: string;
}

const sizeStyles = {
	sm: "h-1",
	md: "h-1.5",
	lg: "h-2",
	xl: "h-3",
};

export function AnimatedProgressBar({
	value,
	size = "md",
	color = "accent",
	animated = true,
	trackClassName,
	className,
}: AnimatedProgressBarProps) {
	const colorClass = colorRecord[color];
	const clampedValue = Math.max(0, Math.min(100, value));

	const track = cn(
		"rounded-full overflow-hidden",
		sizeStyles[size],
		trackClassName ?? "bg-secondary/50",
	);

	const fill = (
		<div
			className={cn("h-full rounded-full", colorClass)}
			style={!animated ? { width: `${clampedValue}%` } : undefined}
		/>
	);

	const animatedFill = (
		<m.div
			className={cn("h-full rounded-full", colorClass)}
			initial={{ width: 0 }}
			animate={{ width: `${clampedValue}%` }}
			transition={{ duration: 0.8, ease: iOSEase }}
		/>
	);

	return (
		<div className={cn(track, className)}>{animated ? animatedFill : fill}</div>
	);
}
