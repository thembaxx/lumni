"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart } from "@/components/ui/charts/line-chart";

interface ProgressDataPoint {
	date: string;
	accuracy: number;
}

interface ProgressChartProps {
	data: ProgressDataPoint[];
	title?: string;
}

export function ProgressChart({ data, title }: ProgressChartProps) {
	const chartConfig = {
		accuracy: {
			label: "Accuracy",
			color: "var(--primary)",
		},
	};

	return (
		<Card className="overflow-hidden w-full">
			{title && (
				<CardHeader>
					<CardTitle className="text-lg font-semibold text-wrap balance">
						{title}
					</CardTitle>
				</CardHeader>
			)}
			<CardContent>
				{data.length === 0 ? (
					<div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm font-medium">
						No progress data yet
					</div>
				) : (
					<LineChart
						data={data}
						xKey="date"
						yKey="accuracy"
						config={chartConfig}
					/>
				)}
			</CardContent>
		</Card>
	);
}
