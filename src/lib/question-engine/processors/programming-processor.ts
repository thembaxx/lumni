import { getAI } from "@/lib/ai";
import type { AIResponse } from "@/lib/ai/types";
import type { GenerationParams, GradingResult, Question, QuestionProcessor, UserAnswer, ValidationResult } from "../types";
import { PromptManager } from "../prompt-manager";

export class ProgrammingProcessor implements QuestionProcessor<"programming"> {
	readonly type = "programming" as const;
	private prompts = new PromptManager();

	async generate(params: GenerationParams): Promise<Question<"programming">[]> {
		const prompt = this.prompts.getPrompt("programming", params);
		const result = await getAI().generateWithSystem(prompt.system, prompt.user, { temperature: 0.7, maxTokens: 4096 });
		if ("available" in result && !result.available) throw new Error("AI generation failed");
		const parsed = JSON.parse(this.cleanResponse((result as AIResponse).content)) as Question<"programming">[];
		return Array.isArray(parsed) ? parsed : [parsed];
	}

	async generateHint(question: Question<"programming">): Promise<string> {
		return `Think about the algorithm first. Consider edge cases. The function should handle ${question.body.testCases.length} test case(s).`;
	}

	async grade(question: Question<"programming">, answer: UserAnswer): Promise<GradingResult> {
		const code = answer.value as string;
		if (!code) return { correct: false, score: 0, maxScore: question.points, feedback: "No code submitted." };
		const prompt = this.prompts.getGradePrompt("programming");
		const ctx = `Problem: ${question.questionText}\nLanguage: ${question.body.language}\nTest cases: ${JSON.stringify(question.body.testCases)}\nStudent code:\n${code}`;
		const result = await getAI().generateWithSystem(prompt.system, `${prompt.user}\n\n${ctx}`, { temperature: 0.2, maxTokens: 1024 });
		if ("available" in result && !result.available) return { correct: false, score: 0, maxScore: question.points, feedback: "Code review unavailable." };
		try {
			const g = JSON.parse(this.cleanResponse((result as AIResponse).content));
			return { correct: g.correct, score: g.score, maxScore: question.points, feedback: g.feedback, breakdown: g.breakdown };
		} catch { return { correct: false, score: 0, maxScore: question.points, feedback: "Unable to evaluate code." }; }
	}

	validate(question: Question<"programming">): ValidationResult {
		const errors = [];
		if (!question.body.language) errors.push({ type: "schema" as const, field: "language", message: "Language required", severity: "error" as const });
		if (!question.body.testCases?.length) errors.push({ type: "schema" as const, field: "testCases", message: "Test cases required", severity: "error" as const });
		return { isValid: errors.length === 0, errors, warnings: [], score: errors.length > 0 ? 0 : 100 };
	}

	private cleanResponse(content: string): string { return content.replace(/```json/g, "").replace(/```/g, "").trim(); }
}
