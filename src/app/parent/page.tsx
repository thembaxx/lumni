"use client";

import { UserAccountIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { ActivityTimeline } from "@/components/parent/activity-timeline";
import { ChildSelector } from "@/components/parent/child-selector";
import { ParentShell } from "@/components/parent/parent-shell";
import { WeeklyReportPanel } from "@/components/parent/weekly-report-panel";

const MOCK_CHILDREN = [
	{ id: "1", name: "Thando Molefe", initials: "TM", grade: "Matric" },
	{ id: "2", name: "Sipho Molefe", initials: "SM", grade: "Grade 11" },
];

const MOCK_SUBJECTS = [
	{
		subject: "Mathematics",
		score: 72,
		topicsStudied: 8,
		totalTopics: 12,
		lastStudied: "2 hours ago",
	},
	{
		subject: "Physical Sciences",
		score: 65,
		topicsStudied: 5,
		totalTopics: 10,
		lastStudied: "1 day ago",
	},
	{
		subject: "Life Sciences",
		score: 81,
		topicsStudied: 6,
		totalTopics: 8,
		lastStudied: "3 hours ago",
	},
];

const MOCK_ACTIVITIES = [
	{
		id: "a1",
		type: "quiz" as const,
		description: "Completed Mathematics quiz",
		timestamp: "2 hours ago",
		subject: "Mathematics",
		score: 85,
	},
	{
		id: "a2",
		type: "flashcard" as const,
		description: "Reviewed 20 flashcards",
		timestamp: "5 hours ago",
		subject: "Physical Sciences",
	},
	{
		id: "a3",
		type: "planner" as const,
		description: "Finished study session",
		timestamp: "Yesterday",
		subject: "Life Sciences",
	},
];

export default function ParentDashboardPage() {
	const [selectedChild, setSelectedChild] = useState(MOCK_CHILDREN[0].id);
	const selectedChildData =
		MOCK_CHILDREN.find((c) => c.id === selectedChild) ?? MOCK_CHILDREN[0];

	return (
		<ParentShell>
			<div className="mx-auto max-w-5xl space-y-6">
				<div className="flex items-center gap-3">
					<HugeiconsIcon
						icon={UserAccountIcon}
						size={28}
						className="text-primary"
					/>
					<h1 className="font-bold font-heading text-2xl tracking-tight">
						Parent Dashboard
					</h1>
				</div>

				<ChildSelector
					students={MOCK_CHILDREN}
					selectedId={selectedChild}
					onValueChange={setSelectedChild}
				/>

				<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
					<div className="lg:col-span-2">
						<WeeklyReportPanel
							childName={selectedChildData.name}
							weekRange="19 May – 25 May 2026"
							subjects={MOCK_SUBJECTS}
							totalMinutes={420}
							quizzesCompleted={12}
							streakDays={5}
						/>
					</div>
					<div>
						<ActivityTimeline items={MOCK_ACTIVITIES} />
					</div>
				</div>
			</div>
		</ParentShell>
	);
}
