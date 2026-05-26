import { offlineDB } from "@/lib/db/schema";
import { flashcardEngine } from "@/lib/flashcard-engine";
import { loadFromStorage } from "@/lib/utils/storage";

export interface SearchResultItem {
	id: string;
	type:
		| "question"
		| "flashcard"
		| "wrong-answer"
		| "note"
		| "study-set"
		| "exam"
		| "web";
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
	return offlineDB.wrongAnswers.toArray().then((rows) => {
		const results: SearchResultItem[] = [];
		for (const r of rows) {
			if (
				textRelevant(r.questionText, query) ||
				textRelevant(r.correctAnswer, query) ||
				textRelevant(r.explanation || "", query)
			) {
				results.push({
					id: `wa-${r.id}`,
					type: "wrong-answer",
					title: r.questionText.slice(0, 120),
					snippet: `${r.correctAnswer.slice(0, 100)}...`,
					subject: r.subject,
					topic: r.topic,
					createdAt: r.createdAt,
				});
				if (results.length >= 10) break;
			}
		}
		return results;
	});
}

async function searchDexieFlashcards(
	query: string,
): Promise<SearchResultItem[]> {
	const flashcards = await flashcardEngine.getAll();
	const results: SearchResultItem[] = [];
	for (const c of flashcards) {
		if (
			textRelevant(c.front, query) ||
			textRelevant(c.back, query) ||
			textRelevant(c.topic || "", query)
		) {
			results.push({
				id: `fc-${c.id}`,
				type: "flashcard",
				title: c.front.slice(0, 120),
				snippet: c.back.slice(0, 100),
				subject: c.subject,
				topic: c.topic,
				createdAt: c.createdAt,
			});
			if (results.length >= 10) break;
		}
	}
	return results;
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
	const results: SearchResultItem[] = [];
	for (const n of notes) {
		if (
			textRelevant(n.title, query) ||
			textRelevant(n.content, query) ||
			(n.tags || []).some((t) => textRelevant(t, query))
		) {
			results.push({
				id: `note-${n.id}`,
				type: "note",
				title: n.title,
				snippet: n.content.slice(0, 150),
				subject: n.subject || "",
				topic: n.topic,
				createdAt: new Date(n.createdAt).getTime(),
			});
			if (results.length >= 10) break;
		}
	}
	return results;
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

export async function searchWeb(query: string): Promise<SearchResultItem[]> {
	try {
		const res = await fetch("/api/search/web", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ query, numResults: 6 }),
		});
		if (!res.ok) return [];
		const data = (await res.json()) as { results: SearchResultItem[] };
		return data.results ?? [];
	} catch {
		return [];
	}
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
