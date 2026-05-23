"use client";

import { Download01Icon, PrinterIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useGamification } from "@/hooks/use-gamification";
import { offlineDB } from "@/lib/db/schema";

async function buildReport(
	levelInfo: ReturnType<typeof useGamification>["levelInfo"],
	gamification: ReturnType<typeof useGamification>["gamification"],
) {
	const quizAttempts = await offlineDB.quizAttempts
		.orderBy("completedAt")
		.reverse()
		.limit(100)
		.toArray();

	const competencies = await offlineDB.competencies.toArray();

	return {
		exportedAt: new Date().toISOString(),
		user: {
			level: levelInfo.level,
			title: levelInfo.title,
			totalXp: gamification.totalXp,
		},
		achievements: gamification.achievements.reduce(
			(acc, a) => {
				if (a.earnedAt)
					acc.push({
						name: a.name,
						rarity: a.rarity,
						earnedAt: a.earnedAt,
					});
				return acc;
			},
			[] as { name: string; rarity: string; earnedAt: string }[],
		),
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
}

export function ProgressExport() {
	const { gamification, levelInfo } = useGamification();
	const [isExporting, setIsExporting] = useState(false);
	const [isPrinting, setIsPrinting] = useState(false);

	const handleExport = async () => {
		setIsExporting(true);
		try {
			const report = await buildReport(levelInfo, gamification);
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

	const handlePrint = async () => {
		setIsPrinting(true);
		try {
			const report = await buildReport(levelInfo, gamification);
			const printWindow = window.open("", "_blank");
			if (!printWindow) return;
			printWindow.document.write(`
				<!DOCTYPE html>
				<html>
				<head>
					<title>Lumni Progress Report</title>
					<style>
						:root {
							--text-primary: #1a1a2e;
							--text-secondary: #666;
							--border-color: #e2e8f0;
							--bg-secondary: #f8fafc;
							--bg-primary: #ffffff;
						}
						@media (prefers-color-scheme: dark) {
							:root {
								--text-primary: #e2e8f0;
								--text-secondary: #94a3b8;
								--border-color: #334155;
								--bg-secondary: #1e293b;
								--bg-primary: #0f172a;
							}
						}
						body { font-family: system-ui, sans-serif; padding: 40px; color: var(--text-primary); background: var(--bg-primary); }
						h1 { font-size: 24px; margin-bottom: 8px; }
						.subtitle { color: var(--text-secondary); margin-bottom: 24px; }
						.stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
						.stat-card { border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; background: var(--bg-primary); }
						.stat-value { font-size: 28px; font-weight: 700; color: var(--text-primary); }
						.stat-label { font-size: 12px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
						table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
						th { text-align: left; padding: 8px 12px; background: var(--bg-secondary); border-bottom: 2px solid var(--border-color); font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-secondary); }
						td { padding: 8px 12px; border-bottom: 1px solid var(--border-color); font-size: 14px; color: var(--text-primary); }
						.section-title { font-size: 18px; font-weight: 600; margin: 24px 0 12px; color: var(--text-primary); }
						@media print { body { padding: 20px; } }
					</style>
				</head>
				<body>
					<h1>Lumni Progress Report</h1>
					<p class="subtitle">Generated ${new Date(report.exportedAt).toLocaleDateString()}</p>

					<div class="stats">
						<div class="stat-card">
							<div class="stat-value">${report.user.level}</div>
							<div class="stat-label">Level (${report.user.title})</div>
						</div>
						<div class="stat-card">
							<div class="stat-value">${report.user.totalXp.toLocaleString()}</div>
							<div class="stat-label">Total XP</div>
						</div>
						<div class="stat-card">
							<div class="stat-value">${report.achievements.length}</div>
							<div class="stat-label">Achievements</div>
						</div>
					</div>

					<h2 class="section-title">Competency by Subject</h2>
					<table>
						<thead>
							<tr><th>Subject</th><th>Topics</th><th>Avg Score</th></tr>
						</thead>
						<tbody>
							${Object.entries(report.competency)
								.map(
									([subject, data]) =>
										`<tr><td>${subject}</td><td>${data.topics}</td><td>${Math.round(data.averageScore)}%</td></tr>`,
								)
								.join("")}
						</tbody>
					</table>

					<h2 class="section-title">Achievements (${report.achievements.length})</h2>
					<table>
						<thead>
							<tr><th>Achievement</th><th>Rarity</th><th>Earned</th></tr>
						</thead>
						<tbody>
							${report.achievements
								.map(
									(a) =>
										`<tr><td>${a.name}</td><td>${a.rarity}</td><td>${new Date(a.earnedAt).toLocaleDateString()}</td></tr>`,
								)
								.join("")}
						</tbody>
					</table>

					<h2 class="section-title">Quiz History (${report.quizHistory.length})</h2>
					<table>
						<thead>
							<tr><th>Subject</th><th>Score</th><th>Accuracy</th><th>Date</th></tr>
						</thead>
						<tbody>
							${report.quizHistory
								.slice(0, 50)
								.map(
									(q) =>
										`<tr><td>${q.subject}</td><td>${q.score}/${q.totalQuestions}</td><td>${q.accuracy}%</td><td>${new Date(q.completedAt).toLocaleDateString()}</td></tr>`,
								)
								.join("")}
						</tbody>
					</table>
				</body>
				</html>
			`);
			printWindow.document.close();
			printWindow.focus();
			setTimeout(() => printWindow.print(), 500);
		} finally {
			setIsPrinting(false);
		}
	};

	return (
		<div className="flex flex-col gap-3">
			<Button
				variant="outline"
				onClick={handleExport}
				disabled={isExporting}
				className="w-full"
			>
				<HugeiconsIcon icon={Download01Icon} data-icon="inline-start" />
				{isExporting ? "Generating..." : "Download JSON Report"}
			</Button>
			<Button
				variant="outline"
				onClick={handlePrint}
				disabled={isPrinting}
				className="w-full"
			>
				<HugeiconsIcon icon={PrinterIcon} data-icon="inline-start" />
				{isPrinting ? "Preparing..." : "Print / Save as PDF"}
			</Button>
		</div>
	);
}
