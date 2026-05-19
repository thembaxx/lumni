"use client";

import { Download01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useGamification } from "@/hooks/use-gamification";
import { offlineDB } from "@/lib/db/schema";

export function ProgressExport() {
	const { gamification, levelInfo } = useGamification();
	const [isExporting, setIsExporting] = useState(false);

	const handleExport = async () => {
		setIsExporting(true);
		try {
			const quizAttempts = await offlineDB.quizAttempts
				.orderBy("completedAt")
				.reverse()
				.limit(100)
				.toArray();

			const competencies = await offlineDB.competencies.toArray();

			const report = {
				exportedAt: new Date().toISOString(),
				user: {
					level: levelInfo.level,
					title: levelInfo.title,
					totalXp: gamification.totalXp,
					currentStreak: 0,
				},
				achievements: gamification.achievements
					.filter((a) => a.earnedAt)
					.map((a) => ({
						name: a.name,
						rarity: a.rarity,
						earnedAt: a.earnedAt,
					})),
				quizHistory: quizAttempts.map((a) => ({
					subject: a.odSubject,
					score: a.score,
					totalQuestions: a.totalQuestions,
					accuracy:
						a.totalQuestions > 0
							? Math.round((a.score / a.totalQuestions) * 100)
							: 0,
					duration: a.duration,
					completedAt: new Date(a.completedAt).toISOString(),
				})),
				competency: competencies.reduce<
					Record<string, { topics: number; averageScore: number }>
				>((acc, c) => {
					if (!acc[c.subjectId]) {
						acc[c.subjectId] = { topics: 0, averageScore: 0 };
					}
					acc[c.subjectId].topics++;
					acc[c.subjectId].averageScore =
						(acc[c.subjectId].averageScore * (acc[c.subjectId].topics - 1) +
							c.score) /
						acc[c.subjectId].topics;
					return acc;
				}, {}),
			};

			const blob = new Blob([JSON.stringify(report, null, 2)], {
				type: "application/json",
			});
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `lumni-progress-${new Date().toISOString().split("T")[0]}.json`;
			a.click();
			URL.revokeObjectURL(url);
		} finally {
			setIsExporting(false);
		}
	};

	return (
		<Button
			variant="outline"
			onClick={handleExport}
			disabled={isExporting}
			className="w-full"
		>
			<HugeiconsIcon icon={Download01Icon} data-icon="inline-start" />
			{isExporting ? "Generating..." : "Download Progress Report"}
		</Button>
	);
}
