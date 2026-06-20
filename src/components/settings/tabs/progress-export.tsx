"use client";

import { Download01Icon, PrinterIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useGamification } from "@/hooks/use-gamification";
import { dexieDataAccess } from "@/lib/db";
import type {
	CompetencyDataAccess,
	SyncDataAccess,
} from "@/lib/db/data-access";
import { exportService } from "@/lib/export";

type ExportTabDb = Pick<CompetencyDataAccess, "quizAttempts"> &
	Pick<SyncDataAccess, "examSessions">;

const _deps: { db: ExportTabDb } = { db: dexieDataAccess };

type ExportState = "idle" | "exporting" | "printing" | "csv-exporting";

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

export function ProgressExport() {
	const { levelInfo } = useGamification();
	const [exportState, setExportState] = useState<ExportState>("idle");

	const handleExportJson = async () => {
		setExportState("exporting");
		try {
			const report = await exportService.buildFullReport();
			const blob = new Blob([exportService.toJSON(report)], {
				type: "application/json",
			});
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `lumni-progress-${new Date().toISOString().split("T")[0]}.json`;
			a.click();
			URL.revokeObjectURL(url);
		} finally {
			setExportState("idle");
		}
	};

	const handleExportCsv = async () => {
		setExportState("csv-exporting");
		try {
			const [quizAttempts, examSessions] = await Promise.all([
				_deps.db.quizAttempts
					.orderBy("completedAt")
					.reverse()
					.limit(100)
					.toArray(),
				_deps.db.examSessions.toArray(),
			]);
			const csv = exportService.toCSV(quizAttempts, examSessions);
			const blob = new Blob([csv], { type: "text/csv" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `lumni-progress-${new Date().toISOString().split("T")[0]}.csv`;
			a.click();
			URL.revokeObjectURL(url);
		} finally {
			setExportState("idle");
		}
	};

	const handlePrint = async () => {
		setExportState("printing");
		try {
			const report = await exportService.buildFullReport();
			const printWindow = window.open("", "_blank");
			if (!printWindow) return;
			printWindow.document.write(`
				<!DOCTYPE html>
				<html lang="en">
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
							<div class="stat-value">${(report.gamification?.totalXp ?? 0) > 0 ? levelInfo.level : "—"}</div>
							<div class="stat-label">Level (${levelInfo.title})</div>
						</div>
						<div class="stat-card">
							<div class="stat-value">${(report.gamification?.totalXp ?? 0).toLocaleString()}</div>
							<div class="stat-label">Total XP</div>
						</div>
						<div class="stat-card">
							<div class="stat-value">${report.achievements.length}</div>
							<div class="stat-label">Achievements</div>
						</div>
					</div>

					<div class="stats">
						<div class="stat-card">
							<div class="stat-value">${report.quizHistory.length}</div>
							<div class="stat-label">Quiz Attempts</div>
						</div>
						<div class="stat-card">
							<div class="stat-value">${report.examSessions.length}</div>
							<div class="stat-label">Exam Sessions</div>
						</div>
						<div class="stat-card">
							<div class="stat-value">${report.wrongAnswers.length}</div>
							<div class="stat-label">Wrong Answers</div>
						</div>
					</div>

					<h2 class="section-title">Competency by Subject</h2>
					<table>
						<thead>
							<tr><th scope="col">Subject</th><th scope="col">Topics</th><th scope="col">Avg Score</th></tr>
						</thead>
						<tbody>
							${Object.entries(report.competency)
								.map(
									([subject, data]) =>
										`<tr><td>${escapeHtml(subject)}</td><td>${escapeHtml(String(data.topics))}</td><td>${Math.round(data.averageScore)}%</td></tr>`,
								)
								.join("")}
						</tbody>
					</table>

					<h2 class="section-title">Achievements (${report.achievements.length})</h2>
					<table>
						<thead>
							<tr><th scope="col">Achievement</th><th scope="col">Rarity</th><th scope="col">Earned</th></tr>
						</thead>
						<tbody>
							${report.achievements
								.map(
									(a) =>
										`<tr><td>${escapeHtml(a.name ?? a.id)}</td><td>${escapeHtml(a.rarity ?? "—")}</td><td>${new Date(a.earnedAt).toLocaleDateString()}</td></tr>`,
								)
								.join("")}
						</tbody>
					</table>

					<h2 class="section-title">Quiz History (${report.quizHistory.length})</h2>
					<table>
						<thead>
							<tr><th scope="col">Subject</th><th scope="col">Score</th><th scope="col">Accuracy</th><th scope="col">Date</th></tr>
						</thead>
						<tbody>
							${report.quizHistory
								.slice(0, 50)
								.map(
									(q) =>
										`<tr><td>${escapeHtml(q.subject)}</td><td>${q.score}/${q.totalQuestions}</td><td>${q.accuracy}%</td><td>${new Date(q.completedAt).toLocaleDateString()}</td></tr>`,
								)
								.join("")}
						</tbody>
					</table>

					<h2 class="section-title">Exam Sessions (${report.examSessions.length})</h2>
					<table>
						<thead>
							<tr><th scope="col">Paper</th><th scope="col">Started</th><th scope="col">Completed</th></tr>
						</thead>
						<tbody>
							${report.examSessions
								.slice(0, 20)
								.map(
									(e) =>
										`<tr><td>${escapeHtml(e.paperId)}</td><td>${new Date(e.startedAt).toLocaleDateString()}</td><td>${e.completed ? "Yes" : "No"}</td></tr>`,
								)
								.join("")}
						</tbody>
					</table>

					<h2 class="section-title">Wrong Answers (${report.wrongAnswers.length})</h2>
					<table>
						<thead>
							<tr><th scope="col">Subject</th><th scope="col">Topic</th><th scope="col">Reviewed</th></tr>
						</thead>
						<tbody>
							${report.wrongAnswers
								.slice(0, 20)
								.map(
									(w) =>
										`<tr><td>${escapeHtml(w.subject)}</td><td>${escapeHtml(w.topic)}</td><td>${w.reviewed ? "Yes" : "No"}</td></tr>`,
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
			setExportState("idle");
		}
	};

	return (
		<div className="flex flex-col gap-3">
			<Button
				variant="outline"
				onClick={handleExportJson}
				disabled={exportState === "exporting"}
				className="w-full"
			>
				<HugeiconsIcon icon={Download01Icon} data-icon="inline-start" />
				{exportState === "exporting" ? "Generating…" : "Download JSON Report"}
			</Button>
			<Button
				variant="outline"
				onClick={handleExportCsv}
				disabled={exportState === "csv-exporting"}
				className="w-full"
			>
				<HugeiconsIcon icon={Download01Icon} data-icon="inline-start" />
				{exportState === "csv-exporting"
					? "Generating…"
					: "Download CSV Report"}
			</Button>
			<Button
				variant="outline"
				onClick={handlePrint}
				disabled={exportState === "printing"}
				className="w-full"
			>
				<HugeiconsIcon icon={PrinterIcon} data-icon="inline-start" />
				{exportState === "printing" ? "Preparing…" : "Print / Save as PDF"}
			</Button>
		</div>
	);
}
