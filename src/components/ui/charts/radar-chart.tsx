import { useMemo } from "react";
import {
	Legend,
	PolarAngleAxis,
	PolarGrid,
	PolarRadiusAxis,
	Radar,
	RadarChart as RechartsRadarChart,
	ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/shared";

interface RadarChartProps {
	data: {
		labels: string[];
		datasets: Array<{
			label: string;
			data: number[];
			backgroundColor?: string;
			borderColor?: string;
		}>;
	};
	className?: string;
}

export function RadarChart({ data, className }: RadarChartProps) {
	const chartData = useMemo(() => {
		return data.labels.map((label, i) => {
			const point: Record<string, string | number> = { label };
			for (const ds of data.datasets) {
				point[ds.label] = ds.data[i] ?? 0;
			}
			return point;
		});
	}, [data]);

	return (
		<div className={cn("h-64 w-full", className)}>
			<ResponsiveContainer width="100%" height="100%">
				<RechartsRadarChart data={chartData}>
					<PolarGrid />
					<PolarAngleAxis dataKey="label" />
					<PolarRadiusAxis />
					{data.datasets.map((ds) => (
						<Radar
							key={ds.label}
							name={ds.label}
							dataKey={ds.label}
							stroke={ds.borderColor ?? "var(--system-accent)"}
							fill={ds.backgroundColor ?? "var(--system-accent)"}
							fillOpacity={0.3}
						/>
					))}
					<Legend />
				</RechartsRadarChart>
			</ResponsiveContainer>
		</div>
	);
}
