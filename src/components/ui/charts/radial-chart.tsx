"use client";

import { cn } from "@/lib/shared";

interface RadialChartProps {
	value: number;
	size?: number;
	color?: string;
	trackColor?: string;
	children?: React.ReactNode;
	className?: string;
}

export function RadialChart({
	value,
	size = 80,
	color = "var(--chart-2)",
	trackColor = "var(--muted)",
	children,
	className,
}: RadialChartProps) {
	const clampedValue = Math.min(100, Math.max(0, value));
	const radius = 15.9155;
	const circumference = 2 * Math.PI * radius;
	const offset = circumference - (clampedValue / 100) * circumference;

	return (
		<div
			className={cn("relative shrink-0", className)}
			style={{ width: size, height: size }}
		>
			<svg
				viewBox="0 0 36 36"
				className="absolute inset-0 size-full -rotate-90"
			>
				<title>Progress</title>
				<circle
					cx="18"
					cy="18"
					r={radius}
					fill="none"
					stroke={trackColor}
					strokeWidth="3"
				/>
				<circle
					cx="18"
					cy="18"
					r={radius}
					fill="none"
					stroke={color}
					strokeWidth="3"
					strokeLinecap="round"
					style={{
						strokeDasharray: circumference,
						strokeDashoffset: offset,
						transition: "stroke-dashoffset 0.3s ease",
					}}
				/>
			</svg>
			{children && (
				<div className="absolute inset-0 flex items-center justify-center">
					{children}
				</div>
			)}
		</div>
	);
}
