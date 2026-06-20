"use client";

import { cn } from "@/lib/utils";

interface StatsCardsGridProps {
	totalRequests: number;
	successRate: number;
	avgScore: number;
	passRate: number;
}

function StatCard({
	label,
	value,
	valueColor,
}: {
	label: string;
	value: string;
	valueColor: string;
}) {
	return (
		<div className="overflow-hidden rounded-card-lg border border-border/80 bg-card shadow-level-2 transition-colors">
			<header className="rounded-t-card-lg border-border/80 border-t p-4 pb-2">
				<h2 className="font-medium font-sans text-muted-foreground text-sm">
					{label}
				</h2>
			</header>
			<div className="p-4 pt-0 group-data-[size=sm]/card:px-3">
				<p className={cn("font-extrabold text-3xl", valueColor)}>{value}</p>
			</div>
		</div>
	);
}

export function StatsCardsGrid({
	totalRequests,
	successRate,
	avgScore,
	passRate,
}: StatsCardsGridProps) {
	return (
		<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
			<StatCard
				label="Total Requests"
				value={String(totalRequests)}
				valueColor=""
			/>
			<StatCard
				label="Success Rate"
				value={`${successRate}%`}
				valueColor={
					successRate >= 80
						? "text-success"
						: successRate >= 50
							? "text-warning"
							: "text-destructive"
				}
			/>
			<StatCard
				label="Avg Validation Score"
				value={String(avgScore)}
				valueColor={
					avgScore >= 80
						? "text-success"
						: avgScore >= 50
							? "text-warning"
							: "text-destructive"
				}
			/>
			<StatCard
				label="Question Pass Rate"
				value={`${passRate}%`}
				valueColor={
					passRate >= 80
						? "text-success"
						: passRate >= 50
							? "text-warning"
							: "text-destructive"
				}
			/>
		</div>
	);
}
