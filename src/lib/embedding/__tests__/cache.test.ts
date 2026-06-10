import { describe, expect, it } from "vitest";
import { InMemoryDataAccess } from "@/lib/db";
import {
	deleteEmbedding,
	getEmbedding,
	getEmbeddingsBySubject,
	storeEmbedding,
} from "../cache";

describe("embedding cache", () => {
	const da = new InMemoryDataAccess();

	const emb1 = {
		id: "q1",
		questionId: "q1",
		vector: new Float32Array([0.1, 0.2, 0.3]),
		subject: "mathematics",
		updatedAt: "2026-01-01T00:00:00Z",
	};

	const emb2 = {
		id: "q2",
		questionId: "q2",
		vector: new Float32Array([0.4, 0.5, 0.6]),
		subject: "mathematics",
		updatedAt: "2026-01-01T00:00:00Z",
	};

	const emb3 = {
		id: "q3",
		questionId: "q3",
		vector: new Float32Array([0.7, 0.8, 0.9]),
		subject: "physical-sciences",
		updatedAt: "2026-01-01T00:00:00Z",
	};

	it("stores and retrieves an embedding", async () => {
		await storeEmbedding(emb1, da.questionEmbeddings);
		const retrieved = await getEmbedding("q1", da.questionEmbeddings);
		expect(retrieved).toBeDefined();
		expect(retrieved?.questionId).toBe("q1");
		expect(retrieved?.subject).toBe("mathematics");
	});

	it("retrieves embeddings by subject", async () => {
		await storeEmbedding(emb2, da.questionEmbeddings);
		await storeEmbedding(emb3, da.questionEmbeddings);
		const math = await getEmbeddingsBySubject(
			"mathematics",
			da.questionEmbeddings,
		);
		expect(math.length).toBe(2);
		const phys = await getEmbeddingsBySubject(
			"physical-sciences",
			da.questionEmbeddings,
		);
		expect(phys.length).toBe(1);
	});

	it("deletes an embedding", async () => {
		await deleteEmbedding("q1", da.questionEmbeddings);
		const retrieved = await getEmbedding("q1", da.questionEmbeddings);
		expect(retrieved).toBeUndefined();
	});
});
