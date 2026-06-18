"use client";

import { useCallback, useEffect, useState } from "react";
import type { VocabularyEntry } from "@/lib/db/schema";
import { logError } from "@/lib/shared/logger";
import {
	getSavedWords,
	removeWord as removeWordService,
	saveWord as saveWordService,
} from "@/lib/vocabulary/service";

export function useVocabulary(userId: string) {
	const [words, setWords] = useState<VocabularyEntry[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const refresh = useCallback(async () => {
		try {
			const result = await getSavedWords(userId);
			setWords(result);
		} catch (err) {
			logError("useVocabulary.refresh", err);
		} finally {
			setIsLoading(false);
		}
	}, [userId]);

	// react-doctor/no-derived-state — async data fetch, cannot derive during render
	useEffect(() => {
		refresh();
	}, [refresh]);

	const saveWord = useCallback(
		async (
			word: string,
			definition: string,
			language: string,
			sourceType: "lesson" | "story" | "manual",
			sourceId: string,
			partOfSpeech?: string,
		) => {
			const saved = await saveWordService(
				userId,
				word,
				definition,
				language,
				sourceType,
				sourceId,
				partOfSpeech,
			);
			if (saved) {
				await refresh();
			}
			return saved;
		},
		[userId, refresh],
	);

	const removeWord = useCallback(
		async (word: string) => {
			const ok = await removeWordService(userId, word);
			if (ok) {
				await refresh();
			}
			return ok;
		},
		[userId, refresh],
	);

	const isWordSaved = useCallback(
		(word: string) => {
			return words.some((e) => e.word === word.toLowerCase());
		},
		[words],
	);

	return {
		words,
		saveWord,
		removeWord,
		isWordSaved,
		isLoading,
		refresh,
	};
}
