"use client";

import { Timer } from "@phosphor-icons/react";
import { cn } from "@/lib/shared";
import { formatTime } from "@/lib/shared/time";

export type TimerDisplayVariant = "default" | "inline" | "compact";

interface TimerDisplayProps {
	elapsedTime: number;
	formatTimeFn?: (seconds: number) => string;
	variant?: TimerDisplayVariant;
	showIcon?: boolean;
	className?: string;
}

const variantStyles = {
	default: {
		container:
			"flex items-center gap-2 min-w-16 px-2.5 py-1 rounded-full bg-muted/50",
		icon: "size-4",
		text: "text-sm font-medium tabular-nums font-mono",
	},
	inline: {
		container: "flex items-center gap-1.5",
		icon: "size-3.5",
		text: "text-sm font-medium tabular-nums font-mono",
	},
	compact: {
		container: "flex items-center gap-2",
		icon: "size-3",
		text: "text-xs font-medium tabular-nums",
	},
};

export function TimerDisplay({
	elapsedTime,
	formatTimeFn = formatTime,
	variant = "default",
	showIcon = true,
	className,
}: TimerDisplayProps) {
	const styles = variantStyles[variant];

	return (
		<div className={cn(styles.container, className)}>
			{showIcon && (
				<Timer className={cn("text-muted-foreground", styles.icon)} />
			)}
			<span className={styles.text}>{formatTimeFn(elapsedTime)}</span>
		</div>
	);
}
