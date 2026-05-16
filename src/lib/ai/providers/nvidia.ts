import { AIProvider, AIRequest, AIResponse } from "../types";

const NVIDIA_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

export function createNvidiaProvider(apiKey: string): AIProvider {
	const model = "meta/llama-3.3-70b-instruct";

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

		const response = await fetch(NVIDIA_URL, {
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
			throw new Error(`Nvidia API error: ${response.status} - ${error}`);
		}

		const data = await response.json();
		const content = data.choices?.[0]?.message?.content ?? "";

		return {
			content,
			provider: "nvidia",
			model,
			inputTokens: data.usage?.prompt_tokens,
			outputTokens: data.usage?.completion_tokens,
		};
	}

	return {
		name: "nvidia",
		model,
		generate,
		capabilities: { systemPrompt: true, images: false },
	};
}
