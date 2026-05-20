"use client";

import {
	Add01Icon,
	BookOpen01Icon,
	Calendar01Icon,
	CheckmarkCircle01Icon,
	Clock01Icon,
	Delete02Icon,
	Download03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRef, useState } from "react";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useStudyPlanner } from "@/hooks/use-study-planner";
import { downloadICal, exportToICal } from "@/lib/utils/calendar-export";
import type {
	ExamDate as ExamDateType,
	StudySession as StudySessionType,
} from "@/lib/utils/study-planner";

export function StudyPlanner() {
	return (
		<AppErrorBoundary>
			<StudyPlannerInner />
		</AppErrorBoundary>
	);
}

function StudyPlannerInner() {
	const {
		todaySessions,
		upcomingSessions,
		upcomingExams,
		stats,
		addSession,
		markComplete,
		removeSession,
		addExam,
		removeExam,
	} = useStudyPlanner();

	const [showAddSession, setShowAddSession] = useState(false);
	const [showAddExam, setShowAddExam] = useState(false);
	const _now = useRef(Date.now());

	const exportCalendar = () => {
		const ics = exportToICal(
			[...todaySessions, ...upcomingSessions],
			upcomingExams,
		);
		downloadICal(ics);
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="font-semibold text-2xl">Study Planner</h2>
				<div className="flex gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={exportCalendar}
						aria-label="Export calendar"
					>
						<HugeiconsIcon icon={Download03Icon} className="mr-1 size-4" />
						Export
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setShowAddSession(true)}
					>
						<HugeiconsIcon icon={Add01Icon} className="mr-1 size-4" />
						Add Session
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setShowAddExam(true)}
					>
						<HugeiconsIcon icon={Add01Icon} className="mr-1 size-4" />
						Add Exam
					</Button>
				</div>
			</div>

			<StatsRow stats={stats} />

			<div className="grid gap-6 md:grid-cols-2">
				<TodaySessionsCard
					sessions={todaySessions}
					onComplete={markComplete}
					onDelete={removeSession}
				/>

				<UpcomingExamsCard exams={upcomingExams} onDelete={removeExam} />
			</div>

			<UpcomingSessionsCard
				sessions={upcomingSessions}
				onComplete={markComplete}
				onDelete={removeSession}
			/>

			{showAddSession && (
				<AddSessionModal
					onClose={() => setShowAddSession(false)}
					onAdd={(session) => {
						addSession(session);
						setShowAddSession(false);
					}}
				/>
			)}

			{showAddExam && (
				<AddExamModal
					onClose={() => setShowAddExam(false)}
					onAdd={(exam) => {
						addExam(exam);
						setShowAddExam(false);
					}}
				/>
			)}
		</div>
	);
}

function StatsRow({
	stats,
}: {
	stats: {
		completedSessions: number;
		upcomingSessions: number;
		studyTimeMinutes: number;
		examCount: number;
		daysUntilNextExam: number | null;
	};
}) {
	return (
		<div className="grid grid-cols-4 gap-4">
			<div className="overflow-hidden rounded-[2.5rem] border border-border/80 bg-card shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-colors">
				<div className="p-4 px-4 text-center group-data-[size=sm]/card:px-3">
					<div className="font-extrabold text-2xl">
						{stats.completedSessions}
					</div>
					<div className="text-muted-foreground text-xs">Completed</div>
				</div>
			</div>
			<div className="overflow-hidden rounded-[2.5rem] border border-border/80 bg-card shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-colors">
				<div className="p-4 px-4 text-center group-data-[size=sm]/card:px-3">
					<div className="font-extrabold text-2xl">
						{stats.upcomingSessions}
					</div>
					<div className="text-muted-foreground text-xs">Upcoming</div>
				</div>
			</div>
			<div className="overflow-hidden rounded-[2.5rem] border border-border/80 bg-card shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-colors">
				<div className="p-4 px-4 text-center group-data-[size=sm]/card:px-3">
					<div className="font-extrabold text-2xl">
						{Math.round(stats.studyTimeMinutes / 60)}h
					</div>
					<div className="text-muted-foreground text-xs">Study Time</div>
				</div>
			</div>
			<div className="overflow-hidden rounded-[2.5rem] border border-border/80 bg-card shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-colors">
				<div className="p-4 px-4 text-center group-data-[size=sm]/card:px-3">
					<div className="font-extrabold text-2xl">
						{stats.daysUntilNextExam !== null ? stats.daysUntilNextExam : "-"}
					</div>
					<div className="text-muted-foreground text-xs">Days to Exam</div>
				</div>
			</div>
		</div>
	);
}

