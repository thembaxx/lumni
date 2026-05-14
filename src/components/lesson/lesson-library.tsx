"use client";

import { useQuery } from "@tanstack/react-query";
import {
	BookOpen,
	Clock,
	Dumbbell,
	GraduationCap,
	Target,
	Trophy,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SubjectsDrawer } from "@/components/dashboard/drawers/subjects-drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useFilteredSubjects } from "@/hooks/use-subjects";
import type { TopicRecommendation } from "@/lib/competency-engine/path-engine";

const levelColors: Record<string, string> = {
	novice: "bg-red-500/10 text-red-500 border-red-500/20",
	developing: "bg-amber-500/10 text-amber-500 border-amber-500/20",
	proficient: "bg-blue-500/10 text-blue-500 border-blue-500/20",
	mastered: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
	unknown: "bg-muted text-muted-foreground border-border",
};

const actionIcons = {
	study: BookOpen,
	practice: Dumbbell,
	review: Clock,
	skip: Trophy,
};

const actionLabels: Record<string, string> = {
	study: "Study",
	practice: "Practice",
	review: "Review",
	skip: "Mastered",
};

export function LessonLibrary() {
	const router = useRouter();
	const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
	useFilteredSubjects("");

	const { data, isLoading, error } = useQuery({
		queryKey: ["next-topics", selectedSubject],
		queryFn: async () => {
			const params = new URLSearchParams();
			if (selectedSubject) params.set("subject", selectedSubject);
			const res = await fetch(`/api/engine/next-topics?${params.toString()}`);
			if (!res.ok) throw new Error("Failed to fetch recommendations");
			return res.json() as Promise<{
				recommendations: TopicRecommendation[];
				summary: {
					total: number;
					novice: number;
					developing: number;
					proficient: number;
					mastered: number;
					averageScore: number;
				};
			}>;
		},
		enabled: !!selectedSubject,
		staleTime: 1000 * 60 * 5,
	});

	const recommendations = data?.recommendations ?? [];
	const summary = data?.summary;
	const activeRecs = recommendations.filter((r) => r.action !== "skip");
	const nextUp = activeRecs[0];

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-lg font-semibold flex items-center gap-2 text-balance">
						<Target className="size-5 text-[--system-accent]" />
						Your Learning Path
					</h2>
					<p className="text-sm text-muted-foreground mt-0.5 text-pretty">
						Personalized recommendations based on your progress
					</p>
				</div>
				<SubjectsDrawer onSelect={(subject) => setSelectedSubject(subject)}>
					<Button variant="outline" size="sm" className="gap-2">
						{selectedSubject ?? "Select subject"}
					</Button>
				</SubjectsDrawer>
			</div>

			{!selectedSubject && (
				<Card className="p-8 text-center rounded-3xl">
					<GraduationCap className="size-10 mx-auto mb-3 text-muted-foreground" />
					<p className="text-sm text-muted-foreground">
						Select a subject to see your personalized study recommendations.
					</p>
				</Card>
			)}

			{isLoading && selectedSubject && (
				<div className="flex flex-col gap-3">
					<Skeleton className="h-24 w-full rounded-xl" />
					<Skeleton className="h-20 w-full rounded-xl" />
					<Skeleton className="h-20 w-full rounded-xl" />
				</div>
			)}

			{error && selectedSubject && (
				<Card className="p-6 text-center rounded-3xl">
					<p className="text-sm text-destructive">
						Failed to load recommendations.
					</p>
				</Card>
			)}

			{!isLoading && !error && selectedSubject && summary && (
				<>
					<div className="grid grid-cols-5 gap-2">
						{(
							[
								{
									label: "Total",
									value: summary.total,
									color: "text-muted-foreground",
								},
								{
									label: "Novice",
									value: summary.novice,
									color: "text-red-500",
								},
								{
									label: "Developing",
									value: summary.developing,
									color: "text-amber-500",
								},
								{
									label: "Proficient",
									value: summary.proficient,
									color: "text-blue-500",
								},
								{
									label: "Mastered",
									value: summary.mastered,
									color: "text-emerald-500",
								},
							] as const
						).map((s) => (
							<Card key={s.label} className="p-3 text-center">
								<div
									className={`text-lg font-extrabold tabular-nums ${s.color}`}
								>
									{s.value}
								</div>
								<div className="text-xs text-muted-foreground">{s.label}</div>
							</Card>
						))}
					</div>

					{summary.averageScore > 0 && (
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<Trophy className="size-4 text-amber-500" />
							Average competency score:{" "}
							<span className="tabular-nums">
								{Math.round(summary.averageScore)}%
							</span>
						</div>
					)}

					{nextUp && (
						<NextUpCard
							nextUp={nextUp}
							selectedSubject={selectedSubject}
							router={router}
						/>
					)}

					{recommendations.length > 0 && (
						<div className="flex flex-col gap-2">
							<h3 className="text-sm font-medium text-muted-foreground">
								All Topics
							</h3>
							{recommendations.map((rec) => {
								const Icon = actionIcons[rec.action];
								return (
									<Card
										key={rec.topicId}
										className={`p-4 flex items-center justify-between gap-3 rounded-3xl ${rec.action === "skip" ? "opacity-50" : ""}`}
									>
										<div className="flex items-center gap-3 min-w-0">
											<div
												className={`size-8 rounded-lg flex items-center justify-center ${levelColors[rec.level] ?? "bg-muted"}`}
											>
												<Icon className="size-4" />
											</div>
											<div className="min-w-0">
												<p className="text-sm font-medium truncate">
													{rec.name}
												</p>
												<div className="flex items-center gap-2 text-xs text-muted-foreground">
													<Badge
														variant="outline"
														className={`text-[10px] px-1.5 py-0 capitalize ${levelColors[rec.level] ?? ""}`}
													>
														{rec.level}
													</Badge>
													<span className="capitalize">
														{actionLabels[rec.action]}
													</span>
													{rec.estimatedMinutes > 0 && (
														<span>{rec.estimatedMinutes} min</span>
													)}
												</div>
											</div>
										</div>
										{rec.action !== "skip" && (
											<Button
												size="sm"
												variant="outline"
												onClick={() =>
													router.push(
														`/quiz?subject=${encodeURIComponent(selectedSubject)}&topic=${encodeURIComponent(rec.topicId)}`,
													)
												}
											>
												Practice
											</Button>
										)}
									</Card>
								);
							})}
						</div>
					)}

					{!isLoading && recommendations.length === 0 && selectedSubject && (
						<Card className="p-6 text-center rounded-3xl">
							<Trophy className="size-8 mx-auto mb-2 text-emerald-500" />
							<p className="text-sm text-muted-foreground">
								No recommendations available. All topics may be mastered.
							</p>
						</Card>
					)}
				</>
			)}
		</div>
	);
}

