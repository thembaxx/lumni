"use client";

import * as RechartsPrimitive from "recharts";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
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
	color = "hsl(var(--chart-2))",
	trackColor = "hsl(var(--muted))",
	children,
	className,
}: RadialChartProps) {
	const clampedValue = Math.min(100, Math.max(0, value));

	const chartConfig: ChartConfig = {
		value: {
			label: "Progress",
			color,
		},
	};

	return (
		<div
			className={cn("relative shrink-0", className)}
			style={{ width: size, height: size }}
		>
			<ChartContainer
				config={chartConfig}
				className="absolute inset-0 size-full"
			>
				<RechartsPrimitive.RadialBarChart
					data={[{ value: clampedValue }]}
					startAngle={90}
					endAngle={-270}
					innerRadius="72%"
					outerRadius="100%"
					barSize={size * 0.12}
				>
					<RechartsPrimitive.PolarAngleAxis
						type="number"
						domain={[0, 100]}
						tick={false}
					/>
					<RechartsPrimitive.RadialBar
						dataKey="value"
						fill="var(--color-value)"
						background={{ fill: trackColor }}
						cornerRadius={size * 0.06}
						isAnimationActive={true}
						animationDuration={300}
					/>
				</RechartsPrimitive.RadialBarChart>
			</ChartContainer>
			{children && (
				<div className="absolute inset-0 flex items-center justify-center">
					{children}
				</div>
			)}
		</div>
	);
}
