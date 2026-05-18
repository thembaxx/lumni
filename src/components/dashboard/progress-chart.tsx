"use client";

import { Chart03Icon, PlayFreeIcons } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
	const router = useRouter();
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
					<div className="flex flex-col items-center justify-center h-62.5 text-center px-6">
						<div className="size-10 rounded-full bg-muted flex items-center justify-center mb-3">
							<HugeiconsIcon
								icon={Chart03Icon}
								className="size-5 text-muted-foreground"
							/>
						</div>
						<p className="text-sm font-semibold text-foreground mb-1">
							Your accuracy over time
						</p>
						<p className="text-xs text-muted-foreground mb-4 max-w-50 text-pretty">
							Complete a quiz to start tracking your performance.
						</p>
						<Button
							size="sm"
							variant="outline"
							className="h-8 text-xs gap-1.5"
							onClick={() => router.push("/quiz")}
						>
							<HugeiconsIcon icon={PlayFreeIcons} className="size-3.5" />
							Take a quiz
						</Button>
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
