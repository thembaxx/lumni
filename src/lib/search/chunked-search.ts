import { type DataAccess, dexieDataAccess } from "@/lib/db";

let _deps: { db: DataAccess } = { db: dexieDataAccess };
export function __setDepsForTesting(deps: { db: DataAccess }) {
	_deps = deps;
}

export interface ChunkedSearchResult {
	id: string;
	type: "question" | "note" | "flashcard" | "wrong-answer";
	title: string;
	snippet: string;
	source: string;
	score: number;
}

const MAX_RESULTS_PER_TABLE = 10;
const TOTAL_MAX = 50;
const TABLE_TIMEOUT = 500;

function scoreMatch(text: string, query: string): number {
	const lower = text.toLowerCase();
	const q = query.toLowerCase();
	if (lower === q) return 100;
	if (lower.startsWith(q)) return 80;
	if (lower.includes(q)) return 50;
	return 0;
}

async function queryWithTimeout<T>(fn: () => Promise<T[]>): Promise<T[]> {
	return Promise.race([
		fn(),
		new Promise<T[]>((_, reject) =>
			setTimeout(() => reject(new Error("timeout")), TABLE_TIMEOUT),
		),
	]);
}

export async function searchAllChunked(
	query: string,
): Promise<ChunkedSearchResult[]> {
	if (!query.trim()) return [];
	const q = query.trim();

	const queries: Promise<ChunkedSearchResult[]>[] = [
		queryWithTimeout(async () => {
			const all = await _deps.db.questions
				.limit(MAX_RESULTS_PER_TABLE)
				.toArray();
			const results: ChunkedSearchResult[] = [];
			for (const entry of all) {
				try {
					const questions = JSON.parse(entry.questions) as Array<{
						questionText?: string;
						id?: string;
					}>;
					for (const qst of questions) {
						const text = qst.questionText || "";
						const score = scoreMatch(text, q);
						if (score > 0) {
							results.push({
								id: qst.id || entry.id?.toString() || "",
								type: "question",
								title: text.slice(0, 80),
								snippet: text.slice(0, 150),
								source: entry.subject,
								score,
							});
						}
					}
				} catch {}
			}
			return results
				.sort((a, b) => b.score - a.score)
				.slice(0, MAX_RESULTS_PER_TABLE);
		}),

		queryWithTimeout(async () => {
			const all = await _deps.db.notes.limit(MAX_RESULTS_PER_TABLE).toArray();
			const results: ChunkedSearchResult[] = [];
			for (const n of all) {
				const score = scoreMatch(`${n.title} ${n.content}`, q);
				if (score > 0) {
					results.push({
						id: n.uuid,
						type: "note" as const,
						title: n.title,
						snippet: n.content.slice(0, 150),
						source: n.subject || "notes",
						score,
					});
				}
			}
			return results
				.sort((a, b) => b.score - a.score)
				.slice(0, MAX_RESULTS_PER_TABLE);
		}),

		queryWithTimeout(async () => {
			const all = await _deps.db.flashcards
				.limit(MAX_RESULTS_PER_TABLE)
				.toArray();
			const results: ChunkedSearchResult[] = [];
			for (const f of all) {
				const score = scoreMatch(`${f.front} ${f.back}`, q);
				if (score > 0) {
					results.push({
						id: f.id,
						type: "flashcard" as const,
						title: f.front.slice(0, 80),
						snippet: f.back.slice(0, 150),
						source: f.subject || "flashcards",
						score,
					});
				}
			}
			return results
				.sort((a, b) => b.score - a.score)
				.slice(0, MAX_RESULTS_PER_TABLE);
		}),

		queryWithTimeout(async () => {
			const all = await _deps.db.wrongAnswers
				.limit(MAX_RESULTS_PER_TABLE)
				.toArray();
			const results: ChunkedSearchResult[] = [];
			for (const w of all) {
				const score = scoreMatch(w.questionText, q);
				if (score > 0) {
					results.push({
						id: w.questionId,
						type: "wrong-answer" as const,
						title: w.questionText.slice(0, 80),
						snippet: w.questionText.slice(0, 150),
						source: w.subject || "wrong-answers",
						score,
					});
				}
			}
			return results
				.sort((a, b) => b.score - a.score)
				.slice(0, MAX_RESULTS_PER_TABLE);
		}),
	];

	const settled = await Promise.allSettled(queries);
	const allResults: ChunkedSearchResult[] = [];
	for (const r of settled) {
		if (r.status === "fulfilled") allResults.push(...r.value);
	}

	return allResults.sort((a, b) => b.score - a.score).slice(0, TOTAL_MAX);
}
