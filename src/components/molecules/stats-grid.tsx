"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/shared";

const BarChart = dynamic(
	() => import("recharts").then((m) => ({ default: m.BarChart })),
	{ ssr: false },
);
const Bar = dynamic(
	() => import("recharts").then((m) => ({ default: m.Bar })),
	{ ssr: false },
);
const XAxis = dynamic(
	() => import("recharts").then((m) => ({ default: m.XAxis })),
	{ ssr: false },
);

import { Skeleton } from "@/components/ui/skeleton";

const ResponsiveContainer = dynamic(
	() => import("recharts").then((m) => ({ default: m.ResponsiveContainer })),
	{
		ssr: false,
		loading: () => <Skeleton className="h-32 rounded-lg" />,
	},
);
const Tooltip = dynamic(
	() => import("recharts").then((m) => ({ default: m.Tooltip })),
	{ ssr: false },
);

interface StatItem {
	label: string;
	value: number;
	max: number;
}

interface StatsGridProps extends React.ComponentProps<typeof Card> {
	stats: StatItem[];
}

export function StatsGrid({ stats, className, ...props }: StatsGridProps) {
	return (
		<Card className={cn(className)} {...props}>
			<CardHeader className="pb-3">
				<CardTitle className="font-heading text-base">Study Stats</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				<div className="grid grid-cols-2 gap-3">
					{stats.map((stat) => (
						<div key={stat.label} className="rounded-lg bg-muted/50 p-3">
							<p className="text-muted-foreground text-xs uppercase tracking-wide">
								{stat.label}
							</p>
							<p className="mt-1 font-semibold text-lg">{stat.value}</p>
							<p className="text-muted-foreground text-xs">/ {stat.max}</p>
						</div>
					))}
				</div>
				{stats.length > 0 && (
					<div className="h-32">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={stats}>
								<XAxis dataKey="label" hide />
								<Tooltip
									contentStyle={{
										borderRadius: "12px",
										border: "none",
										boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
									}}
								/>
								<Bar
									dataKey="value"
									fill="var(--primary)"
									radius={[4, 4, 0, 0]}
								/>
							</BarChart>
						</ResponsiveContainer>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
