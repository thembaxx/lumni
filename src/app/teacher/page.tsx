"use client";

import { useState } from "react";
import { AssignmentBuilder } from "@/components/teacher/assignment-builder";
import { ClassRosterTable } from "@/components/teacher/class-roster-table";
import { ClassShell } from "@/components/teacher/class-shell";
import { TopicMasteryHeatmap } from "@/components/teacher/topic-mastery-heatmap";

const MOCK_STUDENTS = [
	{
		id: "1",
		name: "Thando M.",
		initials: "TM",
		grade: "Matric",
		overallScore: 72,
		weakTopics: ["Calculus", "Organic Chemistry"],
		lastActive: "2 hours ago",
	},
	{
		id: "2",
		name: "Sipho K.",
		initials: "SK",
		grade: "Matric",
		overallScore: 85,
		weakTopics: ["Trigonometry"],
		lastActive: "1 day ago",
	},
	{
		id: "3",
		name: "Lerato N.",
		initials: "LN",
		grade: "Matric",
		overallScore: 58,
		weakTopics: ["Newton's Laws", "Genetics", "Algebra"],
		lastActive: "3 hours ago",
	},
	{
		id: "4",
		name: "Jamal D.",
		initials: "JD",
		grade: "Matric",
		overallScore: 91,
		weakTopics: [],
		lastActive: "5 hours ago",
	},
	{
		id: "5",
		name: "Aisha B.",
		initials: "AB",
		grade: "Matric",
		overallScore: 64,
		weakTopics: ["Photosynthesis", "Integration"],
		lastActive: "Yesterday",
	},
];

const MOCK_TOPICS = [
	{
		topic: "Calculus",
		mastery: "developing" as const,
		studentCount: 12,
		avgScore: 55,
	},
	{
		topic: "Trigonometry",
		mastery: "proficient" as const,
		studentCount: 12,
		avgScore: 68,
	},
	{
		topic: "Newton's Laws",
		mastery: "developing" as const,
		studentCount: 12,
		avgScore: 52,
	},
	{
		topic: "Organic Chemistry",
		mastery: "novice" as const,
		studentCount: 12,
		avgScore: 41,
	},
	{
		topic: "Genetics",
		mastery: "proficient" as const,
		studentCount: 12,
		avgScore: 71,
	},
	{
		topic: "Algebra",
		mastery: "mastered" as const,
		studentCount: 12,
		avgScore: 84,
	},
	{
		topic: "Photosynthesis",
		mastery: "proficient" as const,
		studentCount: 12,
		avgScore: 69,
	},
	{
		topic: "Integration",
		mastery: "developing" as const,
		studentCount: 12,
		avgScore: 58,
	},
];

const ALL_TOPICS = MOCK_TOPICS.map((t) => t.topic);

export default function TeacherDashboardPage() {
	const [assignedTopics, setAssignedTopics] = useState<string[]>([]);

	const handleAssign = (topics: string[]) => {
		setAssignedTopics(topics);
		// TODO: Call API to create assignment
	};

	return (
		<ClassShell>
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<div className="flex flex-col gap-6 lg:col-span-2">
					<TopicMasteryHeatmap topics={MOCK_TOPICS} />
					<ClassRosterTable students={MOCK_STUDENTS} />
				</div>
				<div>
					<AssignmentBuilder topics={ALL_TOPICS} onAssign={handleAssign} />
					{assignedTopics.length > 0 && (
						<div className="mt-4 rounded-lg border bg-success/5 p-4 text-sm text-success">
							Assigned: {assignedTopics.join(", ")}
						</div>
					)}
				</div>
			</div>
		</ClassShell>
	);
}
