"use client";

import { Target01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/shared";

interface SubjectProgress {
	subject: string;
	score: number;
	topicsStudied: number;
	totalTopics: number;
	lastStudied: string;
}

interface ChildData {
	id: string;
	name: string;
	initials: string;
	grade: string;
	subjects: SubjectProgress[];
	overallScore: number;
}

interface ChildProgressGridProps extends React.ComponentProps<"div"> {
	childData: ChildData[];
}

export function ChildProgressGrid({
	childData,
	className,
	...props
}: ChildProgressGridProps) {
	if (childData.length === 0) return null;

	return (
		<div className={cn("flex flex-col gap-4", className)} {...props}>
			<h2 className="font-heading font-semibold text-xl tracking-tight">
				All Children Overview
			</h2>
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
				{childData.map((child) => (
					<ChildCard key={child.id} child={child} />
				))}
			</div>
		</div>
	);
}

function ChildCard({ child }: { child: ChildData }) {
	return (
		<Card className="flex flex-col">
			<CardHeader className="pb-2">
				<CardTitle className="flex items-center gap-2 font-heading text-base">
					<span className="flex size-7 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground text-xs">
						{child.initials}
					</span>
					<span className="truncate">{child.name}</span>
					<span className="text-muted-foreground text-xs">({child.grade})</span>
				</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-1 flex-col gap-3">
				<div className="flex items-center justify-between gap-2 rounded-lg bg-muted/30 p-2">
					<span className="text-muted-foreground text-xs">Overall</span>
					<span
						className={cn(
							"font-semibold text-sm",
							child.overallScore >= 70
								? "text-success"
								: child.overallScore >= 40
									? "text-warning"
									: "text-destructive",
						)}
					>
						{child.overallScore}%
					</span>
				</div>
				<ScrollArea className="flex-1">
					<div className="flex flex-col gap-2 pr-4">
						{child.subjects.map((subject) => (
							<SubjectMiniRow key={subject.subject} subject={subject} />
						))}
					</div>
					<ScrollBar orientation="vertical" />
				</ScrollArea>
			</CardContent>
		</Card>
	);
}

function SubjectMiniRow({ subject }: { subject: SubjectProgress }) {
	return (
		<div className="flex items-center gap-2">
			<HugeiconsIcon
				icon={Target01Icon}
				size={14}
				className="shrink-0 text-muted-foreground"
			/>
			<div className="min-w-0 flex-1">
				<div className="flex items-center justify-between gap-2">
					<span className="truncate text-xs">{subject.subject}</span>
					<span className="shrink-0 font-medium text-xs">{subject.score}%</span>
				</div>
				<Progress value={subject.score} className="mt-0.5 h-1.5" />
			</div>
		</div>
	);
}
