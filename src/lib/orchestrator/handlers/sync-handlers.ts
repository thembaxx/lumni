import { Query } from "appwrite";
import {
	COLLECTIONS,
	createDocument,
	deleteDocument,
	listDocuments,
	updateDocument,
} from "@/lib/db/client";
import { enqueue } from "@/lib/orchestrator/job-queue";
import type { JobPayloadByType } from "@/lib/orchestrator/types";
import { syncQuestionsToAppwrite } from "@/lib/question-engine/persistence";
import type { JobHandler } from "./index";

export async function upsertDocument(
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
	const data = payload as JobPayloadByType["appwrite-sync"];
	await syncQuestionsToAppwrite(data.questions, data.subject, data.topic);
};

export const appwriteProgressSync: JobHandler = async (payload) => {
	const data = payload as JobPayloadByType["appwrite-progress-sync"];
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
	const data = payload as JobPayloadByType["appwrite-attempt-sync"];
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
	const data = payload as JobPayloadByType["appwrite-competency-sync"];
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
	const data = payload as JobPayloadByType["appwrite-flashcard-sync"];
	await upsertDocument(
		COLLECTIONS.FLASHCARDS,
		[Query.equal("flashcardId", data.id)],
		{
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
			updatedAt: new Date(data.updatedAt).toISOString(),
		},
	);
};

export const appwriteFlashcardPull: JobHandler = async (payload) => {
	const _data = payload as JobPayloadByType["appwrite-flashcard-pull"];
	try {
		const lastSyncStr =
			typeof window !== "undefined"
				? (localStorage.getItem("lumni_flashcard_last_sync") ?? "0")
				: "0";
		const lastSync = Number.parseInt(lastSyncStr, 10) || 0;

		const [remoteCards, { offlineDB: db }] = await Promise.all([
			listDocuments<Record<string, unknown>>(
				COLLECTIONS.FLASHCARDS,
				lastSync > 0
					? [Query.greaterThan("updatedAt", new Date(lastSync).toISOString())]
					: [],
			),
			import("@/lib/db/schema").then((m) => ({ offlineDB: m.offlineDB })),
		]);

		await Promise.all(
			remoteCards.map(async (remote) => {
				const remoteUpdatedAt = new Date(
					(remote.updatedAt as string) || 0,
				).getTime();
				const localCard = await db.flashcards.get(remote.flashcardId as string);

				if (localCard?.updatedAt && localCard.updatedAt > remoteUpdatedAt) {
					return;
				}

				await db.flashcards.put({
					id: remote.flashcardId as string,
					front: (remote.front as string) || "",
					back: (remote.back as string) || "",
					subject: (remote.subject as string) || "",
					topic: (remote.topic as string) || undefined,
					easeFactor: (remote.easeFactor as number) || 2.5,
					interval: (remote.interval as number) || 0,
					repetitions: (remote.repetitions as number) || 0,
					nextReview: new Date(
						(remote.nextReview as string) || Date.now(),
					).getTime(),
					lastReview: remote.lastReview
						? new Date(remote.lastReview as string).getTime()
						: null,
					createdAt: new Date(
						(remote.createdAt as string) || Date.now(),
					).getTime(),
					updatedAt: remoteUpdatedAt || Date.now(),
					algorithm: (remote.algorithm as "sm2" | "fsrs") || "fsrs",
					stability: (remote.stability as number) || 0,
					difficulty: (remote.difficulty as number) || 5,
					status:
						(remote.status as "active" | "buried" | "suspended") || "active",
					lapses: (remote.lapses as number) || 0,
					learningStep: (remote.learningStep as number) || -1,
					leeched: (remote.leeched as boolean) || false,
				});
			}),
		);

		if (typeof window !== "undefined") {
			localStorage.setItem("lumni_flashcard_last_sync", String(Date.now()));
		}
	} catch (e) {
		console.warn("[FlashcardPull] sync failed:", e);
	}
};

