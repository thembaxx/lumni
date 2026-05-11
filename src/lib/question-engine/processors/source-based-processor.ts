import { getAI } from "@/lib/ai";
import type { AIResponse } from "@/lib/ai/types";
import type { GenerationParams, GradingResult, Question, QuestionProcessor, UserAnswer, ValidationResult } from "../types";
import { PromptManager } from "../prompt-manager";

export class SourceBasedProcessor implements QuestionProcessor<"source-based"> {
	readonly type = "source-based" as const;
	private prompts = new PromptManager();

	async generate(params: GenerationParams): Promise<Question<"source-based">[]> {
		const prompt = this.prompts.getPrompt("source-based", params);
		const result = await getAI().generateWithSystem(prompt.system, prompt.user, { temperature: 0.7, maxTokens: 4096 });
		if ("available" in result && !result.available) throw new Error("AI generation failed");
		const parsed = JSON.parse(this.cleanResponse((result as AIResponse).content)) as Question<"source-based">[];
		return Array.isArray(parsed) ? parsed : [parsed];
	}

	async generateHint(question: Question<"source-based">): Promise<string> {
		return `Carefully read the source material. There are ${question.body.subQuestions.length} sub-questions to answer.`;
	}

	async grade(question: Question<"source-based">, answer: UserAnswer): Promise<GradingResult> {
		const answers = answer.value as { subQuestionId: string; answer: string }[];
		if (!answers?.length) return { correct: false, score: 0, maxScore: question.points, feedback: "No answers submitted." };
		const prompt = this.prompts.getGradePrompt("source-based");
		const ctx = `Source: ${question.body.source.content}\nSub-questions: ${JSON.stringify(question.body.subQuestions)}\nStudent answers: ${JSON.stringify(answers)}`;
		const result = await getAI().generateWithSystem(prompt.system, `${prompt.user}\n\n${ctx}`, { temperature: 0.2, maxTokens: 1024 });
		if ("available" in result && !result.available) return { correct: false, score: 0, maxScore: question.points, feedback: "Grading unavailable." };
		try {
			const g = JSON.parse(this.cleanResponse((result as AIResponse).content));
			return { correct: g.correct, score: g.score, maxScore: question.points, feedback: g.feedback };
		} catch { return { correct: false, score: 0, maxScore: question.points, feedback: "Unable to grade source-based answer." }; }
	}

	validate(question: Question<"source-based">): ValidationResult {
		const errors = [];
		if (!question.body.source) errors.push({ type: "schema" as const, field: "source", message: "Source required", severity: "error" as const });
		if (!question.body.subQuestions?.length) errors.push({ type: "schema" as const, field: "subQuestions", message: "Sub-questions required", severity: "error" as const });
		return { isValid: errors.length === 0, errors, warnings: [], score: errors.length > 0 ? 0 : 100 };
	}

	private cleanResponse(content: string): string { return content.replace(/```json/g, "").replace(/```/g, "").trim(); }
}
