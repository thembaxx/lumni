"use client";

import { Chart03Icon, PlayFreeIcons } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart } from "@/components/ui/charts/line-chart";
import { useRouter } from "@/i18n/navigation";

interface ProgressDataPoint {
	date: string;
	accuracy: number;
}

const CHART_CONFIG = {
	accuracy: {
		label: "Accuracy",
		color: "var(--primary)",
	},
} as const;

interface ProgressChartProps {
	data: ProgressDataPoint[];
	title?: string;
}

export function ProgressChart({ data, title }: ProgressChartProps) {
	const { push } = useRouter();
	const chartConfig = CHART_CONFIG;

	return (
		<Card className="w-full overflow-hidden">
			{title && (
				<CardHeader>
					<CardTitle className="balance text-wrap font-semibold text-lg">
						{title}
					</CardTitle>
				</CardHeader>
			)}
			<CardContent>
				{data.length === 0 ? (
					<div className="flex h-62.5 flex-col items-center justify-center px-6 text-center">
						<div className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted">
							<HugeiconsIcon
								icon={Chart03Icon}
								className="size-5 text-muted-foreground"
							/>
						</div>
						<p className="mb-1 font-semibold text-foreground text-sm">
							Your accuracy over time
						</p>
						<p className="mb-4 max-w-50 text-pretty text-muted-foreground text-xs">
							Complete a quiz to start tracking your performance.
						</p>
						<Button
							size="sm"
							variant="outline"
							className="h-8 gap-1.5 text-xs"
							onClick={() => push("/quiz")}
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
