"use client";

import Bookmark02Icon from "@hugeicons/core-free-icons/Bookmark02Icon";
import Bookmark03Icon from "@hugeicons/core-free-icons/Bookmark03Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { useVocabulary } from "@/hooks/use-vocabulary";

interface SaveVocabularyButtonProps {
	word: string;
	definition: string;
	language: string;
	sourceType: "lesson" | "story" | "manual";
	sourceId: string;
	userId: string;
}

export function SaveVocabularyButton({
	word,
	definition,
	language,
	sourceType,
	sourceId,
	userId,
}: SaveVocabularyButtonProps) {
	const { isWordSaved, saveWord, removeWord } = useVocabulary(userId);
	const saved = isWordSaved(word);
	const [pending, setPending] = useState(false);

	const handleToggle = useCallback(async () => {
		if (pending) return;
		setPending(true);
		try {
			if (saved) {
				await removeWord(word);
			} else {
				await saveWord(word, definition, language, sourceType, sourceId);
			}
		} finally {
			setPending(false);
		}
	}, [
		saved,
		pending,
		word,
		definition,
		language,
		sourceType,
		sourceId,
		saveWord,
		removeWord,
	]);

	return (
		<Button
			variant={saved ? "default" : "ghost"}
			size="sm"
			className="shrink-0 rounded-full"
			onClick={handleToggle}
			disabled={pending}
			aria-label={saved ? `Unsave ${word}` : `Save ${word}`}
		>
			<HugeiconsIcon
				icon={saved ? Bookmark03Icon : Bookmark02Icon}
				className="size-4"
			/>
			{saved ? "Saved" : "Save"}
		</Button>
	);
}
