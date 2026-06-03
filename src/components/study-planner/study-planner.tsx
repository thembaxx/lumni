"use client";

import { Add01Icon, Download03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { LocalDataNotice } from "@/components/shared/local-data-notice";
import { Button } from "@/components/ui/button";
import { useStudyPlanner } from "@/hooks/use-study-planner";
import { downloadICal, exportToICal } from "@/lib/utils/calendar-export";
import { AddExamModal } from "./sections/add-exam-modal";
import { AddSessionModal } from "./sections/add-session-modal";
import { StatsRow } from "./sections/stats-row";
import { TodaySessionsCard } from "./sections/today-sessions-card";
import { UpcomingExamsCard } from "./sections/upcoming-exams-card";
import { UpcomingSessionsCard } from "./sections/upcoming-sessions-card";

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
	const _nowRef = useRef<number | null>(null);
	if (_nowRef.current === null) _nowRef.current = Date.now();
	const _now = _nowRef.current;

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
