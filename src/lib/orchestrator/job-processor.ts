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

	"appwrite-study-plan-sync": async (payload) => {
		const { userId, sessions, examDates, generatedAt } = payload as {
			userId: string;
			sessions: unknown[];
			examDates: unknown[];
			generatedAt: number;
		};
		const existing = await listDocuments<Record<string, unknown>>(
			COLLECTIONS.STUDY_PLANS,
			[Query.equal("userId", userId)],
		);
		const now = new Date().toISOString();
		if (existing.length > 0) {
			await updateDocument(COLLECTIONS.STUDY_PLANS, existing[0].$id as string, {
				planData: JSON.stringify(sessions),
				examDates: JSON.stringify(examDates),
				generatedAt: new Date(generatedAt).toISOString(),
				updatedAt: now,
			});
		} else {
			await createDocument(COLLECTIONS.STUDY_PLANS, {
				userId,
				planData: JSON.stringify(sessions),
				examDates: JSON.stringify(examDates),
				generatedAt: new Date(generatedAt).toISOString(),
				updatedAt: now,
				createdAt: now,
			});
		}
	},

	"appwrite-flashcard-sync": async (payload) => {
		const data = payload as {
			id: string;
			front: string;
			back: string;
			subject: string;
			topic?: string;
			easeFactor: number;
			interval: number;
			repetitions: number;
			nextReview: number;
			lastReview: number | null;
			createdAt: number;
		};
		await createDocument(COLLECTIONS.FLASHCARDS, {
			flashcardId: data.id,
			front: data.front,
			back: data.back,
			subject: data.subject,
			topic: data.topic || "",
			easeFactor: data.easeFactor,
			interval: data.interval,
			repetitions: data.repetitions,
			nextReview: new Date(data.nextReview).toISOString(),
			lastReview: data.lastReview
				? new Date(data.lastReview).toISOString()
				: null,
			createdAt: new Date(data.createdAt).toISOString(),
		});
	},

	"appwrite-wrong-answer-sync": async (payload) => {
		const data = payload as {
			questionId: string;
			questionText: string;
			subject: string;
			topic: string;
			correctAnswer: string;
			userAnswer: string;
			explanation: string;
			createdAt: number;
			reviewed: boolean;
			errorType?: string;
		};
		await createDocument(COLLECTIONS.WRONG_ANSWERS, {
			questionId: data.questionId,
			questionText: data.questionText,
			subject: data.subject,
			topic: data.topic,
			correctAnswer: data.correctAnswer,
			userAnswer: data.userAnswer,
			explanation: data.explanation,
			errorType: data.errorType || "unknown",
			reviewed: data.reviewed,
			createdAt: new Date(data.createdAt).toISOString(),
		});
	},

	"appwrite-chat-sync": async (payload) => {
		const data = payload as {
			messageId: string;
			role: string;
			content: string;
			type?: string;
			timestamp: number;
		};
		await createDocument(COLLECTIONS.CHAT_MESSAGES, {
			messageId: data.messageId,
			role: data.role,
			content: data.content,
			type: data.type || "",
			createdAt: new Date(data.timestamp).toISOString(),
		});
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

		const ratings = await listDocuments<Record<string, unknown>>(
			COLLECTIONS.QUESTIONS,
			[
				Query.equal("questionId", data.questionId),
				Query.equal("type", "rating"),
			],
		);

		if (ratings.length >= 3) {
			const avgRating =
				ratings.reduce((sum, r) => sum + ((r.rating as number) || 0), 0) /
				ratings.length;
			if (avgRating < 2) {
				await queueCore.enqueue({
					type: "question-regen",
					payload: JSON.stringify({
						questionId: data.questionId,
						subject: data.subject,
					}),
					status: "pending",
					priority: 40,
					attempts: 0,
					maxRetries: 2,
					scheduledAt: Date.now(),
					createdAt: Date.now(),
				});
			}
		}
	},

	"appwrite-question-flag": async (payload) => {
		const data = payload as {
			questionId: string;
			userId: string;
			reason: string;
			details?: string;
			createdAt: number;
		};
		await createDocument(COLLECTIONS.QUESTION_FLAGS, {
			questionId: data.questionId,
			userId: data.userId,
			reason: data.reason,
			details: data.details || "",
			status: "pending",
			createdAt: new Date(data.createdAt).toISOString(),
		});
	},

	"question-regen": async (payload) => {
		const data = payload as {
			questionId: string;
			subject: string;
		};

		const existingDocs = await listDocuments<Record<string, unknown>>(
			COLLECTIONS.QUESTIONS,
			[Query.equal("$id", data.questionId)],
		);

		if (existingDocs.length === 0) return;

		const existing = existingDocs[0];
		const currentText = (existing.questionText as string) || "";
		const currentTopic = (existing.topicId as string) || "";
		const currentType = (existing.type as string) || "";

		const { getAI } = await import("@/lib/ai/client");
		const ai = getAI();
		const result = await ai.generateWithSystem(
			"You are a question regeneration assistant. Improve the quality of the given question while keeping the same topic, type, and difficulty.",
			`Regenerate this question to improve its quality:\n\nSubject: ${data.subject}\nTopic: ${currentTopic}\nType: ${currentType}\nCurrent question: ${currentText}`,
		);

		if (!("content" in result) || !result.content) {
			console.error(
				"[JobProcessor] AI regen failed for question:",
				data.questionId,
			);
			return;
		}

		const newText = result.content.trim();

		if (newText.length < 10) {
			console.error(
				"[JobProcessor] Regenerated question too short, skipping:",
				data.questionId,
			);
			return;
		}

		if (newText === currentText) {
			console.warn(
				"[JobProcessor] Regenerated question unchanged, skipping:",
				data.questionId,
			);
			return;
		}

		await updateDocument(COLLECTIONS.QUESTIONS, data.questionId, {
			questionText: newText,
			updatedAt: new Date().toISOString(),
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
