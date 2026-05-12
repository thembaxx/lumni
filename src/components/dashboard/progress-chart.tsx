"use client";

import {
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";

interface ProgressDataPoint {
	date: string;
	accuracy: number;
}

interface ProgressChartProps {
	data: ProgressDataPoint[];
	title?: string;
}

export function ProgressChart({ data, title }: ProgressChartProps) {
	return (
		<Card className="p-4">
			{title && (
				<h3 className="text-lg font-semibold mb-4 text-wrap balance">
					{title}
				</h3>
			)}
			<ResponsiveContainer width="100%" height={250}>
				<LineChart data={data}>
					<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
					<XAxis
						dataKey="date"
						className="text-xs"
						tickLine={false}
						axisLine={false}
					/>
					<YAxis
						className="text-xs"
						tickLine={false}
						axisLine={false}
						domain={[0, 100]}
					/>
					<Tooltip
						contentStyle={{
							backgroundColor: "var(--background)",
							border: "1px solid var(--border)",
							borderRadius: "8px",
						}}
						labelStyle={{ color: "var(--foreground)" }}
					/>
					<Line
						type="monotone"
						dataKey="accuracy"
						stroke="var(--primary)"
						strokeWidth={2}
						dot={{ fill: "var(--primary)", strokeWidth: 0, r: 4 }}
						activeDot={{ r: 6 }}
					/>
				</LineChart>
			</ResponsiveContainer>
		</Card>
	);
}
