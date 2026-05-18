import { offlineDB } from "@/lib/db/schema";
import { flashcardRepository } from "@/lib/flashcard-repository";
import { loadFromStorage } from "@/lib/utils/storage";

export interface SearchResultItem {
	id: string;
	type:
		| "question"
		| "flashcard"
		| "wrong-answer"
		| "note"
		| "study-set"
		| "exam";
	title: string;
	snippet: string;
	subject: string;
	topic?: string;
	createdAt: number;
	url?: string;
}

function textRelevant(text: string, query: string): boolean {
	const q = query.toLowerCase();
	return text.toLowerCase().includes(q);
}

function searchDexieQuestions(query: string): Promise<SearchResultItem[]> {
	return offlineDB.questions.toArray().then((rows) => {
		const results: SearchResultItem[] = [];
		for (const row of rows) {
			const questions: Array<{
				id: string;
				questionText: string;
				topic: string;
			}> = JSON.parse(row.questions || "[]");
			for (const q of questions) {
				if (textRelevant(q.questionText, query)) {
					results.push({
						id: `q-${q.id}`,
						type: "question",
						title: q.questionText.slice(0, 120),
						snippet: q.questionText,
						subject: row.subject,
						topic: q.topic || row.topic,
						createdAt: row.cachedAt,
					});
				}
			}
		}
		return results.slice(0, 10);
	});
}

function searchDexieWrongAnswers(query: string): Promise<SearchResultItem[]> {
	return offlineDB.wrongAnswers.toArray().then((rows) =>
		rows
			.filter(
				(r) =>
					textRelevant(r.questionText, query) ||
					textRelevant(r.correctAnswer, query) ||
					textRelevant(r.explanation || "", query),
			)
			.map(
				(r): SearchResultItem => ({
					id: `wa-${r.id}`,
					type: "wrong-answer",
					title: r.questionText.slice(0, 120),
					snippet: `${r.correctAnswer.slice(0, 100)}...`,
					subject: r.subject,
					topic: r.topic,
					createdAt: r.createdAt,
				}),
			)
			.slice(0, 10),
	);
}

async function searchDexieFlashcards(
	query: string,
): Promise<SearchResultItem[]> {
	const flashcards = await flashcardRepository.getAll();
	return flashcards
		.filter(
			(c) =>
				textRelevant(c.front, query) ||
				textRelevant(c.back, query) ||
				textRelevant(c.topic || "", query),
		)
		.map(
			(c): SearchResultItem => ({
				id: `fc-${c.id}`,
				type: "flashcard",
				title: c.front.slice(0, 120),
				snippet: c.back.slice(0, 100),
				subject: c.subject,
				topic: c.topic,
				createdAt: c.createdAt,
			}),
		)
		.slice(0, 10);
}

interface LocalNote {
	id: string;
	title: string;
	content: string;
	subject?: string;
	topic?: string;
	createdAt: string;
	tags?: string[];
}

function searchLocalStorageNotes(query: string): SearchResultItem[] {
	const notes = loadFromStorage<LocalNote[]>("lumni-notes", []);
	return notes
		.filter(
			(n) =>
				textRelevant(n.title, query) ||
				textRelevant(n.content, query) ||
				(n.tags || []).some((t) => textRelevant(t, query)),
		)
		.map(
			(n): SearchResultItem => ({
				id: `note-${n.id}`,
				type: "note",
				title: n.title,
				snippet: n.content.slice(0, 150),
				subject: n.subject || "",
				topic: n.topic,
				createdAt: new Date(n.createdAt).getTime(),
			}),
		)
		.slice(0, 10);
}

export async function searchAll(query: string): Promise<SearchResultItem[]> {
	if (!query.trim() || query.length < 2) return [];

	const results = await Promise.all([
		searchDexieQuestions(query),
		searchDexieWrongAnswers(query),
		searchDexieFlashcards(query),
		Promise.resolve(searchLocalStorageNotes(query)),
	]);

	return results.flat().slice(0, 25);
}

export async function searchByType(
	query: string,
	type: SearchResultItem["type"],
): Promise<SearchResultItem[]> {
	if (!query.trim() || query.length < 2) return [];

	switch (type) {
		case "question":
			return searchDexieQuestions(query);
		case "wrong-answer":
			return searchDexieWrongAnswers(query);
		case "flashcard":
			return searchDexieFlashcards(query);
		case "note":
			return Promise.resolve(searchLocalStorageNotes(query));
		default:
			return [];
	}
}
