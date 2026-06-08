import { describe, expect, it } from "bun:test";
import { InMemoryTable } from "@/lib/db";
import type { PastPaperQuestion } from "@/lib/exam-paper-ingestion/past-paper-question-types";
import { findTopK } from "../similarity";
import type { QuestionEmbedding } from "../types";

function makeEmbedding(
	id: string,
	subject: string,
	values: number[],
): QuestionEmbedding {
	return {
		id,
		questionId: id,
		vector: new Float32Array(values),
		subject,
		updatedAt: "2026-01-01T00:00:00Z",
	};
}

function makePoolQuestion(
	id: string,
	subject: string,
	questionText: string,
	answerText: string,
	marks = 5,
	year = 2024,
	paperNumber = 1,
): PastPaperQuestion {
	return {
		id,
		subject,
		year,
		paperNumber,
		questionId: id,
		partId: `${id}-p1`,
		questionText,
		answerText,
		marks,
		questionType: "short-answer",
		createdAt: "2026-01-01T00:00:00Z",
	};
}

describe("findTopK", () => {
	const embeddings = new InMemoryTable<QuestionEmbedding, string>();
	const questions = new InMemoryTable<PastPaperQuestion, string>();

	embeddings.seed([
		makeEmbedding("q1", "mathematics", [1, 0, 0]),
		makeEmbedding("q2", "mathematics", [0.9, 0.1, 0]),
		makeEmbedding("q3", "mathematics", [0.5, 0.5, 0]),
		makeEmbedding("q4", "physics", [1, 0, 0]),
	]);

	questions.seed([
		makePoolQuestion("q1", "mathematics", "What is 2+2?", "4"),
		makePoolQuestion("q2", "mathematics", "What is 3+1?", "4"),
		makePoolQuestion(
			"q3",
			"mathematics",
			"What is a prime number?",
			"A prime...",
		),
		makePoolQuestion("q4", "physics", "What is force?", "F=ma"),
	]);

	it("returns top K results ordered by similarity", async () => {
		const result = await findTopK(
			{
				subject: "mathematics",
				queryEmbedding: new Float32Array([1, 0, 0]),
				k: 2,
			},
			{ questionEmbeddings: embeddings, pastPaperQuestions: questions },
		);
		expect(result.length).toBe(2);
		expect(result[0].questionId).toBe("q1");
		expect(result[0].similarity).toBeCloseTo(1, 3);
		expect(result[1].questionId).toBe("q2");
		expect(result[1].similarity).toBeGreaterThan(0);
	});

	it("respects threshold", async () => {
		const result = await findTopK(
			{
				subject: "mathematics",
				queryEmbedding: new Float32Array([1, 0, 0]),
				k: 10,
				threshold: 0.995,
			},
			{ questionEmbeddings: embeddings, pastPaperQuestions: questions },
		);
		expect(result.length).toBe(1);
		expect(result[0].questionId).toBe("q1");
		expect(result[0].similarity).toBeCloseTo(1, 3);
	});

	it("returns empty for subject with no embeddings", async () => {
		const result = await findTopK(
			{ subject: "biology", queryEmbedding: new Float32Array([1, 0, 0]), k: 3 },
			{ questionEmbeddings: embeddings, pastPaperQuestions: questions },
		);
		expect(result).toEqual([]);
	});

	it("returns empty when no pool questions match embeddings", async () => {
		const orphanEmbeds = new InMemoryTable<QuestionEmbedding, string>();
		orphanEmbeds.seed([makeEmbedding("orphan", "mathematics", [1, 0, 0])]);
		const result = await findTopK(
			{
				subject: "mathematics",
				queryEmbedding: new Float32Array([1, 0, 0]),
				k: 3,
			},
			{ questionEmbeddings: orphanEmbeds, pastPaperQuestions: questions },
		);
		expect(result).toEqual([]);
	});
});
