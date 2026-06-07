import type { WrongAnswerEntry } from "@/hooks/use-wrong-answer-journal";
import { dexieDataAccess } from "@/lib/db";
import type { DataAccess } from "@/lib/db/data-access";
import type { ExamSessionSnapshot, QuizAttempt } from "@/lib/db/schema";
import { flashcardEngine } from "@/lib/flashcard-engine";
import type { FlashcardSM2 } from "@/lib/flashcard-engine/types";
import type { StoredGamification } from "@/lib/gamification-engine/types";

export interface FullReport {
	exportedAt: string;
	gamification: StoredGamification | null;
	achievements: {
		id: string;
		earnedAt: string;
		rarity?: string;
		name?: string;
	}[];
	quizHistory: {
		subject: string;
		score: number;
		totalQuestions: number;
		accuracy: number;
		duration: number;
		completedAt: string;
	}[];
	competency: Record<string, { topics: number; averageScore: number }>;
	examSessions: (Omit<ExamSessionSnapshot, "id"> & { id?: number })[];
	wrongAnswers: WrongAnswerEntry[];
	flashcards: FlashcardSM2[];
}

export class ExportService {
	constructor(private db: DataAccess = dexieDataAccess) {}

	async buildFullReport(): Promise<FullReport> {
		const [
			gamificationData,
			quizAttempts,
			competencies,
			examSessions,
			wrongAnswers,
			flashcards,
		] = await Promise.all([
			this.db.gamification.orderBy("id").reverse().first(),
			this.db.quizAttempts
				.orderBy("completedAt")
				.reverse()
				.limit(100)
				.toArray(),
			this.db.competencies.toArray(),
			this.db.examSessions.toArray(),
			this.db.wrongAnswers.toArray(),
			flashcardEngine.getAll(),
		]);

		return {
			exportedAt: new Date().toISOString(),
			gamification: gamificationData ?? null,
			achievements: gamificationData
				? gamificationData.achievements.reduce(
						(acc, a) => {
							if (a.earnedAt)
								acc.push({
									id: a.id,
									earnedAt: a.earnedAt,
									...((a as unknown as Record<string, unknown>).name
										? {
												name: (a as unknown as Record<string, unknown>)
													.name as string,
											}
										: {}),
									...((a as unknown as Record<string, unknown>).rarity
										? {
												rarity: (a as unknown as Record<string, unknown>)
													.rarity as string,
											}
										: {}),
								});
							return acc;
						},
						[] as FullReport["achievements"],
					)
				: [],
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
			examSessions,
			wrongAnswers,
			flashcards,
		};
	}

	toCSV(attempts: QuizAttempt[], examSessions: ExamSessionSnapshot[]): string {
		const lines: string[] = [];

		if (attempts.length > 0) {
			lines.push("Type,Subject,Score,TotalQuestions,Accuracy,Duration,Date");
			for (const a of attempts) {
				const accuracy =
					a.totalQuestions > 0
						? Math.round((a.score / a.totalQuestions) * 100)
						: 0;
				lines.push(
					[
						"Quiz",
						this.escapeCsv(a.odSubject),
						String(a.score),
						String(a.totalQuestions),
						String(accuracy),
						String(a.duration),
						new Date(a.completedAt).toISOString(),
					].join(","),
				);
			}
		}

		if (examSessions.length > 0) {
			if (attempts.length === 0) {
				lines.push("Type,PaperId,StartedAt,Completed");
			}
			for (const e of examSessions) {
				lines.push(
					[
						"Exam",
						this.escapeCsv(e.paperId),
						new Date(e.startedAt).toISOString(),
						String(e.completed),
					].join(","),
				);
			}
		}

		return lines.join("\n");
	}

	toJSON(report: FullReport): string {
		return JSON.stringify(report, null, 2);
	}

	private escapeCsv(value: string): string {
		if (value.includes(",") || value.includes('"') || value.includes("\n")) {
			return `"${value.replace(/"/g, '""')}"`;
		}
		return value;
	}
}

export const exportService = new ExportService();
