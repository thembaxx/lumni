import { createGeminiProvider } from "./providers/gemini";
import { createGroqProvider } from "./providers/groq";
import {
	AIFailure,
	AIProvider,
	AIRequest,
	AIResponse,
	AIResult,
} from "./types";

export interface AIConfig {
	geminiApiKey?: string;
	groqApiKey?: string;
}

export interface GenerateOptions {
	temperature?: number;
	maxTokens?: number;
}

const FAILURE_RESPONSE: AIFailure = {
	error: "All AI providers failed",
	provider: "none",
	available: false,
};

function createProviderChain(config: AIConfig): AIProvider[] {
	const providers: AIProvider[] = [];

	if (config.geminiApiKey) {
		providers.push(createGeminiProvider(config.geminiApiKey));
	}
	if (config.groqApiKey) {
		providers.push(createGroqProvider(config.groqApiKey));
	}
	return providers;
}

export class AIClient {
	private providers: AIProvider[];
	private config: AIConfig;

	constructor(config: AIConfig) {
		this.config = config;
		this.providers = createProviderChain(config);
	}

	async generate(prompt: string, options?: GenerateOptions): Promise<AIResult> {
		if (this.providers.length === 0) {
			return { ...FAILURE_RESPONSE, error: "No AI providers configured" };
		}

		const request: AIRequest = {
			messages: [{ role: "user", content: prompt }],
			temperature: options?.temperature ?? 0.7,
			maxTokens: options?.maxTokens ?? 2048,
		};

		let lastError = "";

		for (const provider of this.providers) {
			try {
				const response = await provider.generate(request);
				return {
					...response,
					provider: provider.name,
				};
			} catch (error) {
				lastError = error instanceof Error ? error.message : String(error);
				console.error(`[AI] ${provider.name} failed:`, lastError);
				continue;
			}
		}

		return {
			...FAILURE_RESPONSE,
			error: `All providers failed. Last error: ${lastError}`,
		};
	}

	async generateWithSystem(
		systemPrompt: string,
		userPrompt: string,
		options?: GenerateOptions & { imageUrl?: string },
	): Promise<AIResult> {
		if (this.providers.length === 0) {
			return { ...FAILURE_RESPONSE, error: "No AI providers configured" };
		}

		const request: AIRequest = {
			messages: [
				{ role: "user", content: userPrompt, imageUrl: options?.imageUrl },
			],
			systemPrompt,
			temperature: options?.temperature ?? 0.7,
			maxTokens: options?.maxTokens ?? 2048,
		};

		let lastError = "";

		for (const provider of this.providers) {
			try {
				const response = await provider.generate(request);
				return {
					...response,
					provider: provider.name,
				};
			} catch (error) {
				lastError = error instanceof Error ? error.message : String(error);
				console.error(`[AI] ${provider.name} failed:`, lastError);
				continue;
			}
		}

		return {
			...FAILURE_RESPONSE,
			error: `All providers failed. Last error: ${lastError}`,
		};
	}

	async generateBatch(
		prompts: string[],
		options?: GenerateOptions,
	): Promise<AIResult[]> {
		const results = await Promise.allSettled(
			prompts.map((prompt) => this.generate(prompt, options)),
		);
		return results.map((r) =>
			r.status === "fulfilled"
				? r.value
				: {
						error: r.reason instanceof Error ? r.reason.message : "Batch generation failed",
						provider: "none",
						available: false,
					},
		);
	}

	isConfigured(): boolean {
		return this.providers.length > 0;
	}

	getProviders(): string[] {
		return this.providers.map((p) => p.name);
	}
}

let globalClient: AIClient | null = null;

export function initAI(config: AIConfig): AIClient {
	globalClient = new AIClient(config);
	return globalClient;
}

export function getAI(): AIClient {
	if (!globalClient) {
		throw new Error("AI client not initialized. Call initAI() first.");
	}
	return globalClient;
}

export async function generate(
	prompt: string,
	options?: GenerateOptions,
): Promise<AIResult> {
	return getAI().generate(prompt, options);
}

export async function generateWithSystem(
	systemPrompt: string,
	userPrompt: string,
	options?: GenerateOptions & { imageUrl?: string },
): Promise<AIResult> {
	return getAI().generateWithSystem(systemPrompt, userPrompt, options);
}

export async function generateBatch(
	prompts: string[],
	options?: GenerateOptions,
): Promise<AIResult[]> {
	return getAI().generateBatch(prompts, options);
}

export function isAIConfigured(): boolean {
	return globalClient?.isConfigured() ?? false;
}

export function getAIProviders(): string[] {
	return globalClient?.getProviders() ?? [];
}
