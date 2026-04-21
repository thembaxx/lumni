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

export function ProgressChart({
	data,
	title = "Progress",
}: ProgressChartProps) {
	return (
		<Card className="p-4">
			<h3 className="text-sm font-medium mb-4">{title}</h3>
			<div className="h-48">
				<ResponsiveContainer width="100%" height="100%">
					<LineChart
						data={data}
						margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
					>
						<CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
						<XAxis
							dataKey="date"
							tick={{ fontSize: 12 }}
							tickLine={false}
							className="fill-muted-foreground"
						/>
						<YAxis
							tick={{ fontSize: 12 }}
							tickLine={false}
							domain={[0, 100]}
							tickFormatter={(v) => `${v}%`}
							className="fill-muted-foreground"
						/>
						<Tooltip
							contentStyle={{
								backgroundColor: "var(--card)",
								border: "1px solid var(--border)",
								borderRadius: "8px",
							}}
							labelStyle={{ color: "var(--card-foreground)" }}
							formatter={(value) => [`${value}%`, "Accuracy"]}
						/>
						<Line
							type="monotone"
							dataKey="accuracy"
							stroke="var(--primary)"
							strokeWidth={2}
							dot={{ fill: "var(--primary)", strokeWidth: 2, r: 4 }}
							activeDot={{ r: 6 }}
						/>
					</LineChart>
				</ResponsiveContainer>
			</div>
		</Card>
	);
}
