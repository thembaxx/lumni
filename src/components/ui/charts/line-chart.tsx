"use client";

import dynamic from "next/dynamic";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";

const RechartsLineChart = dynamic(
	() => import("recharts").then((m) => m.LineChart),
	{ ssr: false },
);
const CartesianGrid = dynamic(
	() => import("recharts").then((m) => m.CartesianGrid),
	{ ssr: false },
);
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), {
	ssr: false,
});
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), {
	ssr: false,
});
const Line = dynamic(() => import("recharts").then((m) => m.Line), {
	ssr: false,
});

// biome-ignore lint/suspicious/noExplicitAny: recharts accepts any record-like data
interface LineChartProps<T = any> {
	data: T[];
	xKey: string;
	yKey: string;
	config: ChartConfig;
	height?: number;
	showGrid?: boolean;
	showDots?: boolean;
}

export function LineChart<T>({
	data,
	xKey,
	yKey,
	config,
	height = 250,
	showGrid = true,
	showDots = true,
}: LineChartProps<T>) {
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
