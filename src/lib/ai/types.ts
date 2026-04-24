export interface ChatMessage {
	role: "system" | "user" | "model" | "assistant";
	content: string;
}

export interface AIRequest {
	messages: ChatMessage[];
	systemPrompt?: string;
	temperature?: number;
	maxTokens?: number;
}

export interface AIResponse {
	content: string;
	provider: string;
	model: string;
	inputTokens?: number;
	outputTokens?: number;
}

export interface AIFailure {
	error: string;
	provider: string;
	available: boolean;
}

export type AIResult = AIResponse | AIFailure;

export interface AIProvider {
	name: string;
	model: string;
	generate(request: AIRequest): Promise<AIResponse>;
}

export type TaskType =
	| "lesson-summary"
	| "question-generation"
	| "concept-explanation"
	| "content-creation"
	| "quiz-generation";

export interface TaskRequest {
	type: TaskType;
	input: Record<string, unknown>;
}
