"use client";

import { useCallback } from "react";
import { offlineDB } from "@/lib/db/offline";

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
}

export function useWrongAnswerJournal() {
	const addWrongAnswer = useCallback(
		async (entry: Omit<WrongAnswerEntry, "id" | "createdAt" | "reviewed">) => {
			try {
				await offlineDB.table("wrongAnswers").add({
					...entry,
					createdAt: Date.now(),
					reviewed: false,
				});
			} catch {
				/* non-critical */
			}
		},
		[],
	);

	const getWrongAnswers = useCallback(
		async (subject?: string, limit = 50): Promise<WrongAnswerEntry[]> => {
			try {
				const table = offlineDB.table<WrongAnswerEntry>("wrongAnswers");
				let collection = table.orderBy("createdAt").reverse();
				if (subject) {
					collection = collection.filter(
						(e) => e.subject === subject,
					) as typeof collection;
				}
				return collection.limit(limit).toArray();
			} catch {
				return [];
			}
		},
		[],
	);

	const markReviewed = useCallback(async (id: number) => {
		try {
			await offlineDB.table("wrongAnswers").update(id, { reviewed: true });
		} catch {
			/* non-critical */
		}
	}, []);

	const clearReviewed = useCallback(async () => {
		try {
			const entries = await offlineDB
				.table<WrongAnswerEntry>("wrongAnswers")
				.filter((e) => e.reviewed)
				.toArray();
			for (const e of entries) {
				if (e.id) await offlineDB.table("wrongAnswers").delete(e.id);
			}
		} catch {
			/* non-critical */
		}
	}, []);

	return {
		addWrongAnswer,
		getWrongAnswers,
		markReviewed,
		clearReviewed,
	};
}
