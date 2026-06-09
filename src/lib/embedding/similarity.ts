import type { EmbeddingDataAccess } from "@/lib/db";
import type { PastPaperQuestion } from "@/lib/exam-paper-ingestion/past-paper-question-types";
import type { QuestionEmbedding, ScoredPoolQuestion } from "./types";

export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
	if (a.length !== b.length) return 0;
	let dot = 0;
	let na = 0;
	let nb = 0;
	for (let i = 0; i < a.length; i++) {
		dot += a[i] * b[i];
		na += a[i] * a[i];
		nb += b[i] * b[i];
	}
	const mag = Math.sqrt(na) * Math.sqrt(nb);
	return mag === 0 ? 0 : dot / mag;
}

export async function findTopK(
	params: {
		subject: string;
		queryEmbedding: Float32Array;
		k?: number;
		threshold?: number;
	},
	deps: {
		questionEmbeddings: EmbeddingDataAccess["questionEmbeddings"];
		pastPaperQuestions: { toArray: () => Promise<PastPaperQuestion[]> };
	},
): Promise<ScoredPoolQuestion[]> {
	const k = params.k ?? 5;
	const threshold = params.threshold ?? 0;

	const all = await deps.questionEmbeddings
		.where("subject")
		.equals(params.subject)
		.toArray();

	if (all.length === 0) return [];

	const scored: { embedding: QuestionEmbedding; score: number }[] = [];
	for (const emb of all) {
		const score = cosineSimilarity(params.queryEmbedding, emb.vector);
		if (score >= threshold) {
			scored.push({ embedding: emb, score });
		}
	}

	scored.sort((a, b) => b.score - a.score);
	const top = scored.slice(0, k);

	const poolQuestions = await deps.pastPaperQuestions.toArray();
	const poolMap = new Map(poolQuestions.map((q) => [q.id, q]));

	const result: ScoredPoolQuestion[] = [];
	for (const s of top) {
		const pq = poolMap.get(s.embedding.questionId);
		if (!pq) continue;
		result.push({
			questionId: pq.id,
			questionText: pq.questionText,
			answerText: pq.answerText,
			marks: pq.marks,
			year: pq.year,
			paperNumber: pq.paperNumber,
			topic: pq.topic,
			similarity: s.score,
			type: pq.questionType,
		});
	}
	return result;
}
