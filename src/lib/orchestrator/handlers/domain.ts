import { Query } from "appwrite";
import { databases } from "@/lib/appwrite";
import {
	APPWRITE_DATABASE_ID,
	COLLECTIONS,
	listDocuments,
	updateDocument,
} from "@/lib/db/client";
import { safePersist } from "@/lib/db/persist";
import { getProgress, saveProgress } from "@/lib/db/repositories/progress";
import { flashcardRepository } from "@/lib/flashcard-repository";
import { enqueue } from "@/lib/orchestrator/job-queue";
import { calculateNextReview } from "@/lib/orchestrator/sm2";
import type { JobPayloadByType } from "@/lib/orchestrator/types";
import { extractCorrectAnswer } from "@/lib/shared/question-utils";
import { visualEngine } from "@/lib/visual-engine/visual-engine";
import type { JobHandler } from "./index";

export const analyticsSync: JobHandler = async (payload) => {
	const { events } = payload as JobPayloadByType["analytics-sync"];
	await safePersist("analytics sync", async () => {
		const batchSize = 50;
		const batchPromises = [];
		for (let i = 0; i < events.length; i += batchSize) {
			const batch = events.slice(i, i + batchSize);
			batchPromises.push(
				Promise.allSettled(
					batch.map((event) =>
						databases
							.createDocument(APPWRITE_DATABASE_ID, "analytics", "unique()", {
								event: JSON.stringify(event),
								createdAt: new Date().toISOString(),
							})
							.catch((e: Error) => console.warn("Analytics write failed:", e)),
					),
				),
			);
		}
		await Promise.all(batchPromises);
	});
};

export const spacedRepUpdate: JobHandler = async (payload) => {
	const { question, result } = payload as JobPayloadByType["spaced-rep-update"];

	const quality = result.correct
		? result.score >= 0.9
			? 5
			: result.score >= 0.7
				? 4
				: 3
		: result.score >= 0.5
			? 2
			: result.score >= 0.25
				? 1
				: 0;

	const allCards = await flashcardRepository.getAll(question.subject);
	const existingCards = allCards.filter(
		(c) => c.front === question.questionText,
	);

	if (existingCards.length > 0) {
		const card = existingCards[0];
		const { easeFactor, interval, repetitions, nextReview } =
			calculateNextReview(
				quality,
				card.easeFactor,
				card.interval,
				card.repetitions,
			);

		await flashcardRepository.update(card.id, {
			easeFactor,
			interval,
			repetitions,
			nextReview,
			lastReview: Date.now(),
		});
	} else {
		const correctOptionText = extractCorrectAnswer(question);
		await flashcardRepository.create(
			question.questionText,
			correctOptionText || question.explanation,
			question.subject,
			question.topic,
		);
	}
};

export const progressUpdate: JobHandler = async (payload) => {
	const { subject, result } = payload as JobPayloadByType["progress-update"];

	const existing = await getProgress(subject);

	await Promise.all([
		saveProgress(subject, {
			questionsAttempted: (existing?.questionsAttempted ?? 0) + 1,
			correctCount: (existing?.correctCount ?? 0) + (result.correct ? 1 : 0),
			currentStreak: result.correct ? (existing?.currentStreak ?? 0) + 1 : 0,
			longestStreak: Math.max(
				existing?.longestStreak ?? 0,
				result.correct ? (existing?.currentStreak ?? 0) + 1 : 0,
			),
		}),
		enqueue("appwrite-progress-sync", {
			odSubjectId: subject,
			userId: "",
			questionsAttempted: (existing?.questionsAttempted ?? 0) + 1,
			correctCount: (existing?.correctCount ?? 0) + (result.correct ? 1 : 0),
			currentStreak: result.correct ? (existing?.currentStreak ?? 0) + 1 : 0,
			longestStreak: Math.max(
				existing?.longestStreak ?? 0,
				result.correct ? (existing?.currentStreak ?? 0) + 1 : 0,
			),
		}),
	]);
};

export const visualGeneration: JobHandler = async (payload) => {
	const { questionId, questionText, subject, topic } =
		payload as JobPayloadByType["visual-generation"];
	await visualEngine.resolve({
		questionId,
		questionText,
		subject,
		topic: topic ?? "",
	});
};

export const questionRegen: JobHandler = async (payload) => {
	const data = payload as JobPayloadByType["question-regen"];

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
};

export const domainHandlers: Partial<Record<string, JobHandler>> = {
	"analytics-sync": analyticsSync,
	"spaced-rep-update": spacedRepUpdate,
	"progress-update": progressUpdate,
	"visual-generation": visualGeneration,
	"question-regen": questionRegen,
};