function NextUpCard({
	nextUp,
	selectedSubject,
	router,
}: {
	nextUp: TopicRecommendation;
	selectedSubject: string;
	router: ReturnType<typeof useRouter>;
}) {
	const NextActionIcon = actionIcons[nextUp.action];
	return (
		<Card className="p-5 border-[--system-accent]/20 bg-[--system-accent]/5 rounded-3xl">
			<div className="flex items-start justify-between gap-4">
				<div className="flex flex-col gap-1 min-w-0">
					<div className="flex items-center gap-2">
						<Badge variant="outline" className="text-xs">
							Next Up
						</Badge>
						<Badge
							variant="outline"
							className={`text-xs capitalize ${levelColors[nextUp.level] ?? ""}`}
						>
							{nextUp.level}
						</Badge>
					</div>
					<h3 className="font-semibold text-base truncate">{nextUp.name}</h3>
					<div className="flex items-center gap-3 text-xs text-muted-foreground">
						<span className="capitalize flex items-center gap-1">
							<NextActionIcon className="size-3.5" />
							{actionLabels[nextUp.action]}
						</span>
						<span className="flex items-center gap-1">
							<Clock className="size-3.5" />
							{nextUp.estimatedMinutes} min
						</span>
					</div>
				</div>
				<Button
					size="sm"
					onClick={() =>
						router.push(
							`/quiz?subject=${encodeURIComponent(selectedSubject)}&topic=${encodeURIComponent(nextUp.topicId)}`,
						)
					}
				>
					Start
				</Button>
			</div>
		</Card>
	);
}
