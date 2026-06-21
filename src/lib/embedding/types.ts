export interface QuestionEmbedding {
	id: string;
	questionId: string;
	vector: Float32Array;
	subject: string;
	updatedAt: string;
}

export interface ScoredPoolQuestion {
	questionId: string;
	questionText: string;
	answerText: string;
	marks: number;
	year: number;
	paperNumber: number;
	topic?: string;
	similarity: number;
	type?: string;
	bloomLevel?: string;
	subtopicId?: string;
}

export interface FindTopKParams {
	subject: string;
	queryEmbedding: Float32Array;
	k?: number;
	threshold?: number;
}

export interface EmbeddingResult {
	values: number[];
}

export interface EmbeddingResponse {
	embedding: EmbeddingResult;
}
