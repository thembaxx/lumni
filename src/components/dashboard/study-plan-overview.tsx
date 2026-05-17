"use client";

import {
	Calendar01Icon,
	Clock01Icon,
	CheckListIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStudyPlanner } from "@/hooks/use-study-planner";
import { formatTime } from "@/lib/shared/time";

export function StudyPlanOverview() {
	const { todaySessions, upcomingExams, stats } = useStudyPlanner();

	if (todaySessions.length === 0 && upcomingExams.length === 0) return null;

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle className="text-base font-extrabold tracking-tight flex items-center gap-2">
					<HugeiconsIcon icon={CheckListIcon} className="size-5" />
					Today's Plan
				</CardTitle>
				<Link
					href="/study-plan"
					className="text-xs font-medium text-[--system-accent] hover:underline"
				>
					View all
				</Link>
			</CardHeader>
			<CardContent className="flex flex-col gap-2">
				{todaySessions.length > 0 ? (
					todaySessions.slice(0, 3).map((session) => (
						<div
							key={session.id}
							className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30"
						>
							<div className="size-9 rounded-xl bg-[--system-accent]/10 flex items-center justify-center shrink-0">
								<HugeiconsIcon
									icon={Clock01Icon}
									className="size-4 text-[--system-accent]"
								/>
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-semibold truncate">
									{session.subject}
								</p>
								<p className="text-xs text-muted-foreground">
									{session.topic || session.type} · {session.duration} min
								</p>
							</div>
							{session.completed && (
								<span className="text-xs font-medium text-success">Done</span>
							)}
						</div>
					))
				) : (
					<div className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30">
						<HugeiconsIcon
							icon={Calendar01Icon}
							className="size-4 text-muted-foreground"
						/>
						<p className="text-sm text-muted-foreground">
							No sessions scheduled today
						</p>
					</div>
				)}
				{stats.completedSessions > 0 && (
					<p className="text-xs text-muted-foreground pt-1">
						{stats.completedSessions} session
						{stats.completedSessions !== 1 ? "s" : ""} completed ·{" "}
						{stats.studyTimeMinutes} min studied
					</p>
				)}
			</CardContent>
		</Card>
	);
}