export const appwriteFlashcardDelete: JobHandler = async (payload) => {
	const data = payload as JobPayloadByType["appwrite-flashcard-delete"];
	try {
		const existing = await listDocuments<Record<string, unknown>>(
			COLLECTIONS.FLASHCARDS,
			[Query.equal("flashcardId", data.id)],
		);
		await Promise.all(
			existing.map((doc) =>
				deleteDocument(COLLECTIONS.FLASHCARDS, doc.$id as string),
			),
		);
	} catch (e) {
		console.warn("[FlashcardDelete] failed:", e);
	}
};

export const appwriteWrongAnswerSync: JobHandler = async (payload) => {
	const data = payload as JobPayloadByType["appwrite-wrong-answer-sync"];
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
	const data = payload as JobPayloadByType["appwrite-chat-sync"];
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
	const data = payload as JobPayloadByType["appwrite-rating-sync"];
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
			await enqueue("question-regen", {
				questionId: data.questionId,
				subject: data.subject,
			});
		}
	}
};

export const appwriteStudyPlanSync: JobHandler = async (payload) => {
	const data = payload as JobPayloadByType["appwrite-study-plan-sync"];

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
	const data = payload as JobPayloadByType["appwrite-question-flag"];
	await createDocument(COLLECTIONS.QUESTION_FLAGS, {
		questionId: data.questionId,
		userId: data.userId,
		reason: data.reason,
		details: data.details || "",
		status: "pending",
		createdAt: new Date(data.createdAt).toISOString(),
	});
};

export const appwriteBookmarkSync: JobHandler = async (payload) => {
	const data = payload as JobPayloadByType["appwrite-bookmark-sync"];
	const existing = await listDocuments<Record<string, unknown>>(
		COLLECTIONS.BOOKMARKS,
		[Query.equal("questionId", data.questionId)],
	);
	if (existing.length > 0) {
		await updateDocument(COLLECTIONS.BOOKMARKS, existing[0].$id as string, {
			note: data.note || "",
			savedAt: new Date(data.savedAt).toISOString(),
		});
	} else {
		await createDocument(COLLECTIONS.BOOKMARKS, {
			userId: data.userId || "",
			questionId: data.questionId,
			questionText: data.questionText,
			subject: data.subject,
			topic: data.topic || "",
			note: data.note || "",
			savedAt: new Date(data.savedAt).toISOString(),
		});
	}
};

export const appwriteExamDatesSync: JobHandler = async (payload) => {
	const data = payload as JobPayloadByType["appwrite-exam-dates-sync"];
	await upsertDocument(
		COLLECTIONS.EXAM_DATES,
		[Query.equal("cacheKey", data.cacheKey)],
		{
			cacheKey: data.cacheKey,
			session: data.session,
			year: data.year,
			slots: data.slots,
			source: data.source,
		},
	);
};

export const appwriteBookmarkDelete: JobHandler = async (payload) => {
	const data = payload as JobPayloadByType["appwrite-bookmark-delete"];
	const existing = await listDocuments<Record<string, unknown>>(
		COLLECTIONS.BOOKMARKS,
		[Query.equal("questionId", data.questionId)],
	);
	await Promise.all(
		existing.map((doc) =>
			deleteDocument(COLLECTIONS.BOOKMARKS, doc.$id as string),
		),
	);
};

export const appwriteHandlers: Partial<Record<string, JobHandler>> = {
	"appwrite-exam-dates-sync": appwriteExamDatesSync,
	"appwrite-sync": appwriteSync,
	"appwrite-progress-sync": appwriteProgressSync,
	"appwrite-attempt-sync": appwriteAttemptSync,
	"appwrite-competency-sync": appwriteCompetencySync,
	"appwrite-flashcard-sync": appwriteFlashcardSync,
	"appwrite-flashcard-pull": appwriteFlashcardPull,
	"appwrite-flashcard-delete": appwriteFlashcardDelete,
	"appwrite-wrong-answer-sync": appwriteWrongAnswerSync,
	"appwrite-bookmark-sync": appwriteBookmarkSync,
	"appwrite-bookmark-delete": appwriteBookmarkDelete,
	"appwrite-chat-sync": appwriteChatSync,
	"appwrite-rating-sync": appwriteRatingSync,
	"appwrite-study-plan-sync": appwriteStudyPlanSync,
	"appwrite-question-flag": appwriteQuestionFlag,
};
