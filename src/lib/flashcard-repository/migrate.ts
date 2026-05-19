import { flashcardRepository } from "./repository";
import type { FlashcardSM2 } from "./types";

interface LegacyFlashcard {
	id: string;
	front: string;
	back: string;
	hint?: string;
	tags?: string[];
	subject?: string;
	topic?: string;
	createdAt: number;
}

const LEGACY_KEY = "lumni-flashcards";

export async function migrateLegacyFlashcards(): Promise<number> {
	const raw = localStorage.getItem(LEGACY_KEY);
	if (!raw) return 0;

	let migrated = 0;
	const legacy: LegacyFlashcard[] = JSON.parse(raw);

	for (const card of legacy) {
		const existing = await flashcardRepository.getById(card.id);
		if (!existing) {
			await flashcardRepository.create(
				card.front,
				card.back,
				card.subject || "General",
				card.topic,
			);
			migrated++;
		}
	}

	localStorage.removeItem(LEGACY_KEY);
	return migrated;
}
