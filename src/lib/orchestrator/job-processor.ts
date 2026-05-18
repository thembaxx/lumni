import { Query } from "appwrite";
import { curriculumRegistry } from "@/curriculum";
import { competencyService, computeBloomWeight } from "@/lib/competency-engine";
import {
	COLLECTIONS,
	createDocument,
	listDocuments,
	updateDocument,
} from "@/lib/db/client";
import { syncQuestionsToAppwrite } from "@/lib/question-engine/persistence";
import type { Question } from "@/lib/question-engine/types";
import type { ProcessResult } from "@/lib/queue/core";
import { analyticsService } from "@/lib/services/analytics-service";
import { progressService } from "@/lib/services/progress-service";
import { spacedRepService } from "@/lib/services/spaced-rep-service";
import { visualEngine } from "@/lib/visual-engine/visual-engine";
import { queueCore } from "./job-queue";
import type { JobRecord, JobType } from "./types";

type JobHandler = (payload: unknown) => Promise<void>;

const handlers: Record<JobType, JobHandler> = {
	"appwrite-sync": async (payload) => {
		const { questions, subject, topic } = payload as {
			questions: Question[];
			subject: string;
			topic?: string;
		};
		await syncQuestionsToAppwrite(questions, subject, topic);
	},

	"analytics-sync": async (payload) => {
		const { events } = payload as { events: unknown[] };
		await analyticsService.sync(events);
	},

	"spaced-rep-update": async (payload) => {
		const { question, result } = payload as {
			question: Question;
			result: { correct: boolean; score: number };
		};
		await spacedRepService.update(question, result);
	},

	"progress-update": async (payload) => {
		const { subject, result } = payload as {
			subject: string;
			result: { correct: boolean; score: number };
		};
		await progressService.update(subject, result);
	},

	"competency-update": async (payload) => {
		const { subject, topic, bloomLevel, score } = payload as {
			subject: string;
			topic: string;
			bloomLevel: string;
			score: number;
		};

		const curriculum = await curriculumRegistry.getSubject(subject);
		const weight = computeBloomWeight(curriculum, topic, bloomLevel);

		await competencyService.update(
			subject,
			topic,
			bloomLevel as import("@/lib/question-engine/types").BloomLevel,
			score,
			weight,
		);
	},

	"visual-generation": async (payload) => {
		const { questionId, questionText, subject, topic } = payload as {
			questionId: string;
			questionText: string;
			subject: string;
			topic?: string;
		};
		await visualEngine.resolve({
			questionId,
			questionText,
			subject,
			topic: topic ?? "",
		});
	},

	"appwrite-progress-sync": async (payload) => {
		const data = payload as {
			odSubjectId: string;
			userId: string;
			questionsAttempted: number;
			correctCount: number;
			currentStreak: number;
			longestStreak: number;
		};
		const existing = await listDocuments<Record<string, unknown>>(
			COLLECTIONS.USER_PROGRESS,
			[
				Query.equal("userId", data.userId),
				Query.equal("subjectId", data.odSubjectId),
			],
		);
		const now = new Date().toISOString();
		if (existing.length > 0) {
			const doc = existing[0];
			const currentAttempted = (doc.questionsAttempted as number) || 0;
			const currentCorrect = (doc.correctCount as number) || 0;
			const longestStreak = (doc.longestStreak as number) || 0;
			await updateDocument(COLLECTIONS.USER_PROGRESS, doc.$id as string, {
				questionsAttempted: currentAttempted + data.questionsAttempted,
				correctCount: currentCorrect + data.correctCount,
				currentStreak: data.currentStreak,
				longestStreak: Math.max(longestStreak, data.longestStreak),
				updatedAt: now,
			});
		} else {
			await createDocument(COLLECTIONS.USER_PROGRESS, {
				userId: data.userId,
				subjectId: data.odSubjectId,
				questionsAttempted: data.questionsAttempted,
				correctCount: data.correctCount,
				currentStreak: data.currentStreak,
				longestStreak: data.longestStreak,
				createdAt: now,
				updatedAt: now,
			});
		}
	},

	"appwrite-attempt-sync": async (payload) => {
		const data = payload as {
			userId: string;
			subjectId: string;
			score: number;
			totalQuestions: number;
			duration: number;
			completedAt: number;
		};
		await createDocument(COLLECTIONS.STUDY_SESSIONS, {
			userId: data.userId,
			subjectId: data.subjectId,
			questionsAnswered: data.totalQuestions,
			correctCount: data.score,
			duration: data.duration,
			startedAt: new Date(
				data.completedAt - data.duration * 1000,
			).toISOString(),
			endedAt: new Date(data.completedAt).toISOString(),
		});
	},

	"appwrite-competency-sync": async (payload) => {
		const data = payload as {
			subjectId: string;
			topicId: string;
			bloomLevel: string;
			proficiency: number;
			attempts: number;
			level: string;
			lastAssessed: number;
		};
		const existing = await listDocuments<Record<string, unknown>>(
			COLLECTIONS.COMPETENCIES,
			[
				Query.equal("subjectId", data.subjectId),
				Query.equal("topicId", data.topicId),
				Query.equal("bloomLevel", data.bloomLevel),
			],
		);
		const now = new Date().toISOString();
		if (existing.length > 0) {
			await updateDocument(
				COLLECTIONS.COMPETENCIES,
				existing[0].$id as string,
				{
					score: data.proficiency,
					attempts: data.attempts,
					level: data.level,
					lastAssessed: data.lastAssessed,
					updatedAt: now,
				},
			);
		} else {
			await createDocument(COLLECTIONS.COMPETENCIES, {
				subjectId: data.subjectId,
				topicId: data.topicId,
				bloomLevel: data.bloomLevel,
				score: data.proficiency,
				attempts: data.attempts,
				level: data.level,
				lastAssessed: data.lastAssessed,
				createdAt: now,
				updatedAt: now,
			});
		}
	},

	"appwrite-rating-sync": async (payload) => {
		const data = payload as {
			questionId: string;
			subject: string;
			rating: number;
			feedback?: string;
			createdAt: number;
		};
		await createDocument(COLLECTIONS.QUESTIONS, {
			type: "rating",
			questionId: data.questionId,
			subject: data.subject,
			rating: data.rating,
			feedback: data.feedback,
			createdAt: new Date(data.createdAt).toISOString(),
		});
	},
};

export class JobProcessor {
	private concurrencyGuard = { isProcessing: false };

	async processBatch(limit = 5): Promise<ProcessResult> {
		return queueCore.processBatch(
			async (job: JobRecord) => {
				const handler = handlers[job.type];
				if (!handler) throw new Error(`No handler for type: ${job.type}`);
				const payload = JSON.parse(job.payload);
				await handler(payload);
			},
			limit,
			this.concurrencyGuard,
		);
	}
}

export const jobProcessor = new JobProcessor();
