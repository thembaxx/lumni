"use client";

import {
	BookOpen01Icon,
	Clock01Icon,
	Target01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/shared";

interface SubjectProgress {
	subject: string;
	score: number;
	topicsStudied: number;
	totalTopics: number;
	lastStudied: string;
}

interface WeeklyReportPanelProps extends React.ComponentProps<"div"> {
	childName: string;
	weekRange: string;
	subjects: SubjectProgress[];
	totalMinutes: number;
	quizzesCompleted: number;
	streakDays: number;
}

export function WeeklyReportPanel({
	childName,
	weekRange,
	subjects,
	totalMinutes,
	quizzesCompleted,
	streakDays,
	className,
	...props
}: WeeklyReportPanelProps) {
	return (
		<div className={cn("flex flex-col gap-4", className)} {...props}>
			<div className="flex items-center justify-between">
				<div>
					<h2 className="font-heading font-semibold text-xl tracking-tight">
						{childName}&apos;s Weekly Report
					</h2>
					<p className="text-muted-foreground text-sm">{weekRange}</p>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<StatCard
					icon={Clock01Icon}
					label="Study Time"
					value={`${Math.round(totalMinutes / 60)}h ${totalMinutes % 60}m`}
				/>
				<StatCard
					icon={BookOpen01Icon}
					label="Quizzes Done"
					value={String(quizzesCompleted)}
				/>
				<StatCard
					icon={Target01Icon}
					label="Streak"
					value={`${streakDays} days`}
				/>
			</div>

			<Tabs defaultValue="subjects" className="w-full">
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="subjects">By Subject</TabsTrigger>
					<TabsTrigger value="topics">Topics</TabsTrigger>
				</TabsList>
				<TabsContent value="subjects" className="mt-4 flex flex-col gap-3">
					{subjects.map((subject) => (
						<SubjectRow key={subject.subject} {...subject} />
					))}
				</TabsContent>
				<TabsContent value="topics" className="mt-4 flex flex-col gap-3">
					{subjects.map((subject) => (
						<Card key={subject.subject} className="p-4">
							<p className="mb-2 font-medium text-sm">{subject.subject}</p>
							<div className="flex flex-col gap-2">
								{Array.from(
									{ length: Math.min(subject.topicsStudied, 3) },
									(_, i) => {
										const hash = subject.subject.length + i * 17;
										const mastery = 40 + (hash % 55);
										return (
											<div
												// biome-ignore lint/suspicious/noArrayIndexKey: generated mock data, no real entity ID
												key={i}
												className="flex items-center justify-between"
											>
												<span className="text-muted-foreground text-xs">
													Topic {i + 1}
												</span>
												<div className="flex items-center gap-2">
													<Progress value={mastery} className="h-1.5 w-20" />
													<span className="text-[10px] text-muted-foreground">
														{mastery}%
													</span>
												</div>
											</div>
										);
									},
								)}
							</div>
						</Card>
					))}
				</TabsContent>
			</Tabs>
		</div>
	);
}

function StatCard({
	icon,
	label,
	value,
}: {
	icon: typeof Clock01Icon;
	label: string;
	value: string;
}) {
	return (
		<Card>
			<CardContent className="flex items-center gap-3 p-4">
				<div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
					<HugeiconsIcon icon={icon} className="text-primary" size={20} />
				</div>
				<div>
					<p className="text-muted-foreground text-xs uppercase tracking-wide">
						{label}
					</p>
					<p className="font-semibold text-lg">{value}</p>
				</div>
			</CardContent>
		</Card>
	);
}

function SubjectRow({
	subject,
	score,
	topicsStudied,
	totalTopics,
}: SubjectProgress) {
	return (
		<Card className="p-4">
			<div className="flex items-center justify-between gap-4">
				<div className="flex items-center gap-3">
					<div className="flex size-8 items-center justify-center rounded-lg bg-secondary">
						<HugeiconsIcon icon={Target01Icon} size={16} />
					</div>
					<div>
						<p className="font-medium text-sm">{subject}</p>
						<p className="text-muted-foreground text-xs">
							{topicsStudied} / {totalTopics} topics
						</p>
					</div>
				</div>
				<div className="w-32">
					<Progress value={score} className="h-2" />
					<p className="mt-1 text-right text-muted-foreground text-xs">
						{score}%
					</p>
				</div>
			</div>
		</Card>
	);
}
