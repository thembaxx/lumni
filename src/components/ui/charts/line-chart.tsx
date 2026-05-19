"use client";

import {
	CartesianGrid,
	Line,
	LineChart as RechartsLineChart,
	XAxis,
	YAxis,
} from "recharts";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";

interface LineChartProps {
	// biome-ignore lint/suspicious/noExplicitAny: recharts accepts any record-like data
	data: any[];
	xKey: string;
	yKey: string;
	config: ChartConfig;
	height?: number;
	showGrid?: boolean;
	showDots?: boolean;
}

export function LineChart({
	data,
	xKey,
	yKey,
	config,
	height = 250,
	showGrid = true,
	showDots = true,
}: LineChartProps) {
	return (
		<ChartContainer config={config} className="w-full" style={{ height }}>
			<RechartsLineChart
				data={data}
				margin={{ top: 10, right: 10, bottom: 24, left: 28 }}
			>
				{showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} />}
				<XAxis
					dataKey={xKey}
					tickLine={false}
					axisLine={false}
					tickMargin={8}
				/>
				<YAxis
					domain={[0, 100]}
					tickLine={false}
					axisLine={false}
					tickMargin={8}
					tickCount={5}
				/>
				<ChartTooltip
					cursor={false}
					content={<ChartTooltipContent indicator="dot" />}
				/>
				<Line
					dataKey={yKey}
					type="monotone"
					stroke={`var(--color-${yKey})`}
					strokeWidth={2}
					dot={showDots ? { r: 4, strokeWidth: 2 } : false}
					activeDot={{ r: 6, strokeWidth: 2 }}
					animationDuration={300}
				/>
			</RechartsLineChart>
		</ChartContainer>
	);
}
