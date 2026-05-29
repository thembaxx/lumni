"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { cn } from "@/lib/shared";

const BLOOM_ORDER = [
	"remember",
	"understand",
	"apply",
	"analyze",
	"evaluate",
	"create",
] as const;
const _LEVEL_ORDER = [
	"novice",
	"developing",
	"proficient",
	"mastered",
] as const;

const LEVEL_COLORS: Record<string, string> = {
	novice: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
	developing:
		"bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
	proficient:
		"bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
	mastered: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
};

const LEVEL_BG: Record<string, string> = {
	novice: "bg-red-50 dark:bg-red-950/20",
	developing: "bg-amber-50 dark:bg-amber-950/20",
	proficient: "bg-emerald-50 dark:bg-emerald-950/20",
	mastered: "bg-blue-50 dark:bg-blue-950/20",
};

interface CompetencyRecord {
	id?: number;
	subjectId: string;
	topicId: string;
	bloomLevel: string;
	score: number;
	attempts: number;
	lastAssessed: number;
	level: string;
}

export function MasteryHeatmap() {
	const [selectedSubject, setSelectedSubject] = useState("");

	const { data: subjects = [] } = useQuery({
		queryKey: ["subjects"],
		queryFn: async () => {
			const res = await fetch("/api/admin/subjects");
			if (!res.ok) return [];
			const data = await res.json();
			return (data.subjects || []) as {
				id: string;
				name: string;
				code: string;
			}[];
		},
	});

	const { data: competencies = [] } = useQuery({
		queryKey: ["competencies", selectedSubject],
		queryFn: async () => {
			if (!selectedSubject) return [];
			const { competencyService } = await import("@/lib/competency-engine");
			const records = await competencyService.getCompetencies(selectedSubject);
			return records as CompetencyRecord[];
		},
		enabled: !!selectedSubject,
	});

	const topics = [...new Set(competencies.map((c) => c.topicId))].toSorted();
	const overallByTopic = topics.map((topic) => {
		const topicComps = competencies.filter((c) => c.topicId === topic);
		const avgScore =
			topicComps.length > 0
				? Math.round(
						topicComps.reduce((s, c) => s + c.score, 0) / topicComps.length,
					)
				: 0;
		const avgLevel =
			avgScore >= 85
				? "mastered"
				: avgScore >= 65
					? "proficient"
					: avgScore >= 40
						? "developing"
						: "novice";
		return { topic, avgScore, avgLevel };
	});

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center gap-3">
				<select
					value={selectedSubject}
					onChange={(e) => setSelectedSubject(e.target.value)}
					className="flex-1 rounded-lg border border-border bg-card px-3 py-1.5 text-sm"
				>
					<option value="">Select a subject</option>
					{subjects.map((s) => (
						<option key={s.id || s.code} value={s.code || s.id}>
							{s.name}
						</option>
					))}
				</select>
			</div>

			{!selectedSubject && (
				<div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
					<span className="text-3xl">📊</span>
					<p className="text-sm">
						Select a subject to see your mastery heatmap
					</p>
				</div>
			)}

			{selectedSubject && topics.length === 0 && (
				<div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
					<span className="text-3xl">📊</span>
					<p className="text-sm">
						No competency data yet. Complete some quizzes to build your heatmap.
					</p>
				</div>
			)}

			{selectedSubject && topics.length > 0 && (
				<>
					<div className="overflow-x-auto">
						<table className="w-full text-xs">
							<thead>
								<tr>
									<th className="w-40 p-2 text-left font-medium text-muted-foreground">
										Topic
									</th>
									{BLOOM_ORDER.map((bloom) => (
										<th
											key={bloom}
											className="min-w-[80px] p-2 text-center font-medium text-muted-foreground capitalize"
										>
											{bloom}
										</th>
									))}
									<th className="min-w-[80px] p-2 text-center font-medium text-muted-foreground">
										Overall
									</th>
								</tr>
							</thead>
							<tbody>
								{topics.map((topic) => {
									const overall = overallByTopic.find((o) => o.topic === topic);
									return (
										<tr key={topic} className="border-border/40 border-t">
											<td
												className="max-w-[160px] truncate p-2 font-medium text-sm"
												title={topic}
											>
												{topic}
											</td>
											{BLOOM_ORDER.map((bloom) => {
												const rec = competencies.find(
													(c) => c.topicId === topic && c.bloomLevel === bloom,
												);
												return (
													<td key={bloom} className="p-1">
														{rec ? (
															<div
																className={cn(
																	"rounded px-2 py-1.5 text-center font-medium font-mono text-xs",
																	LEVEL_BG[rec.level] || "bg-muted",
																)}
																title={`${rec.score}% — ${rec.attempts} attempts`}
															>
																{rec.score}%
															</div>
														) : (
															<div className="rounded px-2 py-1.5 text-center text-muted-foreground/30">
																-
															</div>
														)}
													</td>
												);
											})}
											<td className="p-1">
												{overall && (
													<div
														className={cn(
															"rounded px-2 py-1.5 text-center font-mono font-semibold text-xs",
															LEVEL_COLORS[overall.avgLevel],
														)}
													>
														{overall.avgScore}%
													</div>
												)}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>

					<div className="flex items-center gap-4 pt-2 text-muted-foreground text-xs">
						<span className="flex items-center gap-1">
							<span className="size-3 rounded bg-red-100 dark:bg-red-900/30" />{" "}
							Novice
						</span>
						<span className="flex items-center gap-1">
							<span className="size-3 rounded bg-amber-100 dark:bg-amber-900/30" />{" "}
							Developing
						</span>
						<span className="flex items-center gap-1">
							<span className="size-3 rounded bg-emerald-100 dark:bg-emerald-900/30" />{" "}
							Proficient
						</span>
						<span className="flex items-center gap-1">
							<span className="size-3 rounded bg-blue-100 dark:bg-blue-900/30" />{" "}
							Mastered
						</span>
					</div>
				</>
			)}
		</div>
	);
}
