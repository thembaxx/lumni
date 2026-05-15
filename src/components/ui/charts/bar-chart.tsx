"use client";

import * as RechartsPrimitive from "recharts";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";

interface BarChartProps {
	// biome-ignore lint/suspicious/noExplicitAny: recharts accepts any record-like data
	data: any[];
	xKey: string;
	yKey: string;
	config: ChartConfig;
	height?: number;
	showGrid?: boolean;
}

export function BarChart({
	data,
	xKey,
	yKey,
	config,
	height = 160,
	showGrid = false,
}: BarChartProps) {
	return (
		<ChartContainer config={config} className="w-full" style={{ height }}>
			<RechartsPrimitive.BarChart
				data={data}
				margin={{ top: 10, right: 10, bottom: 24, left: 10 }}
			>
				{showGrid && (
					<RechartsPrimitive.CartesianGrid
						strokeDasharray="3 3"
						vertical={false}
					/>
				)}
				<RechartsPrimitive.XAxis
					dataKey={xKey}
					tickLine={false}
					axisLine={false}
					tickMargin={8}
				/>
				<RechartsPrimitive.YAxis hide />
				<ChartTooltip
					cursor={false}
					content={<ChartTooltipContent indicator="dot" hideLabel />}
				/>
				<RechartsPrimitive.Bar
					dataKey={yKey}
					fill={`var(--color-${yKey})`}
					radius={[4, 4, 0, 0]}
					isAnimationActive={true}
					animationDuration={300}
				/>
			</RechartsPrimitive.BarChart>
		</ChartContainer>
	);
}
