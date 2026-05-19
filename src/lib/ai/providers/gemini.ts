import type { AIProvider, AIRequest, AIResponse } from "../types";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";

interface GeminiPart {
	text?: string;
	inlineData?: {
		mimeType: string;
		data: string;
	};
}

export function createGeminiProvider(apiKey: string): AIProvider {
	const model = "gemini-2.0-flash-lite-001";

	async function generate(request: AIRequest): Promise<AIResponse> {
		const contents = await Promise.all(
			request.messages.map(async (m) => {
				const parts: GeminiPart[] = [{ text: m.content }];

				if (m.imageUrl) {
					try {
						const imageResponse = await fetch(m.imageUrl);
						if (imageResponse.ok) {
							const buffer = await imageResponse.arrayBuffer();
							const base64 = Buffer.from(buffer).toString("base64");
							const contentType =
								imageResponse.headers.get("content-type") || "image/jpeg";
							parts.push({
								inlineData: {
									mimeType: contentType,
									data: base64,
								},
							});
						}
					} catch (e) {
						console.error("Failed to fetch image for Gemini:", e);
					}
				}

				return {
					role: m.role === "model" ? "model" : "user",
					parts,
				};
			}),
		);

		const body: Record<string, unknown> = {
			contents,
			generationConfig: {
				temperature: request.temperature ?? 0.7,
				maxOutputTokens: request.maxTokens ?? 2048,
				topP: 0.95,
				topK: 40,
			},
		};

		if (request.systemPrompt) {
			body.system_instruction = {
				parts: [{ text: request.systemPrompt }],
			};
		}

		const response = await fetch(
			`${GEMINI_URL}/${model}:generateContent?key=${apiKey}`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			},
		);

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`Gemini API error: ${response.status} - ${error}`);
		}

		const data = await response.json();
		const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

		return {
			content,
			provider: "gemini",
			model,
		};
	}

	return {
		name: "gemini",
		model,
		generate,
		capabilities: { systemPrompt: true, images: true },
	};
}
