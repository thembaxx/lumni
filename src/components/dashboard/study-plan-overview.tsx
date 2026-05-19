"use client";

import {
	Calendar01Icon,
	CheckListIcon,
	Clock01Icon,
	MagicWand01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStudyPlanner } from "@/hooks/use-study-planner";
import { formatTime } from "@/lib/shared/time";

export function StudyPlanOverview() {
	const { todaySessions, upcomingExams, stats, generatePlan, isGenerating } =
		useStudyPlanner();
	const [targetAps, setTargetAps] = useState("25");
	const [dailyMinutes, setDailyMinutes] = useState("30");
	const [showForm, setShowForm] = useState(false);

	if (todaySessions.length === 0 && upcomingExams.length === 0 && !showForm) {
		return (
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle className="text-base font-extrabold tracking-tight flex items-center gap-2">
						<HugeiconsIcon icon={CheckListIcon} className="size-5" />
						Study Plan
					</CardTitle>
					<Button size="sm" onClick={() => setShowForm(true)}>
						<HugeiconsIcon icon={MagicWand01Icon} data-icon="inline-start" />
						Generate Plan
					</Button>
				</CardHeader>
				<CardContent>
					<div className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30">
						<HugeiconsIcon
							icon={Calendar01Icon}
							className="size-4 text-muted-foreground"
						/>
						<p className="text-sm text-muted-foreground">
							No study plan yet. Generate a personalised plan based on your
							competency data.
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (showForm) {
		return (
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle className="text-base font-extrabold tracking-tight flex items-center gap-2">
						<HugeiconsIcon icon={CheckListIcon} className="size-5" />
						Generate Study Plan
					</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					<p className="text-sm text-muted-foreground">
						Your plan will focus on your weakest topics based on quiz
						performance, scheduled across weekdays for the next 30 days.
					</p>
					<div className="grid grid-cols-2 gap-4">
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="target-aps" className="text-xs">
								Target APS
							</Label>
							<Input
								id="target-aps"
								type="number"
								min="1"
								max="42"
								value={targetAps}
								onChange={(e) => setTargetAps(e.target.value)}
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="daily-minutes" className="text-xs">
								Daily minutes
							</Label>
							<Input
								id="daily-minutes"
								type="number"
								min="5"
								max="480"
								value={dailyMinutes}
								onChange={(e) => setDailyMinutes(e.target.value)}
							/>
						</div>
					</div>
					<div className="flex items-center gap-2 justify-end">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setShowForm(false)}
							disabled={isGenerating}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							disabled={isGenerating}
							onClick={async () => {
								await generatePlan({
									targetAps: Number.parseInt(targetAps, 10) || 25,
									dailyStudyMinutes: Number.parseInt(dailyMinutes, 10) || 30,
								});
								setShowForm(false);
							}}
						>
							{isGenerating ? "Generating…" : "Generate"}
						</Button>
					</div>
				</CardContent>
			</Card>
		);
	}

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
