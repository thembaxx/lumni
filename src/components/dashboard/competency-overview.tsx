"use client";

import { ChartUpIcon, Mortarboard01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadialChart } from "@/components/ui/charts/radial-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { competencyService } from "@/lib/competency-engine/competency-service";
import { cn } from "@/lib/shared";

interface SubjectCompetency {
	subjectId: string;
	subjectName: string;
	color: string;
	icon: string;
	total: number;
	novice: number;
	developing: number;
	proficient: number;
	mastered: number;
	averageScore: number;
}

function CompetencyRing({ score }: { score: number }) {
	const color =
		score >= 80
			? "var(--success)"
			: score >= 60
				? "var(--warning)"
				: "var(--destructive)";

	return (
		<RadialChart value={score} size={80} color={color}>
			<span className="text-sm font-extrabold tabular-nums">{score}%</span>
		</RadialChart>
	);
}

export function CompetencyOverview() {
	const { data: subjectsData } = useQuery({
		queryKey: ["subjects"],
		queryFn: async () => {
			const res = await fetch("/api/subjects");
			if (!res.ok) return [];
			const data = await res.json();
			return data.subjects ?? [];
		},
		staleTime: 1000 * 60 * 60,
	});

	const { data: competencies, isLoading } = useQuery({
		queryKey: ["competency-overview"],
		queryFn: async () => {
			const allComps = await Promise.all(
				(subjectsData ?? []).map(async (s: { id: string }) => {
					const summary = await competencyService.getMasterySummary(s.id);
					return { subjectId: s.id, ...summary };
				}),
			);
			return allComps.filter((c) => c.total > 0);
		},
		enabled: !!subjectsData && subjectsData.length > 0,
	});

	const subjectCompetencies: SubjectCompetency[] = useMemo(() => {
		if (!competencies || !subjectsData) return [];
		return competencies.map((comp) => {
			const subject = (
				subjectsData as {
					id: string;
					name: string;
					color: string;
					icon: string;
				}[]
			).find((s) => s.id === comp.subjectId);
			return {
				subjectId: comp.subjectId,
				subjectName: subject?.name ?? comp.subjectId,
				color: subject?.color ?? "#888",
				icon: subject?.icon ?? "book",
				total: comp.total,
				novice: comp.novice,
				developing: comp.developing,
				proficient: comp.proficient,
				mastered: comp.mastered,
				averageScore: comp.averageScore,
			};
		});
	}, [competencies, subjectsData]);

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-32" />
				</CardHeader>
				<CardContent>
					<div className="flex flex-col gap-3">
						<Skeleton className="h-16 rounded-xl" />
						<Skeleton className="h-16 rounded-xl" />
					</div>
				</CardContent>
			</Card>
		);
	}

	if (subjectCompetencies.length === 0) {
		return null;
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 16 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
		>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle className="text-base font-extrabold tracking-tight flex items-center gap-2">
						<HugeiconsIcon icon={Mortarboard01Icon} className="size-5" />
						Subject Mastery
					</CardTitle>
					<div className="flex items-center gap-1 text-xs text-muted-foreground">
						<HugeiconsIcon icon={ChartUpIcon} className="size-3" />
						<span>Progress</span>
					</div>
				</CardHeader>
				<CardContent className="flex flex-col gap-3">
					{subjectCompetencies.map((sc, i) => (
						<motion.div
							key={sc.subjectId}
							initial={{ opacity: 0, x: -8 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: i * 0.05, duration: 0.3 }}
							className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
						>
							<CompetencyRing score={sc.averageScore} />

							<div className="flex-1 min-w-0">
								<p className="text-sm font-semibold truncate">
									{sc.subjectName}
								</p>
								<div className="flex items-center gap-2 mt-1">
									<div className="flex items-center gap-1">
										{sc.mastered > 0 && (
											<span className="text-xs text-success font-medium">
												{sc.mastered} mastered
											</span>
										)}
										{sc.novice > 0 && (
											<span className="text-xs text-destructive font-medium">
												{sc.novice} weak
											</span>
										)}
									</div>
								</div>
								<div className="flex gap-1 mt-1.5">
									{(
										["novice", "developing", "proficient", "mastered"] as const
									).map((level) => {
										const count = sc[level];
										if (count === 0) return null;
										const pct = sc.total > 0 ? (count / sc.total) * 100 : 0;
										return (
											<div
												key={level}
												className={cn(
													"h-1.5 rounded-full transition-[width]",
													level === "novice" && "bg-destructive",
													level === "developing" && "bg-warning",
													level === "proficient" && "bg-[--system-accent]",
													level === "mastered" && "bg-success",
												)}
												style={{ width: `${Math.max(pct, 4)}%` }}
											/>
										);
									})}
								</div>
							</div>

							<div className="text-right shrink-0">
								<p className="text-xs font-bold tabular-nums">
									{sc.total} topics
								</p>
								<p className="text-[10px] text-muted-foreground">assessed</p>
							</div>
						</motion.div>
					))}
				</CardContent>
			</Card>
		</motion.div>
	);
}
