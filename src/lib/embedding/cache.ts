import type { EmbeddingDataAccess } from "@/lib/db";
import type { QuestionEmbedding } from "./types";

export async function storeEmbedding(
	embedding: QuestionEmbedding,
	table: EmbeddingDataAccess["questionEmbeddings"],
): Promise<void> {
	await table.put(embedding);
}

export async function getEmbedding(
	questionId: string,
	table: EmbeddingDataAccess["questionEmbeddings"],
): Promise<QuestionEmbedding | undefined> {
	return table.get(questionId);
}

export async function deleteEmbedding(
	questionId: string,
	table: EmbeddingDataAccess["questionEmbeddings"],
): Promise<void> {
	await table.delete(questionId);
}

export async function getEmbeddingsBySubject(
	subject: string,
	table: EmbeddingDataAccess["questionEmbeddings"],
): Promise<QuestionEmbedding[]> {
	return table.where("subject").equals(subject).toArray();
}