function TodaySessionsCard({
	sessions,
	onComplete,
	onDelete,
}: {
	sessions: StudySessionType[];
	onComplete: (id: string) => void;
	onDelete: (id: string) => void;
}) {
	return (
		<div className="overflow-hidden rounded-[2.5rem] border border-border/80 bg-card shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-colors">
			<header className="rounded-t-[2.5rem] border-border/80 border-t pb-2">
				<h2 className="flex items-center gap-2 font-heading font-medium text-base text-sm">
					<HugeiconsIcon icon={Calendar01Icon} className="size-4" />
					Today
				</h2>
			</header>
			<div className="px-4 group-data-[size=sm]/card:px-3">
				{sessions.length === 0 ? (
					<p className="py-4 text-center text-muted-foreground text-sm">
						No sessions scheduled for today
					</p>
				) : (
					<div className="space-y-2">
						{sessions.map((session) => (
							<div
								key={session.id}
								className="flex items-center justify-between rounded-lg bg-muted p-3"
							>
								<div className="flex items-center gap-3">
									<Button
										variant="ghost"
										size="icon-xs"
										onClick={() => onComplete(session.id)}
										aria-label="Mark session as complete"
										className={`rounded-full ${
											session.completed
												? "bg-success text-success-foreground hover:bg-success/90 dark:bg-success/70 dark:hover:bg-success/60"
												: "border-muted-foreground"
										}`}
									>
										{session.completed && (
											<HugeiconsIcon
												icon={CheckmarkCircle01Icon}
												className="size-3"
											/>
										)}
									</Button>
									<div>
										<p className="font-medium text-sm">{session.subject}</p>
										<p className="text-muted-foreground text-xs">
											{session.topic || session.type} • {session.duration}min
										</p>
									</div>
								</div>
								<Button
									variant="ghost"
									size="icon-xs"
									onClick={() => onDelete(session.id)}
									aria-label="Delete study session"
								>
									<HugeiconsIcon icon={Delete02Icon} className="size-4" />
								</Button>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

function UpcomingSessionsCard({
	sessions,
	onComplete,
	onDelete,
}: {
	sessions: StudySessionType[];
	onComplete: (id: string) => void;
	onDelete: (id: string) => void;
}) {
	const groupedByDate = sessions.reduce<Record<string, StudySessionType[]>>(
		(acc, session) => {
			const date = new Date(session.scheduledAt).toLocaleDateString("en", {
				weekday: "long",
				month: "short",
				day: "numeric",
			});
			if (!acc[date]) acc[date] = [];
			acc[date].push(session);
			return acc;
		},
		{},
	);

	return (
		<div className="overflow-hidden rounded-[2.5rem] border border-border/80 bg-card shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-colors">
			<header className="rounded-t-[2.5rem] border-border/80 border-t pb-2">
				<h2 className="flex items-center gap-2 font-heading font-medium text-base text-sm">
					<HugeiconsIcon icon={Clock01Icon} className="size-4" />
					Upcoming Sessions
				</h2>
			</header>
			<div className="px-4 group-data-[size=sm]/card:px-3">
				{Object.keys(groupedByDate).length === 0 ? (
					<p className="py-4 text-center text-muted-foreground text-sm">
						No upcoming sessions
					</p>
				) : (
					<div className="space-y-4">
						{Object.entries(groupedByDate).map(
							([date, daySessions]: [string, StudySessionType[]]) => (
								<div key={date}>
									<h3 className="mb-2 font-medium text-muted-foreground text-sm">
										{date}
									</h3>
									<div className="space-y-2">
										{daySessions.map((session) => (
											<div
												key={session.id}
												className="flex items-center justify-between rounded-lg bg-muted p-3"
											>
												<div className="flex items-center gap-3">
													<Button
														variant="ghost"
														size="icon-xs"
														onClick={() => onComplete(session.id)}
														aria-label="Mark session as complete"
														className={`rounded-full ${
															session.completed
																? "bg-success text-success-foreground hover:bg-success/90 dark:bg-success/70 dark:hover:bg-success/60"
																: "border-muted-foreground"
														}`}
													>
														{session.completed && (
															<HugeiconsIcon
																icon={CheckmarkCircle01Icon}
																className="size-3"
															/>
														)}
													</Button>
													<div>
														<p className="font-medium text-sm">
															{session.subject}
														</p>
														<p className="text-muted-foreground text-xs">
															{session.topic || session.type} •{" "}
															{session.duration}min
														</p>
													</div>
												</div>
												<Button
													variant="ghost"
													size="icon-xs"
													onClick={() => onDelete(session.id)}
													aria-label="Delete study session"
												>
													<HugeiconsIcon
														icon={Delete02Icon}
														className="size-4"
													/>
												</Button>
											</div>
										))}
									</div>
								</div>
							),
						)}
					</div>
				)}
			</div>
		</div>
	);
}

function UpcomingExamsCard({
	exams,
	onDelete,
}: {
	exams: ExamDateType[];
	onDelete: (id: string) => void;
}) {
	return (
		<div className="overflow-hidden rounded-[2.5rem] border border-border/80 bg-card shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-colors">
			<header className="rounded-t-[2.5rem] border-border/80 border-t pb-2">
				<h2 className="flex items-center gap-2 font-heading font-medium text-base text-sm">
					<HugeiconsIcon icon={BookOpen01Icon} className="size-4" />
					Upcoming Exams
				</h2>
			</header>
			<div className="px-4 group-data-[size=sm]/card:px-3">
				{exams.length === 0 ? (
					<p className="py-4 text-center text-muted-foreground text-sm">
						No exams scheduled
					</p>
				) : (
					<div className="space-y-2">
						{exams.map((exam) => (
							<div
								key={exam.id}
								className="flex items-center justify-between rounded-lg bg-muted p-3"
							>
								<div>
									<p className="font-medium text-sm">{exam.subject}</p>
									<p className="text-muted-foreground text-xs">
										{exam.paper} • {exam.daysUntil} days left
									</p>
								</div>
								<Button
									variant="ghost"
									size="icon-xs"
									onClick={() => onDelete(exam.id)}
									aria-label="Delete study session"
								>
									<HugeiconsIcon icon={Delete02Icon} className="size-4" />
								</Button>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

function AddSessionModal({
	onClose,
	onAdd,
}: {
	onClose: () => void;
	onAdd: (session: Omit<StudySessionType, "id">) => void;
}) {
	const [subject, setSubject] = useState("");
	const [topic, setTopic] = useState("");
	const [type, setType] = useState<"flashcard" | "exam" | "quiz" | "review">(
		"quiz",
	);
	const [duration, setDuration] = useState(30);
	const [repeat, setRepeat] = useState<"none" | "daily" | "weekly">("none");

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div className="w-full max-w-md overflow-hidden rounded-[2.5rem] border border-border/80 bg-card shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-colors">
				<header>
					<h2 className="font-heading font-medium text-sm">
						Add Study Session
					</h2>
				</header>
				<div className="space-y-4 px-4 group-data-[size=sm]/card:px-3">
					<div>
						<Label>Subject</Label>
						<Input
							value={subject}
							onChange={(e) => setSubject(e.target.value)}
							placeholder="e.g., Mathematics"
						/>
					</div>
					<div>
						<Label>Topic (optional)</Label>
						<Input
							value={topic}
							onChange={(e) => setTopic(e.target.value)}
							placeholder="e.g., Algebra"
						/>
					</div>
					<div>
						<Label>Type</Label>
						<Select
							value={type}
							onValueChange={(v) =>
								setType(v as "flashcard" | "exam" | "quiz" | "review")
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="quiz">Quiz</SelectItem>
								<SelectItem value="flashcard">Flashcard</SelectItem>
								<SelectItem value="exam">Exam Paper</SelectItem>
								<SelectItem value="review">Review</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div>
						<Label>Duration (minutes)</Label>
						<Input
							type="number"
							value={duration}
							onChange={(e) => setDuration(parseInt(e.target.value, 10) || 30)}
							min={5}
							max={120}
						/>
					</div>
					<div>
						<Label>Repeat</Label>
						<Select
							value={repeat}
							onValueChange={(v) => setRepeat(v as "none" | "daily" | "weekly")}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">No repeat</SelectItem>
								<SelectItem value="daily">Daily</SelectItem>
								<SelectItem value="weekly">Weekly</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="flex gap-2 pt-4">
						<Button variant="outline" onClick={onClose} className="flex-1">
							Cancel
						</Button>
						<Button
							onClick={() =>
								onAdd({
									subject,
									topic: topic || undefined,
									type,
									scheduledAt: Date.now() + 60 * 60 * 1000,
									duration,
									completed: false,
									repeat,
								})
							}
							disabled={!subject}
							className="flex-1"
						>
							Add
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}

function AddExamModal({
	onClose,
	onAdd,
}: {
	onClose: () => void;
	onAdd: (exam: Omit<ExamDateType, "id" | "daysUntil">) => void;
}) {
	const [subject, setSubject] = useState("");
	const [paper, setPaper] = useState("");
	const [date, setDate] = useState("");

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div className="w-full max-w-md overflow-hidden rounded-[2.5rem] border border-border/80 bg-card shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-colors">
				<header>
					<h2 className="font-heading font-medium text-sm">Add Exam Date</h2>
				</header>
				<div className="space-y-4 px-4 group-data-[size=sm]/card:px-3">
					<div>
						<Label>Subject</Label>
						<Input
							value={subject}
							onChange={(e) => setSubject(e.target.value)}
							placeholder="e.g., Mathematics"
						/>
					</div>
					<div>
						<Label>Paper</Label>
						<Input
							value={paper}
							onChange={(e) => setPaper(e.target.value)}
							placeholder="e.g., Paper 1"
						/>
					</div>
					<div>
						<Label>Date</Label>
						<Input
							type="date"
							value={date}
							onChange={(e) => setDate(e.target.value)}
						/>
					</div>
					<div className="flex gap-2 pt-4">
						<Button variant="outline" onClick={onClose} className="flex-1">
							Cancel
						</Button>
						<Button
							onClick={() => {
								if (!subject || !paper || !date) return;
								onAdd({
									subject,
									paper,
									date: new Date(date).getTime(),
								});
							}}
							disabled={!subject || !paper || !date}
							className="flex-1"
						>
							Add
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
