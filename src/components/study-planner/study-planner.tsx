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
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { LocalDataNotice } from "@/components/shared/local-data-notice";
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
	const t = useTranslations();
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
		<div className="flex flex-col gap-6">
			<LocalDataNotice
				page="study-plan"
				description={t("studyPlanner.localDataNotice")}
			/>
			<div className="flex items-center justify-between">
				<h2 className="font-semibold text-2xl">{t("studyPlanner.title")}</h2>
				<div className="flex gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={exportCalendar}
						aria-label={t("studyPlanner.exportCalendar")}
					>
						<HugeiconsIcon icon={Download03Icon} className="mr-1 size-4" />
						{t("studyPlanner.export")}
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setShowAddSession(true)}
					>
						<HugeiconsIcon icon={Add01Icon} className="mr-1 size-4" />
						{t("studyPlanner.addSession")}
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setShowAddExam(true)}
					>
						<HugeiconsIcon icon={Add01Icon} className="mr-1 size-4" />
						{t("studyPlanner.addExam")}
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

function TodaySessionsCard({
	sessions,
	onComplete,
	onDelete,
}: {
	sessions: StudySessionType[];
	onComplete: (id: string) => void;
	onDelete: (id: string) => void;
}) {
	const t = useTranslations();
	return (
		<div className="overflow-hidden rounded-card-lg border border-border/80 bg-card shadow-level-2 transition-colors">
			<header className="rounded-t-card-lg border-border/80 border-t pb-2">
				<h2 className="flex items-center gap-2 font-heading font-medium text-base text-sm">
					<HugeiconsIcon icon={Calendar01Icon} className="size-4" />
					{t("studyPlanner.today")}
				</h2>
			</header>
			<div className="px-4 group-data-[size=sm]/card:px-3">
				{sessions.length === 0 ? (
					<p className="py-4 text-center text-muted-foreground text-sm">
						{t("studyPlanner.noSessionsToday")}
					</p>
				) : (
					<div className="flex flex-col gap-2">
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
										aria-label={t("studyPlanner.markComplete")}
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
									aria-label={t("studyPlanner.deleteSession")}
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
	const t = useTranslations();
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
		<div className="overflow-hidden rounded-card-lg border border-border/80 bg-card shadow-level-2 transition-colors">
			<header className="rounded-t-card-lg border-border/80 border-t pb-2">
				<h2 className="flex items-center gap-2 font-heading font-medium text-base text-sm">
					<HugeiconsIcon icon={Clock01Icon} className="size-4" />
					{t("studyPlanner.upcomingSessions")}
				</h2>
			</header>
			<div className="px-4 group-data-[size=sm]/card:px-3">
				{Object.keys(groupedByDate).length === 0 ? (
					<p className="py-4 text-center text-muted-foreground text-sm">
						{t("studyPlanner.noUpcomingSessions")}
					</p>
				) : (
					<div className="flex flex-col gap-4">
						{Object.entries(groupedByDate).map(
							([date, daySessions]: [string, StudySessionType[]]) => (
								<div key={date}>
									<h3 className="mb-2 font-medium text-muted-foreground text-sm">
										{date}
									</h3>
									<div className="flex flex-col gap-2">
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
														aria-label={t("studyPlanner.markComplete")}
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
													aria-label={t("studyPlanner.deleteSession")}
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
	const t = useTranslations();
	return (
		<div className="overflow-hidden rounded-card-lg border border-border/80 bg-card shadow-level-2 transition-colors">
			<header className="rounded-t-card-lg border-border/80 border-t pb-2">
				<h2 className="flex items-center gap-2 font-heading font-medium text-base text-sm">
					<HugeiconsIcon icon={BookOpen01Icon} className="size-4" />
					{t("studyPlanner.upcomingExams")}
				</h2>
			</header>
			<div className="px-4 group-data-[size=sm]/card:px-3">
				{exams.length === 0 ? (
					<p className="py-4 text-center text-muted-foreground text-sm">
						{t("studyPlanner.noExams")}
					</p>
				) : (
					<div className="flex flex-col gap-2">
						{exams.map((exam) => (
							<div
								key={exam.id}
								className="flex items-center justify-between rounded-lg bg-muted p-3"
							>
								<div>
									<p className="font-medium text-sm">{exam.subject}</p>
									<p className="text-muted-foreground text-xs">
										{t("studyPlanner.daysLeft", {
											paper: exam.paper,
											days: exam.daysUntil,
										})}
									</p>
								</div>
								<Button
									variant="ghost"
									size="icon-xs"
									onClick={() => onDelete(exam.id)}
									aria-label={t("studyPlanner.deleteSession")}
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
	const t = useTranslations();
	const [subject, setSubject] = useState("");
	const [topic, setTopic] = useState("");
	const [type, setType] = useState<"flashcard" | "exam" | "quiz" | "review">(
		"quiz",
	);
	const [duration, setDuration] = useState(30);
	const [repeat, setRepeat] = useState<"none" | "daily" | "weekly">("none");

	return (
		<div className="fixed inset-0 z-modal flex items-center justify-center bg-black/50">
			<div className="w-full max-w-md overflow-hidden rounded-card-lg border border-border/80 bg-card shadow-level-2 transition-colors">
				<header>
					<h2 className="font-heading font-medium text-sm">
						{t("studyPlanner.addSessionModalTitle")}
					</h2>
				</header>
				<div className="flex flex-col gap-4 px-4 group-data-[size=sm]/card:px-3">
					<div>
						<Label>{t("studyPlanner.sessionSubject")}</Label>
						<Input
							value={subject}
							onChange={(e) => setSubject(e.target.value)}
							placeholder={t("studyPlanner.subjectPlaceholder")}
						/>
					</div>
					<div>
						<Label>{t("studyPlanner.sessionTopic")}</Label>
						<Input
							value={topic}
							onChange={(e) => setTopic(e.target.value)}
							placeholder={t("studyPlanner.topicPlaceholder")}
						/>
					</div>
					<div>
						<Label>{t("studyPlanner.sessionType")}</Label>
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
								<SelectItem value="quiz">
									{t("studyPlanner.typeQuiz")}
								</SelectItem>
								<SelectItem value="flashcard">
									{t("studyPlanner.typeFlashcard")}
								</SelectItem>
								<SelectItem value="exam">
									{t("studyPlanner.typeExamPaper")}
								</SelectItem>
								<SelectItem value="review">
									{t("studyPlanner.typeReview")}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div>
						<Label>{t("studyPlanner.sessionDuration")}</Label>
						<Input
							type="number"
							value={duration}
							onChange={(e) => setDuration(parseInt(e.target.value, 10) || 30)}
							min={5}
							max={120}
						/>
					</div>
					<div>
						<Label>{t("studyPlanner.sessionRepeat")}</Label>
						<Select
							value={repeat}
							onValueChange={(v) => setRepeat(v as "none" | "daily" | "weekly")}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">
									{t("studyPlanner.repeatNone")}
								</SelectItem>
								<SelectItem value="daily">
									{t("studyPlanner.repeatDaily")}
								</SelectItem>
								<SelectItem value="weekly">
									{t("studyPlanner.repeatWeekly")}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="flex gap-2 pt-4">
						<Button variant="outline" onClick={onClose} className="flex-1">
							{t("studyPlanner.cancel")}
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
							{t("studyPlanner.add")}
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
	const t = useTranslations();
	const [subject, setSubject] = useState("");
	const [paper, setPaper] = useState("");
	const [date, setDate] = useState("");

	return (
		<div className="fixed inset-0 z-modal flex items-center justify-center bg-black/50">
			<div className="w-full max-w-md overflow-hidden rounded-card-lg border border-border/80 bg-card shadow-level-2 transition-colors">
				<header>
					<h2 className="font-heading font-medium text-sm">
						{t("studyPlanner.addExamModalTitle")}
					</h2>
				</header>
				<div className="flex flex-col gap-4 px-4 group-data-[size=sm]/card:px-3">
					<div>
						<Label>{t("studyPlanner.examSubject")}</Label>
						<Input
							value={subject}
							onChange={(e) => setSubject(e.target.value)}
							placeholder={t("studyPlanner.subjectPlaceholder")}
						/>
					</div>
					<div>
						<Label>{t("studyPlanner.examPaper")}</Label>
						<Input
							value={paper}
							onChange={(e) => setPaper(e.target.value)}
							placeholder={t("studyPlanner.paperPlaceholder")}
						/>
					</div>
					<div>
						<Label>{t("studyPlanner.examDate")}</Label>
						<Input
							type="date"
							value={date}
							onChange={(e) => setDate(e.target.value)}
						/>
					</div>
					<div className="flex gap-2 pt-4">
						<Button variant="outline" onClick={onClose} className="flex-1">
							{t("studyPlanner.cancel")}
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
							{t("studyPlanner.add")}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
