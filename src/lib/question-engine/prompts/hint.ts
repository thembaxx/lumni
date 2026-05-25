import type { PromptTemplate } from "../prompt-manager";

export function buildHintPrompt(questionType: string): PromptTemplate {
	return {
		system: `You are a helpful tutor. Generate a single, concise hint that guides the student toward the answer without giving it away.`,
		user: `Generate a hint for this ${questionType} question. The hint should help the student think in the right direction but not reveal the answer directly. Return ONLY the hint text, no JSON.`,
	};
}
