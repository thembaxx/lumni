"use client";

import { MasteryBadge } from "@/components/atoms/mastery-badge";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/shared";

interface StudentRow {
	id: string;
	name: string;
	initials: string;
	grade: string;
	overallScore: number;
	weakTopics: string[];
	lastActive: string;
}

interface ClassRosterTableProps extends React.ComponentProps<typeof Table> {
	students: StudentRow[];
	showScores?: boolean;
}

export function ClassRosterTable({
	students,
	showScores = true,
	className,
	...props
}: ClassRosterTableProps) {
	return (
		<div className={cn("rounded-xl border bg-card", className)}>
			<Table {...props}>
				<TableHeader>
					<TableRow>
						<TableHead>Student</TableHead>
						<TableHead>Grade</TableHead>
						{showScores && <TableHead>Overall</TableHead>}
						<TableHead>Weak Areas</TableHead>
						<TableHead>Last Active</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{students.length === 0 && (
						<TableRow>
							<TableCell
								colSpan={showScores ? 5 : 4}
								className="py-8 text-center text-muted-foreground text-sm"
							>
								No students in this class yet.
							</TableCell>
						</TableRow>
					)}
					{students.map((student) => (
						<TableRow key={student.id}>
							<TableCell className="font-medium">{student.name}</TableCell>
							<TableCell>{student.grade}</TableCell>
							{showScores && (
								<TableCell>
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
								</TableCell>
							)}
							<TableCell>
								<div className="flex flex-wrap gap-1">
									{student.weakTopics.slice(0, 3).map((topic) => (
										<Badge key={topic} variant="secondary" className="text-xs">
											{topic}
										</Badge>
									))}
									{student.weakTopics.length > 3 && (
										<Badge variant="outline" className="text-xs">
											+{student.weakTopics.length - 3}
										</Badge>
									)}
								</div>
							</TableCell>
							<TableCell className="text-muted-foreground text-sm">
								{student.lastActive}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
