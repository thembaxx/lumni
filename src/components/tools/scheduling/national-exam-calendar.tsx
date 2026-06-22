"use client";

import Calendar01Icon from "@hugeicons/core-free-icons/Calendar01Icon";
import Download02Icon from "@hugeicons/core-free-icons/Download02Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
	formatDuration,
	getCurrentSession,
	getSessionLabel,
	getSubjectAbbr,
	getSubjectColor,
} from "@/lib/exam-dates";
import {
	buildExportFilename,
	downloadIcal,
	generateIcal,
} from "@/lib/exam-dates/calendar-export";
import type { ExamSlot } from "@/lib/exam-dates/types";
import { cn } from "@/lib/utils";
import { ExamDetailDialog } from "../communication/exam-detail-dialog";

export function NationalExamCalendar() {
	const [loading, setLoading] = useState(true);
	const [allSlots, setAllSlots] = useState<ExamSlot[]>([]);
	const [selectedExam, setSelectedExam] = useState<ExamSlot | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [todayStr, setTodayStr] = useState("");
	useEffect(() => {
		setTodayStr(new Date().toDateString());
	}, []);

	const session = useMemo(() => getCurrentSession(), []);
	const sessionLabel = getSessionLabel(session.session, session.year);

	useEffect(() => {
		let cancelled = false;
		async function load() {
			const { getExamDates } = await import("@/lib/exam-dates/service");
			const slots = await getExamDates(session.session, session.year);
			if (!cancelled) {
				setAllSlots(slots);
				setLoading(false);
			}
		}
		load();
		return () => {
			cancelled = true;
		};
	}, [session]);

	const nextExams = useMemo(() => {
		const now = new Date();
		now.setHours(0, 0, 0, 0);
		return allSlots
			.filter((s) => new Date(s.date) >= now)
			.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
			.slice(0, 2);
	}, [allSlots]);

	const grouped = useMemo(() => {
		const groups: Record<string, ExamSlot[]> = {};
		for (const slot of allSlots) {
			if (!groups[slot.date]) groups[slot.date] = [];
			groups[slot.date].push(slot);
		}
		return Object.entries(groups)
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([date, slots]) => ({ date, slots }));
	}, [allSlots]);

	const handleSlotClick = useCallback((slot: ExamSlot) => {
		setSelectedExam(slot);
		setDialogOpen(true);
	}, []);

	const handleExportIcal = useCallback(() => {
		if (allSlots.length === 0) return;
		const ical = generateIcal(allSlots, sessionLabel);
		const filename = buildExportFilename(session.session, session.year);
		downloadIcal(ical, filename);
	}, [allSlots, sessionLabel, session.session, session.year]);

	const countdownText = useMemo(() => {
		if (nextExams.length === 0) {
			if (allSlots.length === 0) return "";
			const lastDate = allSlots[allSlots.length - 1]?.date;
			if (lastDate) {
				const diff = Date.now() - new Date(lastDate).getTime();
				const days = Math.floor(diff / 86400000);
				if (days > 0) return `Ended ${days} day${days === 1 ? "" : "s"} ago`;
				return "Ended";
			}
			return "";
		}
		const firstDate = new Date(`${nextExams[0].date}T00:00:00`);
		const now = new Date();
		const diff = firstDate.getTime() - now.getTime();
		if (diff < 0) return "Ongoing";
		const days = Math.floor(diff / 86400000);
		if (days === 0) return "Starts today";
		if (days === 1) return "Starts tomorrow";
		return `Starts in ${days} days`;
	}, [nextExams, allSlots]);

	if (loading) {
		return (
			<div className="flex flex-col gap-4 p-5">
				<Skeleton className="h-6 w-40" />
				<Skeleton className="h-28 rounded-2xl" />
				<Skeleton className="h-64 rounded-2xl" />
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col overflow-y-auto">
			<div className="px-5 pt-5 pb-3">
				<h2 className="ios-title-3 flex items-center gap-2 text-[--system-text-primary]">
					<HugeiconsIcon
						icon={Calendar01Icon}
						className="size-5 text-[--system-accent]"
					/>
					National Exams
				</h2>
				<p className="ios-subhead mt-1 text-[--system-text-secondary]/50">
					{sessionLabel}
				</p>
				{allSlots.length > 0 && (
					<Button
						variant="outline"
						size="sm"
						onClick={handleExportIcal}
						className="mt-2 gap-1.5 text-xs"
					>
						<HugeiconsIcon icon={Download02Icon} className="size-3.5" />
						Export Calendar
					</Button>
				)}
			</div>

			<AnimatePresence mode="wait" initial={false}>
				<m.div
					key={sessionLabel}
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					className="flex flex-col gap-4 px-5 pb-10"
				>
					{nextExams.length > 0 && (
						<m.div
							initial={{ opacity: 0, scale: 0.96 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ type: "spring", stiffness: 120, damping: 26 }}
							className="overflow-hidden rounded-card border border-border/60 bg-card shadow-level-1"
						>
							<div className="flex items-center justify-between border-border/40 border-b px-4 py-2.5">
								<span className="ios-caption-3 font-semibold text-muted-foreground uppercase tracking-wider">
									Upcoming Exams
								</span>
								<span
									className={cn(
										"ios-caption-3 rounded-full px-2 py-0.5 font-medium tabular-nums",
										countdownText.includes("Starts")
											? "bg-[--system-accent]/10 text-[--system-accent]"
											: countdownText === "Ongoing"
												? "bg-success/10 text-success"
												: "bg-muted text-muted-foreground",
									)}
								>
									{countdownText}
								</span>
							</div>
							<div className="divide-y divide-border/40">
								{nextExams.map((exam, i) => (
									<m.button
										type="button"
										key={exam.id}
										initial={{ opacity: 0, x: -8 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: i * 0.08 }}
										onClick={() => handleSlotClick(exam)}
										className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30 active:bg-muted/50"
									>
										<span
											className={cn(
												"ios-caption-3 flex size-8 shrink-0 items-center justify-center rounded-lg font-bold text-white",
												getSubjectColor(exam.subjectId),
											)}
										>
											{getSubjectAbbr(exam.subjectId)}
										</span>
										<div className="min-w-0 flex-1">
											<p className="truncate font-medium text-xs">
												{exam.subject}
											</p>
											<p className="ios-caption-3 text-muted-foreground">
												Paper {exam.paperNumber}
											</p>
										</div>
										<div className="shrink-0 text-right">
											<p className="font-medium text-xs tabular-nums">
												{new Date(`${exam.date}T00:00:00`).toLocaleDateString(
													"en-ZA",
													{
														weekday: "short",
														day: "numeric",
														month: "short",
													},
												)}
											</p>
											<p className="ios-caption-3 text-muted-foreground tabular-nums">
												{exam.startTime}–{exam.endTime}
											</p>
										</div>
									</m.button>
								))}
							</div>
						</m.div>
					)}

					{grouped.length === 0 ? (
						<div className="flex flex-col items-center gap-2 rounded-2xl border border-border border-dashed py-12">
							<HugeiconsIcon
								icon={Calendar01Icon}
								className="size-8 text-muted-foreground/30"
							/>
							<p className="text-muted-foreground/60 text-sm">
								No exam dates available yet
							</p>
						</div>
					) : (
						<div className="flex flex-col gap-3">
							<h3 className="ios-caption-3 font-semibold text-muted-foreground uppercase tracking-widest">
								Full Timetable
							</h3>
							{grouped.map((group, gi) => {
								const dateObj = new Date(`${group.date}T00:00:00`);
								const isToday = dateObj.toDateString() === todayStr;
								const dayName = dateObj.toLocaleDateString("en-ZA", {
									weekday: "short",
								});
								const dayNum = dateObj.getDate();
								const monthName = dateObj.toLocaleDateString("en-ZA", {
									month: "short",
								});

								return (
									<m.div
										key={group.date}
										initial={{ opacity: 0, y: 8 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: gi * 0.025 }}
									>
										<div className="mb-2 flex items-center gap-2 px-1">
											<span
												className={cn(
													"font-bold text-xs",
													isToday && "text-[--system-accent]",
												)}
											>
												{dayName} {dayNum} {monthName}
											</span>
											{isToday && (
												<span className="ios-caption-3 rounded-full bg-[--system-accent]/10 px-2 py-0.5 font-medium text-[--system-accent]">
													Today
												</span>
											)}
											<div className="ml-auto h-px flex-1 bg-border/40" />
										</div>
										<div className="flex flex-col gap-1.5">
											{group.slots.map((slot) => (
												<m.button
													type="button"
													key={slot.id}
													whileTap={{ scale: 0.98 }}
													onClick={() => handleSlotClick(slot)}
													className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-border/50 bg-card px-3 py-2.5 text-left transition-colors hover:bg-muted/30 active:bg-muted/50"
												>
													<div className="flex flex-col items-center gap-0.5">
														<span className="ios-caption-2 font-semibold tabular-nums">
															{slot.startTime}
														</span>
														<div className="h-6 w-px bg-border/60" />
														<span className="ios-caption-2 font-semibold text-muted-foreground tabular-nums">
															{slot.endTime}
														</span>
													</div>
													<div
														className={cn(
															"h-8 w-1 rounded-full",
															getSubjectColor(slot.subjectId).replace(
																"bg-",
																"bg-",
															),
														)}
													>
														<div
															className={cn(
																"h-full w-full rounded-full",
																getSubjectColor(slot.subjectId),
															)}
														/>
													</div>
													<div className="min-w-0 flex-1">
														<p className="truncate font-medium text-xs">
															{slot.subject}
														</p>
														<p className="ios-caption-3 text-muted-foreground">
															Paper {slot.paperNumber} &middot;{" "}
															{formatDuration(slot.durationHours)}
														</p>
													</div>
												</m.button>
											))}
										</div>
									</m.div>
								);
							})}
						</div>
					)}
				</m.div>
			</AnimatePresence>

			<ExamDetailDialog
				exam={selectedExam}
				open={dialogOpen}
				onOpenChange={setDialogOpen}
			/>
		</div>
	);
}
