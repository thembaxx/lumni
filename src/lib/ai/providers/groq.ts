import { AIProvider, AIRequest, AIResponse } from "../types";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export function createGroqProvider(apiKey: string): AIProvider {
	const model = "llama-3.1-8b-versatile";

	async function generate(request: AIRequest): Promise<AIResponse> {
		const messages = request.messages.map((m) => ({
			role: m.role === "model" ? "assistant" : m.role,
			content: m.content,
		}));

		if (request.systemPrompt) {
			messages.unshift({
				role: "system",
				content: request.systemPrompt,
			});
		}

		const response = await fetch(GROQ_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				model,
				messages,
				temperature: request.temperature ?? 0.7,
				max_tokens: request.maxTokens ?? 2048,
			}),
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`Groq API error: ${response.status} - ${error}`);
		}

		const data = await response.json();
		const content = data.choices?.[0]?.message?.content ?? "";

		return {
			content,
			provider: "groq",
			model,
			inputTokens: data.usage?.prompt_tokens,
			outputTokens: data.usage?.completion_tokens,
		};
	}

	return { name: "groq", model, generate };
}
