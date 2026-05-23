import { Query } from "appwrite";
import {
	COLLECTIONS,
	createDocument,
	listDocuments,
	updateDocument,
} from "@/lib/db/client";
import { queueCore } from "@/lib/orchestrator/job-queue";
import { syncQuestionsToAppwrite } from "@/lib/question-engine/persistence";
import type { Question } from "@/lib/question-engine/types";
import type { JobHandler } from "./index";

async function upsertDocument(
	collection: string,
	findQuery: string[],
	data: Record<string, unknown>,
): Promise<void> {
	const existing = await listDocuments<Record<string, unknown>>(
		collection,
		findQuery,
	);
	const now = new Date().toISOString();
	if (existing.length > 0) {
		await updateDocument(collection, existing[0].$id as string, {
			...data,
			updatedAt: now,
		});
	} else {
		await createDocument(collection, {
			...data,
			createdAt: now,
			updatedAt: now,
		});
	}
}

export const appwriteSync: JobHandler = async (payload) => {
	const { questions, subject, topic } = payload as {
		questions: Question[];
		subject: string;
		topic?: string;
	};
	await syncQuestionsToAppwrite(questions, subject, topic);
};

export const appwriteProgressSync: JobHandler = async (payload) => {
	const data = payload as {
		odSubjectId: string;
		userId: string;
		questionsAttempted: number;
		correctCount: number;
		currentStreak: number;
		longestStreak: number;
	};
	await upsertDocument(
		COLLECTIONS.USER_PROGRESS,
		[
			Query.equal("userId", data.userId),
			Query.equal("subjectId", data.odSubjectId),
		],
		{
			userId: data.userId,
			subjectId: data.odSubjectId,
			questionsAttempted: data.questionsAttempted,
			correctCount: data.correctCount,
			currentStreak: data.currentStreak,
			longestStreak: data.longestStreak,
		},
	);
};

export const appwriteAttemptSync: JobHandler = async (payload) => {
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
		startedAt: new Date(data.completedAt - data.duration * 1000).toISOString(),
		endedAt: new Date(data.completedAt).toISOString(),
	});
};

export const appwriteCompetencySync: JobHandler = async (payload) => {
	const data = payload as {
		userId?: string;
		subjectId: string;
		topicId: string;
		bloomLevel: string;
		proficiency: number;
		attempts: number;
		level: string;
		lastAssessed: number;
	};
	await upsertDocument(
		COLLECTIONS.COMPETENCIES,
		[
			Query.equal("subjectId", data.subjectId),
			Query.equal("topicId", data.topicId),
			Query.equal("bloomLevel", data.bloomLevel),
		],
		{
			userId: data.userId,
			subjectId: data.subjectId,
			topicId: data.topicId,
			bloomLevel: data.bloomLevel,
			score: data.proficiency,
			attempts: data.attempts,
			level: data.level,
			lastAssessed: data.lastAssessed,
		},
	);
};

export const appwriteFlashcardSync: JobHandler = async (payload) => {
	const data = payload as {
		userId?: string;
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
		userId: data.userId,
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
};

export const appwriteWrongAnswerSync: JobHandler = async (payload) => {
	const data = payload as {
		userId?: string;
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
		userId: data.userId,
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
};

export const appwriteChatSync: JobHandler = async (payload) => {
	const data = payload as {
		userId?: string;
		messageId: string;
		role: string;
		content: string;
		type?: string;
		timestamp: number;
	};
	await createDocument(COLLECTIONS.CHAT_MESSAGES, {
		userId: data.userId,
		messageId: data.messageId,
		role: data.role,
		content: data.content,
		type: data.type || "",
		createdAt: new Date(data.timestamp).toISOString(),
	});
};

export const appwriteRatingSync: JobHandler = async (payload) => {
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
		[Query.equal("questionId", data.questionId), Query.equal("type", "rating")],
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
};

export const appwriteStudyPlanSync: JobHandler = async (payload) => {
	const data = payload as {
		userId: string;
		sessions: unknown[];
		examDates: unknown[];
		generatedAt: number;
	};

	const existing = await listDocuments<Record<string, unknown>>(
		COLLECTIONS.STUDY_PLANS,
		[Query.equal("userId", data.userId)],
	);
	const now = new Date().toISOString();
	if (existing.length > 0) {
		await updateDocument(COLLECTIONS.STUDY_PLANS, existing[0].$id as string, {
			planData: JSON.stringify(data.sessions),
			examDates: JSON.stringify(data.examDates),
			generatedAt: new Date(data.generatedAt).toISOString(),
			updatedAt: now,
		});
	} else {
		await createDocument(COLLECTIONS.STUDY_PLANS, {
			userId: data.userId,
			planData: JSON.stringify(data.sessions),
			examDates: JSON.stringify(data.examDates),
			generatedAt: new Date(data.generatedAt).toISOString(),
			updatedAt: now,
			createdAt: now,
		});
	}
};

export const appwriteQuestionFlag: JobHandler = async (payload) => {
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
};

export const appwriteHandlers: Partial<Record<string, JobHandler>> = {
	"appwrite-sync": appwriteSync,
	"appwrite-progress-sync": appwriteProgressSync,
	"appwrite-attempt-sync": appwriteAttemptSync,
	"appwrite-competency-sync": appwriteCompetencySync,
	"appwrite-flashcard-sync": appwriteFlashcardSync,
	"appwrite-wrong-answer-sync": appwriteWrongAnswerSync,
	"appwrite-chat-sync": appwriteChatSync,
	"appwrite-rating-sync": appwriteRatingSync,
	"appwrite-study-plan-sync": appwriteStudyPlanSync,
	"appwrite-question-flag": appwriteQuestionFlag,
};
