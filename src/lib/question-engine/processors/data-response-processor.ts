import { getAI } from "@/lib/ai";
import type { AIResponse } from "@/lib/ai/types";
import type { GenerationParams, GradingResult, Question, QuestionProcessor, UserAnswer, ValidationResult } from "../types";
import { PromptManager } from "../prompt-manager";

export class DataResponseProcessor implements QuestionProcessor<"data-response"> {
	readonly type = "data-response" as const;
	private prompts = new PromptManager();

	async generate(params: GenerationParams): Promise<Question<"data-response">[]> {
		const prompt = this.prompts.getPrompt("data-response", params);
		const result = await getAI().generateWithSystem(prompt.system, prompt.user, { temperature: 0.7, maxTokens: 4096 });
		if ("available" in result && !result.available) throw new Error("AI generation failed");
		const parsed = JSON.parse(this.cleanResponse((result as AIResponse).content)) as Question<"data-response">[];
		return Array.isArray(parsed) ? parsed : [parsed];
	}

	async generateHint(question: Question<"data-response">): Promise<string> {
		return `Study the ${question.body.data.type} "${question.body.data.title}" carefully. There are ${question.body.questions.length} questions to answer based on this data.`;
	}

	async grade(question: Question<"data-response">, answer: UserAnswer): Promise<GradingResult> {
		const answers = answer.value as { questionId: string; answer: string }[];
		if (!answers?.length) return { correct: false, score: 0, maxScore: question.points, feedback: "No answers." };
		const prompt = this.prompts.getGradePrompt("data-response");
		const ctx = `Data: ${JSON.stringify(question.body.data)}\nQuestions: ${JSON.stringify(question.body.questions)}\nStudent answers: ${JSON.stringify(answers)}`;
		const result = await getAI().generateWithSystem(prompt.system, `${prompt.user}\n\n${ctx}`, { temperature: 0.2, maxTokens: 1024 });
		if ("available" in result && !result.available) return { correct: false, score: 0, maxScore: question.points, feedback: "Grading unavailable." };
		try {
			const g = JSON.parse(this.cleanResponse((result as AIResponse).content));
			return { correct: g.correct, score: g.score, maxScore: question.points, feedback: g.feedback };
		} catch { return { correct: false, score: 0, maxScore: question.points, feedback: "Unable to grade." }; }
	}

	validate(question: Question<"data-response">): ValidationResult {
		const errors = [];
		if (!question.body.data) errors.push({ type: "schema" as const, field: "data", message: "Data set required", severity: "error" as const });
		if (!question.body.questions?.length) errors.push({ type: "schema" as const, field: "questions", message: "Questions required", severity: "error" as const });
		return { isValid: errors.length === 0, errors, warnings: [], score: errors.length > 0 ? 0 : 100 };
	}

	private cleanResponse(content: string): string { return content.replace(/```json/g, "").replace(/```/g, "").trim(); }
}
