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
					<CardTitle className="flex items-center gap-2 font-extrabold text-base tracking-tight">
						<HugeiconsIcon icon={CheckListIcon} className="size-5" />
						Study Plan
					</CardTitle>
					<Button size="sm" onClick={() => setShowForm(true)}>
						<HugeiconsIcon icon={MagicWand01Icon} data-icon="inline-start" />
						Generate Plan
					</Button>
				</CardHeader>
				<CardContent>
					<div className="flex items-center gap-3 rounded-xl bg-muted/30 p-2.5">
						<HugeiconsIcon
							icon={Calendar01Icon}
							className="size-4 text-muted-foreground"
						/>
						<p className="text-muted-foreground text-sm">
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
					<CardTitle className="flex items-center gap-2 font-extrabold text-base tracking-tight">
						<HugeiconsIcon icon={CheckListIcon} className="size-5" />
						Generate Study Plan
					</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					<p className="text-muted-foreground text-sm">
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
					<div className="flex items-center justify-end gap-2">
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
				<CardTitle className="flex items-center gap-2 font-extrabold text-base tracking-tight">
					<HugeiconsIcon icon={CheckListIcon} className="size-5" />
					Today's Plan
				</CardTitle>
				<Link
					href="/study-plan"
					className="font-medium text-[--system-accent] text-xs hover:underline"
				>
					View all
				</Link>
			</CardHeader>
			<CardContent className="flex flex-col gap-2">
				{todaySessions.length > 0 ? (
					todaySessions.slice(0, 3).map((session) => (
						<div
							key={session.id}
							className="flex items-center gap-3 rounded-xl bg-muted/30 p-2.5"
						>
							<div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[--system-accent]/10">
								<HugeiconsIcon
									icon={Clock01Icon}
									className="size-4 text-[--system-accent]"
								/>
							</div>
							<div className="min-w-0 flex-1">
								<p className="truncate font-semibold text-sm">
									{session.subject}
								</p>
								<p className="text-muted-foreground text-xs">
									{session.topic || session.type} · {session.duration} min
								</p>
							</div>
							{session.completed && (
								<span className="font-medium text-success text-xs">Done</span>
							)}
						</div>
					))
				) : (
					<div className="flex items-center gap-3 rounded-xl bg-muted/30 p-2.5">
						<HugeiconsIcon
							icon={Calendar01Icon}
							className="size-4 text-muted-foreground"
						/>
						<p className="text-muted-foreground text-sm">
							No sessions scheduled today
						</p>
					</div>
				)}
				{stats.completedSessions > 0 && (
					<p className="pt-1 text-muted-foreground text-xs">
						{stats.completedSessions} session
						{stats.completedSessions !== 1 ? "s" : ""} completed ·{" "}
						{stats.studyTimeMinutes} min studied
					</p>
				)}
			</CardContent>
		</Card>
	);
}
