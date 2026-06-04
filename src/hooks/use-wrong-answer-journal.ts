"use client";

import { useCallback } from "react";
import { offlineDB } from "@/lib/db/schema";
import { logError } from "@/lib/shared/logger";

export type ErrorType =
	| "concept-misunderstanding"
	| "calculation-error"
	| "misread-question"
	| "careless-mistake"
	| "time-pressure"
	| "unknown";

export interface WrongAnswerEntry {
	id?: number;
	questionId: string;
	questionText: string;
	subject: string;
	topic: string;
	correctAnswer: string;
	userAnswer: string;
	explanation: string;
	createdAt: number;
	reviewed: boolean;
	errorType?: ErrorType;
}

export const ERROR_TYPE_LABELS: Record<ErrorType, string> = {
	"concept-misunderstanding": "Concept Misunderstanding",
	"calculation-error": "Calculation Error",
	"misread-question": "Misread Question",
	"careless-mistake": "Careless Mistake",
	"time-pressure": "Time Pressure",
	unknown: "Unknown",
};

export function useWrongAnswerJournal() {
	const addWrongAnswer = useCallback(
		async (
			entry: Omit<WrongAnswerEntry, "id" | "createdAt" | "reviewed"> & {
				errorType?: ErrorType;
			},
		) => {
			try {
				await offlineDB.table("wrongAnswers").add({
					...entry,
					createdAt: Date.now(),
					reviewed: false,
				});
			} catch (err) {
				logError("AddWrongAnswer", err);
			}
		},
		[],
	);

	const getWrongAnswers = useCallback(
		async (
			subject?: string,
			topic?: string,
			limit = 50,
		): Promise<WrongAnswerEntry[]> => {
			try {
				const table = offlineDB.table<WrongAnswerEntry>("wrongAnswers");
				let collection: ReturnType<typeof table.filter> = table
					.orderBy("createdAt")
					.reverse();
				if (subject) {
					collection = collection.filter(
						(e) => e.subject === subject,
					) as unknown as ReturnType<typeof table.filter>;
				}
				if (topic) {
					collection = collection.filter(
						(e) => e.topic === topic,
					) as unknown as ReturnType<typeof table.filter>;
				}
				return collection.limit(limit).toArray();
			} catch (err) {
				logError("GetWrongAnswers", err);
				return [];
			}
		},
		[],
	);

	const markReviewed = useCallback(async (id: number) => {
		try {
			await offlineDB.table("wrongAnswers").update(id, { reviewed: true });
		} catch (err) {
			logError("MarkReviewed", err);
		}
	}, []);

	const updateErrorType = useCallback(
		async (id: number, errorType: ErrorType) => {
			try {
				await offlineDB.table("wrongAnswers").update(id, { errorType });
			} catch (err) {
				logError("UpdateErrorType", err);
			}
		},
		[],
	);

	const clearReviewed = useCallback(async () => {
		try {
			const entries = await offlineDB
				.table<WrongAnswerEntry>("wrongAnswers")
				.filter((e) => e.reviewed)
				.toArray();
			await Promise.all(
				entries.flatMap((e) =>
					e.id ? [offlineDB.table("wrongAnswers").delete(e.id)] : [],
				),
			);
		} catch (err) {
			logError("ClearReviewed", err);
		}
	}, []);

	return {
		addWrongAnswer,
		getWrongAnswers,
		markReviewed,
		clearReviewed,
		updateErrorType,
	};
}
