"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { RoleGate } from "@/components/shared/role-gate";
import { AssignmentBuilder } from "@/components/teacher/assignment-builder";
import { AssignmentReviewPanel } from "@/components/teacher/assignment-review-panel";
import { ClassRosterTable } from "@/components/teacher/class-roster-table";
import { ClassShell } from "@/components/teacher/class-shell";
import { StudentDetailDialog } from "@/components/teacher/student-detail-dialog";
import { TopicMasteryHeatmap } from "@/components/teacher/topic-mastery-heatmap";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

interface StudentData {
	id: string;
	name: string;
	initials: string;
	grade: string;
	overallScore: number;
	weakTopics: string[];
	lastActive: string;
}

interface TopicMasteryData {
	topic: string;
	mastery: "mastered" | "proficient" | "developing" | "novice";
	studentCount: number;
	avgScore: number;
}

interface EngagementData {
	totalSessions: number;
	totalQuestionsAnswered: number;
	activeStudents: number;
}

async function assignTopics(topics: string[], dueDate?: string): Promise<void> {
	try {
		const res = await fetch("/api/teacher/assign", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ topics, dueDate }),
		});
		if (!res.ok) throw new Error("Assignment failed");
		toast({
			type: "success",
			message: `Assigned: ${topics.join(", ")}`,
		});
	} catch {
		toast({
			type: "error",
			message: "Failed to create assignment",
		});
	}
}

export default function TeacherDashboardPage() {
	return (
		<RoleGate requiredRole="teacher" fallback={<TeacherDashboardPageInner />}>
			<TeacherDashboardPageInner />
		</RoleGate>
	);
}

function TeacherDashboardPageInner() {
	const queryClient = useQueryClient();
	const [linkId, setLinkId] = useState("");
	const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(
		null,
	);

	const { data, isLoading, isError, error } = useQuery({
		queryKey: ["teacher-students"],
		queryFn: async () => {
			const res = await fetch("/api/teacher/students");
			if (!res.ok) throw new Error("Failed to fetch");
			return res.json() as Promise<{
				students: StudentData[];
				topicMastery: TopicMasteryData[];
				engagement: EngagementData;
			}>;
		},
	});

	const linkStudent = useMutation({
		mutationFn: async (studentId: string) => {
			const res = await fetch("/api/teacher/link", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ studentId }),
			});
			if (!res.ok) throw new Error("Failed to link");
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["teacher-students"] });
			setLinkId("");
			toast({ type: "success", message: "Student linked" });
		},
		onError: () =>
			toast({
				type: "error",
				message: "Failed to link student — check the ID",
			}),
	});

	const unlinkStudent = useMutation({
		mutationFn: async (studentId: string) => {
			const res = await fetch("/api/teacher/link", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ studentId }),
			});
			if (!res.ok) throw new Error("Failed to unlink");
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["teacher-students"] });
			toast({ type: "success", message: "Student unlinked" });
		},
		onError: () =>
			toast({ type: "error", message: "Failed to unlink student" }),
	});

	const handleAssign = assignTopics;

	if (isError) {
		return (
			<ClassShell>
				<div className="rounded-card-lg border border-destructive/60 bg-destructive/5 p-4 text-destructive text-sm">
					Failed to load data: {error?.message}
				</div>
			</ClassShell>
		);
	}

	if (isLoading) {
		return (
			<ClassShell isLoading>
				<div className="flex flex-col gap-6">
					<Skeleton className="h-64 w-full rounded-lg" />
					<Skeleton className="h-48 w-full rounded-lg" />
				</div>
			</ClassShell>
		);
	}

	const students = data?.students ?? [];
	const topicMastery = data?.topicMastery ?? [];
	const engagement = data?.engagement;
	const allTopics = topicMastery.map((t) => t.topic);

	return (
		<ClassShell>
			<div className="mb-6 flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center">
				<div className="flex-1">
					<p className="font-medium text-sm">Link a Student</p>
					<p className="text-muted-foreground text-xs">
						Paste the student&apos;s User ID
					</p>
				</div>
				<div className="flex gap-2">
					<Input
						value={linkId}
						onChange={(e) => setLinkId(e.target.value)}
						placeholder="Student user ID..."
						className="h-9 w-64 text-sm"
					/>
					<Button
						size="sm"
						onClick={() => linkStudent.mutate(linkId)}
						disabled={!linkId.trim() || linkStudent.isPending}
					>
						{linkStudent.isPending ? "Linking..." : "Link"}
					</Button>
				</div>
			</div>

			{students.length === 0 ? (
				<div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
					<p className="font-medium text-lg text-muted-foreground">
						No students linked yet
					</p>
					<p className="max-w-md text-muted-foreground text-sm">
						Ask your students to share their User ID from Settings &gt; Profile
						&gt; Share Profile, then paste it above.
					</p>
				</div>
			) : (
				<>
					{engagement && (
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
							<EngagementCard
								label="Study Sessions"
								value={String(engagement.totalSessions)}
							/>
							<EngagementCard
								label="Questions Answered"
								value={String(engagement.totalQuestionsAnswered)}
							/>
							<EngagementCard
								label="Active Students"
								value={`${engagement.activeStudents} / ${students.length}`}
							/>
						</div>
					)}
					<AssignmentReviewPanel />
					<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
						<div className="flex flex-col gap-6 lg:col-span-2">
							<TopicMasteryHeatmap topics={topicMastery} />
							<ClassRosterTable
								students={students}
								onStudentSelect={setSelectedStudent}
								onUnlink={(id) => unlinkStudent.mutate(id)}
								unlinkingId={
									unlinkStudent.isPending ? unlinkStudent.variables : undefined
								}
							/>
						</div>
						<div>
							<AssignmentBuilder topics={allTopics} onAssign={handleAssign} />
						</div>
					</div>
				</>
			)}

			<StudentDetailDialog
				student={selectedStudent}
				open={selectedStudent !== null}
				onOpenChange={(open) => {
					if (!open) setSelectedStudent(null);
				}}
			/>
		</ClassShell>
	);
}

function EngagementCard({ label, value }: { label: string; value: string }) {
	return (
		<Card>
			<CardContent className="flex flex-col gap-1 p-4">
				<p className="text-muted-foreground text-xs uppercase tracking-wide">
					{label}
				</p>
				<p className="font-semibold text-xl">{value}</p>
			</CardContent>
		</Card>
	);
}
