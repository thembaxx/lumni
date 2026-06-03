"use client";

import { MasteryBadge } from "@/components/atoms/mastery-badge";
import { ObservationTimeline } from "@/components/teacher/observation-timeline";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

interface StudentRow {
	id: string;
	name: string;
	initials: string;
	grade: string;
	overallScore: number;
	weakTopics: string[];
	lastActive: string;
}

interface StudentDetailDialogProps {
	student: StudentRow | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function StudentDetailDialog({
	student,
	open,
	onOpenChange,
}: StudentDetailDialogProps) {
	if (!student) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{student.name}</DialogTitle>
					<DialogDescription>
						Grade {student.grade} · Last active {student.lastActive}
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-4">
					<div className="rounded-lg border bg-card p-4">
						<p className="mb-2 font-medium text-sm">Overall Performance</p>
						<div className="flex items-center gap-3">
							<MasteryBadge
								level={
									student.overallScore >= 80
										? "mastered"
										: student.overallScore >= 60
											? "proficient"
											: student.overallScore >= 40
												? "developing"
												: "novice"
								}
							/>
							<Progress value={student.overallScore} className="h-2 flex-1" />
							<span className="font-semibold text-sm">
								{student.overallScore}%
							</span>
						</div>
					</div>

					{student.weakTopics.length > 0 && (
						<div className="rounded-lg border bg-card p-4">
							<p className="mb-2 font-medium text-sm">Areas to Improve</p>
							<div className="flex flex-wrap gap-1.5">
								{student.weakTopics.map((topic) => (
									<Badge
										key={topic}
										variant="secondary"
										className="bg-destructive/10 text-destructive"
									>
										{topic}
									</Badge>
								))}
							</div>
						</div>
					)}

					<div className="rounded-lg border bg-card p-4">
						<p className="mb-2 font-medium text-sm">Observations</p>
						<ObservationTimeline studentId={student.id} />
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
