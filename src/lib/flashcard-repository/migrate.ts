import { flashcardEngine } from "@/lib/flashcard-engine";

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

	const results = await Promise.all(
		legacy.map(async (card) => {
			const existing = await flashcardEngine.getById(card.id);
			if (!existing) {
				await flashcardEngine.create(
					card.front,
					card.back,
					card.subject || "General",
					card.topic,
				);
				return 1;
			}
			return 0;
		}),
	);
	migrated = results.reduce<number>((sum, v) => sum + v, 0);

	localStorage.removeItem(LEGACY_KEY);
	return migrated;
}
