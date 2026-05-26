"use client";

import { useTranslations } from "next-intl";

export type StatsData = {
	completedSessions: number;
	upcomingSessions: number;
	studyTimeMinutes: number;
	examCount: number;
	daysUntilNextExam: number | null;
};

export function StatsRow({ stats }: { stats: StatsData }) {
	const t = useTranslations();
	return (
		<div className="grid grid-cols-4 gap-4">
			<div className="overflow-hidden rounded-card-lg border border-border/80 bg-card shadow-level-2 transition-colors">
				<div className="p-4 px-4 text-center group-data-[size=sm]/card:px-3">
					<div className="font-extrabold text-2xl">
						{stats.completedSessions}
					</div>
					<div className="text-muted-foreground text-xs">
						{t("studyPlanner.completed")}
					</div>
				</div>
			</div>
			<div className="overflow-hidden rounded-card-lg border border-border/80 bg-card shadow-level-2 transition-colors">
				<div className="p-4 px-4 text-center group-data-[size=sm]/card:px-3">
					<div className="font-extrabold text-2xl">
						{stats.upcomingSessions}
					</div>
					<div className="text-muted-foreground text-xs">
						{t("studyPlanner.upcoming")}
					</div>
				</div>
			</div>
			<div className="overflow-hidden rounded-card-lg border border-border/80 bg-card shadow-level-2 transition-colors">
				<div className="p-4 px-4 text-center group-data-[size=sm]/card:px-3">
					<div className="font-extrabold text-2xl">
						{Math.round(stats.studyTimeMinutes / 60)}h
					</div>
					<div className="text-muted-foreground text-xs">
						{t("studyPlanner.studyTime")}
					</div>
				</div>
			</div>
			<div className="overflow-hidden rounded-card-lg border border-border/80 bg-card shadow-level-2 transition-colors">
				<div className="p-4 px-4 text-center group-data-[size=sm]/card:px-3">
					<div className="font-extrabold text-2xl">
						{stats.daysUntilNextExam !== null ? stats.daysUntilNextExam : "-"}
					</div>
					<div className="text-muted-foreground text-xs">
						{t("studyPlanner.daysToExam")}
					</div>
				</div>
			</div>
		</div>
	);
}
