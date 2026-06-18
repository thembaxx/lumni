"use client";

import { BookOpen01Icon, GraduationCapIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { m } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-context";
import { dexieDataAccess } from "@/lib/db";

interface LessonProgressRow {
	userId: string;
	lessonId: string;
	completedSections: number;
	totalSections: number;
	completedAt: number;
	score?: number;
}

function parseLessonId(lessonId: string) {
	const parts = lessonId.split(":");
	return {
		subjectId: parts[0] ?? "",
		topicId: parts[1] ?? "",
		subtopicId: parts[2] ?? "",
	};
}

export function LessonLibraryCard() {
	const { user } = useAuth();
	const userId = user?.$id ?? "anonymous";

	const { data: recentLessons } = useQuery({
		queryKey: ["lesson-progress-dashboard", userId],
		queryFn: async () => {
			try {
				const records = await dexieDataAccess.lessonProgress
					.where("userId")
					.equals(userId)
					.toArray();
				return records
					.sort((a: LessonProgressRow, b: LessonProgressRow) => {
						const aKey = parseLessonId(a.lessonId);
						const bKey = parseLessonId(b.lessonId);
						const aId = `${aKey.subjectId}:${aKey.topicId}:${aKey.subtopicId}`;
						const bId = `${bKey.subjectId}:${bKey.topicId}:${bKey.subtopicId}`;
						return aId.localeCompare(bId);
					})
					.slice(-5)
					.reverse();
			} catch {
				return [];
			}
		},
		enabled: userId !== "anonymous",
	});

	const hasProgress = recentLessons && recentLessons.length > 0;

	return (
		<Card className="overflow-hidden rounded-2xl shadow-level-1">
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="font-extrabold text-lg">
						Continue Learning
					</CardTitle>
					<HugeiconsIcon
						icon={GraduationCapIcon}
						className="size-5 text-muted-foreground"
					/>
				</div>
			</CardHeader>
			<CardContent className="flex flex-col gap-3 p-5 pt-0">
				{hasProgress ? (
					recentLessons.map((lesson: LessonProgressRow) => {
						const { subjectId, topicId, subtopicId } = parseLessonId(
							lesson.lessonId,
						);
						const pct =
							lesson.totalSections > 0
								? Math.round(
										(lesson.completedSections / lesson.totalSections) * 100,
									)
								: 0;
						const label = subtopicId
							.replace(/-/g, " ")
							.replace(/\b\w/g, (c) => c.toUpperCase());

						return (
							<m.div
								key={lesson.lessonId}
								initial={{ opacity: 0, y: 8 }}
								animate={{ opacity: 1, y: 0 }}
								className="flex items-center gap-3 rounded-2xl border bg-card p-3"
							>
								<div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[--system-accent]/10">
									<HugeiconsIcon
										icon={BookOpen01Icon}
										className="size-4 text-[--system-accent]"
									/>
								</div>
								<div className="min-w-0 flex-1">
									<p className="truncate font-semibold text-sm">{label}</p>
									<div className="mt-1 flex items-center gap-2">
										<div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
											<div
												className="h-full rounded-full bg-[--system-accent] transition-[width]"
												style={{ width: `${pct}%` }}
											/>
										</div>
										<span className="text-[10px] text-muted-foreground tabular-nums">
											{pct}%
										</span>
									</div>
								</div>
								<Button
									variant="ghost"
									size="sm"
									className="shrink-0 rounded-full text-xs"
									onClick={() =>
										(window.location.href = `/study/${subjectId}/${topicId}/${subtopicId}`)
									}
								>
									Resume
								</Button>
							</m.div>
						);
					})
				) : (
					<div className="flex flex-col items-center gap-3 py-6 text-center">
						<HugeiconsIcon
							icon={BookOpen01Icon}
							className="size-10 text-muted-foreground/30"
						/>
						<p className="text-muted-foreground text-sm">
							Start a lesson to track your progress here.
						</p>
						<Button
							variant="outline"
							size="sm"
							className="rounded-full"
							onClick={() => (window.location.href = "/study")}
						>
							Browse Lessons
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
