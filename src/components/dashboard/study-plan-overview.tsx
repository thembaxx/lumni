"use client";

import {
	Bookmark02Icon,
	Calendar01Icon,
	Cancel01Icon,
	CheckListIcon,
	Clock01Icon,
	MagicWand01Icon,
	RefreshIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useStudyPlanner } from "@/hooks/use-study-planner";
import { Link } from "@/i18n/navigation";
import { logError } from "@/lib/shared/logger";
import { getSubjectAbbr } from "@/lib/subjects";
import { getWeekOldThreshold, loadStudyPlan } from "@/lib/utils/study-planner";
import { useBookmarksStore } from "@/store/bookmarks";

export function StudyPlanOverview() {
	const {
		todaySessions,
		upcomingExams,
		stats,
		generatePlan,
		isGenerating,
		stale,
	} = useStudyPlanner();
	const [targetAps, setTargetAps] = useState("25");
	const [dailyMinutes, setDailyMinutes] = useState("30");
	const [includeWeekends, setIncludeWeekends] = useState(false);
	const [horizonDays, setHorizonDays] = useState("30");
	const [horizonCustom, setHorizonCustom] = useState("");
	const [showForm, setShowForm] = useState(false);
	const [dismissedStale, setDismissedStale] = useState(false);
	const autoRefreshDoneRef = useRef(false);
	const router = useRouter();
	const bookmarks = useBookmarksStore((s) => s.bookmarks);

	const handleStartSession = useCallback(
		(session: { subject: string; topic?: string; duration: number }) => {
			const params = new URLSearchParams();
			params.set("subject", session.subject);
			if (session.topic) params.set("topic", session.topic);
			if (session.duration)
				params.set("maxTime", String(session.duration * 60));
			params.set("count", "10");
			params.set("autoStart", "true");
			router.push(`/quiz?${params.toString()}`);
		},
		[router],
	);
	const bookmarksBySubject = useMemo(() => {
		const map = new Map<string, number>();
		for (const b of bookmarks) {
			map.set(b.subject, (map.get(b.subject) ?? 0) + 1);
		}
		return map;
	}, [bookmarks]);

	// Weekly auto-refresh on mount
	useEffect(() => {
		if (autoRefreshDoneRef.current) return;
		autoRefreshDoneRef.current = true;
		const plan = loadStudyPlan();
		if (
			plan.generatedAt > 0 &&
			plan.lastCompetencyRefresh < getWeekOldThreshold()
		) {
			generatePlan({
				targetAps: Number.parseInt(
					localStorage.getItem("lumni_plan_target_aps") ?? "25",
					10,
				),
				dailyStudyMinutes: Number.parseInt(
					localStorage.getItem("lumni_plan_daily_minutes") ?? "30",
					10,
				),
			}).catch((err) => logError("study-plan-overview.generate", err));
		}
	}, [generatePlan]);

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
						performance, scheduled
						{includeWeekends ? " across all days" : " across weekdays"}
						{horizonDays === "custom"
							? ` for ${horizonCustom || "…"} days`
							: ` for ${horizonDays} days`}
						.
					</p>
					<FieldGroup>
						<Field>
							<FieldLabel htmlFor="target-aps">Target APS</FieldLabel>
							<Input
								id="target-aps"
								type="number"
								min="1"
								max="42"
								value={targetAps}
								onChange={(e) => setTargetAps(e.target.value)}
							/>
						</Field>
						<Field>
							<FieldLabel htmlFor="daily-minutes">Daily minutes</FieldLabel>
							<Input
								id="daily-minutes"
								type="number"
								min="5"
								max="480"
								value={dailyMinutes}
								onChange={(e) => setDailyMinutes(e.target.value)}
							/>
						</Field>
					</FieldGroup>
					<label
						htmlFor="include-weekends"
						className="flex cursor-pointer items-center gap-2 text-xs"
					>
						<Checkbox
							id="include-weekends"
							checked={includeWeekends}
							onCheckedChange={(checked) =>
								setIncludeWeekends(checked === true)
							}
						/>
						Include weekends
					</label>
					<div className="flex flex-col gap-1.5">
						<span className="text-muted-foreground text-xs">Plan horizon</span>
						<div className="flex flex-wrap gap-1.5">
							{["7", "14", "30"].map((days) => (
								<Button
									key={days}
									size="sm"
									variant={horizonDays === days ? "default" : "outline"}
									onClick={() => {
										setHorizonDays(days);
										setHorizonCustom("");
									}}
								>
									{days} days
								</Button>
							))}
							<Button
								size="sm"
								variant={horizonDays === "custom" ? "default" : "outline"}
								onClick={() => setHorizonDays("custom")}
							>
								Custom
							</Button>
						</div>
						{horizonDays === "custom" && (
							<Input
								type="number"
								min="7"
								max="90"
								placeholder="Days"
								value={horizonCustom}
								className="mt-1 h-8 w-24"
								onChange={(e) => setHorizonCustom(e.target.value)}
							/>
						)}
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
								const resolvedHorizon =
									horizonDays === "custom"
										? Number.parseInt(horizonCustom, 10) || 30
										: Number.parseInt(horizonDays, 10);
								await generatePlan({
									targetAps: Number.parseInt(targetAps, 10) || 25,
									dailyStudyMinutes: Number.parseInt(dailyMinutes, 10) || 30,
									includeWeekends,
									horizonDays: resolvedHorizon,
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
				{stale && !dismissedStale && !showForm && (
					<div className="flex items-center justify-between gap-2 rounded-xl bg-warning/10 px-3 py-2 text-foreground dark:bg-warning/15">
						<div className="flex items-center gap-2 text-xs">
							<HugeiconsIcon
								icon={RefreshIcon}
								className="size-3.5 shrink-0 text-warning"
							/>
							<span>
								Your scores have changed, consider regenerating your plan.
							</span>
						</div>
						<div className="flex shrink-0 items-center gap-1">
							<Button
								size="sm"
								variant="ghost"
								className="h-6 px-2 text-xs"
								onClick={() => setShowForm(true)}
							>
								Regenerate
							</Button>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setDismissedStale(true)}
								aria-label="Dismiss"
								className="size-6"
							>
								<HugeiconsIcon icon={Cancel01Icon} className="size-3" />
							</Button>
						</div>
					</div>
				)}
				{todaySessions.length > 0 ? (
					todaySessions.slice(0, 3).map((session) => (
						<button
							type="button"
							key={session.id}
							onClick={() => handleStartSession(session)}
							className="flex w-full items-center gap-3 rounded-xl bg-muted/30 p-2.5 text-left transition-colors hover:bg-muted/50"
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
						</button>
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
					<>
						<div className="mt-2 flex items-center gap-2">
							<div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
								<div
									className="h-full rounded-full bg-[--system-accent] transition-[width]"
									style={{ width: `${Math.min(stats.progress, 100)}%` }}
								/>
							</div>
							<span className="shrink-0 font-medium text-muted-foreground text-xs tabular-nums">
								{stats.progress}%
							</span>
						</div>
						<p className="pt-1 text-muted-foreground text-xs">
							{stats.completedSessions} session
							{stats.completedSessions !== 1 ? "s" : ""} completed ·{" "}
							{stats.studyTimeMinutes} min studied
						</p>
					</>
				)}
				{bookmarksBySubject.size > 0 && (
					<div className="mt-2 flex flex-col gap-1.5">
						<p className="flex items-center gap-1 font-medium text-muted-foreground text-xs">
							<HugeiconsIcon icon={Bookmark02Icon} className="size-3" />
							Bookmarked questions
						</p>
						<div className="flex flex-wrap gap-1.5">
							{bookmarksBySubject
								.entries()
								.toArray()
								.toSorted((a, b) => b[1] - a[1])
								.slice(0, 5)
								.map(([subj, count]) => (
									<Link
										key={subj}
										href={`/quiz?subject=${subj}&count=10`}
										className="inline-flex items-center gap-1 rounded-full bg-muted/50 px-2 py-0.5 font-medium text-muted-foreground text-xs hover:bg-muted hover:text-foreground"
									>
										{getSubjectAbbr(subj)}
										<span className="tabular-nums">{count}</span>
									</Link>
								))}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
