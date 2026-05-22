"use client";

import {
	BookOpen01Icon,
	Calendar01Icon,
	Clock01Icon,
	NoteEditIcon,
	Quiz02Icon,
	TimeScheduleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
	formatDuration,
	formatFriendlyDate,
	formatTimeRange,
	getSessionLabel,
	getSubjectAbbr,
	getSubjectColor,
} from "@/lib/exam-dates";
import type { ExamSlot } from "@/lib/exam-dates/types";
import { cn } from "@/lib/shared";

interface ExamDetailDialogProps {
	exam: ExamSlot | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

function Countdown({ targetDate }: { targetDate: string }) {
	const [text, setText] = useState("");

	useEffect(() => {
		function update() {
			const target = new Date(`${targetDate}T00:00:00`);
			const now = new Date();
			const diff = target.getTime() - now.getTime();

			let newText: string;

			if (diff < 0) {
				const daysPast = Math.floor(Math.abs(diff) / 86400000);
				newText = `Passed ${daysPast} day${daysPast === 1 ? "" : "s"} ago`;
			} else {
				const days = Math.floor(diff / 86400000);
				const hours = Math.floor((diff % 86400000) / 3600000);
				if (days > 0) {
					newText = `${days}d ${hours}h until this exam`;
				} else if (hours > 0) {
					newText = `${hours}h until this exam`;
				} else {
					newText = "Today!";
				}
			}

			setText(newText);
		}

		update();
		const timer = setInterval(update, 60000);
		return () => clearInterval(timer);
	}, [targetDate]);

	return (
		<span className="text-muted-foreground text-xs tabular-nums">{text}</span>
	);
}

export function ExamDetailDialog({
	exam,
	open,
	onOpenChange,
}: ExamDetailDialogProps) {
	const { push } = useRouter();

	const handlePractice = useCallback(() => {
		if (!exam) return;
		onOpenChange(false);
		push(`/quiz?subject=${exam.subjectId}&count=10`);
	}, [exam, onOpenChange, push]);

	const handleMockExam = useCallback(() => {
		if (!exam) return;
		onOpenChange(false);
		const examDuration = exam.durationHours * 3600;
		push(
			`/quiz?subject=${exam.subjectId}&count=30&time=${examDuration}`,
		);
	}, [exam, onOpenChange, push]);

	const handleCommonQuestions = useCallback(() => {
		if (!exam) return;
		onOpenChange(false);
		push(`/quiz?subject=${exam.subjectId}&count=10`);
	}, [exam, onOpenChange, push]);

	if (!exam) return null;

	const isPast = new Date(`${exam.date}T23:59:59`) < new Date();

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<div className="flex items-center gap-2">
						<span
							className={cn(
								"flex size-6 items-center justify-center rounded-md font-bold text-[10px] text-white",
								getSubjectColor(exam.subjectId),
							)}
						>
							{getSubjectAbbr(exam.subjectId)}
						</span>
						<DialogTitle className="font-semibold">{exam.subject}</DialogTitle>
					</div>
					<DialogDescription>
						Paper {exam.paperNumber} &middot;{" "}
						{getSessionLabel(exam.session, exam.year)}
					</DialogDescription>
				</DialogHeader>

				<m.div
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					className="grid grid-cols-2 gap-3"
				>
					<div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
						<HugeiconsIcon
							icon={Calendar01Icon}
							className="size-4 shrink-0 text-[--system-accent]"
						/>
						<div className="min-w-0">
							<p className="text-[10px] text-muted-foreground">Date</p>
							<p className="truncate font-medium text-xs">
								{formatFriendlyDate(exam.date)}
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
						<HugeiconsIcon
							icon={Clock01Icon}
							className="size-4 shrink-0 text-[--system-accent]"
						/>
						<div className="min-w-0">
							<p className="text-[10px] text-muted-foreground">Time</p>
							<p className="truncate font-medium text-xs">
								{formatTimeRange(exam.startTime, exam.endTime)}
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
						<HugeiconsIcon
							icon={TimeScheduleIcon}
							className="size-4 shrink-0 text-[--system-accent]"
						/>
						<div className="min-w-0">
							<p className="text-[10px] text-muted-foreground">Duration</p>
							<p className="truncate font-medium text-xs">
								{formatDuration(exam.durationHours)}
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
						<HugeiconsIcon
							icon={NoteEditIcon}
							className="size-4 shrink-0 text-[--system-accent]"
						/>
						<div className="min-w-0">
							<p className="text-[10px] text-muted-foreground">Paper</p>
							<p className="truncate font-medium text-xs">
								Paper {exam.paperNumber}
							</p>
						</div>
					</div>
				</m.div>

				{!isPast && (
					<m.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.15 }}
						className="flex items-center justify-center gap-1.5 rounded-lg bg-muted/30 py-2"
					>
						<HugeiconsIcon
							icon={TimeScheduleIcon}
							className="size-3.5 text-[--system-accent]"
						/>
						<Countdown targetDate={exam.date} />
					</m.div>
				)}

				<div className="flex flex-col gap-2">
					<button
						type="button"
						onClick={handlePractice}
						className="flex cursor-pointer items-center justify-between rounded-xl bg-[--system-accent] px-4 py-3 text-left text-white transition-all hover:brightness-110 active:scale-[0.98]"
					>
						<div className="flex items-center gap-2.5">
							<HugeiconsIcon icon={Quiz02Icon} className="size-4" />
							<div>
								<p className="font-medium text-xs">Practice</p>
								<p className="text-[10px] text-white/70">
									AI-generated questions on this subject
								</p>
							</div>
						</div>
					</button>

					<button
						type="button"
						onClick={handleMockExam}
						className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-left transition-all hover:bg-muted/50 active:scale-[0.98]"
					>
						<div className="flex items-center gap-2.5">
							<HugeiconsIcon
								icon={BookOpen01Icon}
								className="size-4 text-muted-foreground"
							/>
							<div>
								<p className="font-medium text-xs">Mock Exam</p>
								<p className="text-[10px] text-muted-foreground">
									Timed practice with exam-format questions
								</p>
							</div>
						</div>
					</button>

					<button
						type="button"
						onClick={handleCommonQuestions}
						className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-left transition-all hover:bg-muted/50 active:scale-[0.98]"
					>
						<div className="flex items-center gap-2.5">
							<HugeiconsIcon
								icon={NoteEditIcon}
								className="size-4 text-muted-foreground"
							/>
							<div>
								<p className="font-medium text-xs">Common Questions</p>
								<p className="text-[10px] text-muted-foreground">
									Frequently tested questions in this subject
								</p>
							</div>
						</div>
					</button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
