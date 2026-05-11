import { getAI } from "@/lib/ai";
import type { AIResponse } from "@/lib/ai/types";
import type { GenerationParams, GradingResult, Question, QuestionProcessor, UserAnswer, ValidationResult } from "../types";
import { PromptManager } from "../prompt-manager";

export class LongAnswerProcessor implements QuestionProcessor<"long-answer"> {
	readonly type = "long-answer" as const;
	private prompts = new PromptManager();

	async generate(params: GenerationParams): Promise<Question<"long-answer">[]> {
		const prompt = this.prompts.getPrompt("long-answer", params);
		const result = await getAI().generateWithSystem(prompt.system, prompt.user, { temperature: 0.8, maxTokens: 4096 });
		if ("available" in result && !result.available) throw new Error("AI generation failed");
		const parsed = JSON.parse(this.cleanResponse((result as AIResponse).content)) as Question<"long-answer">[];
		return Array.isArray(parsed) ? parsed : [parsed];
	}

	async generateHint(question: Question<"long-answer">): Promise<string> {
		return `Write ${question.body.minWords}-${question.body.maxWords} words covering: ${question.body.rubric.map((r) => r.name).join(", ")}.`;
	}

	async grade(question: Question<"long-answer">, answer: UserAnswer): Promise<GradingResult> {
		const student = answer.value as string;
		if (!student) return { correct: false, score: 0, maxScore: question.points, feedback: "No answer." };
		const words = student.split(/\s+/).length;
		if (words < question.body.minWords) {
			return { correct: false, score: 0, maxScore: question.points, feedback: `Answer too short (${words} words, minimum ${question.body.minWords}).` };
		}
		const prompt = this.prompts.getGradePrompt("long-answer");
		const ctx = `Question: ${question.questionText}\nRubric: ${JSON.stringify(question.body.rubric)}\nStudent: ${student}`;
		const result = await getAI().generateWithSystem(prompt.system, `${prompt.user}\n\n${ctx}`, { temperature: 0.2, maxTokens: 1024 });
		if ("available" in result && !result.available) return { correct: false, score: 0, maxScore: question.points, feedback: "Grading unavailable." };
		try {
			const g = JSON.parse(this.cleanResponse((result as AIResponse).content));
			return { correct: g.correct, score: g.score, maxScore: g.maxScore ?? question.points, feedback: g.feedback, breakdown: g.breakdown };
		} catch { return { correct: false, score: 0, maxScore: question.points, feedback: "Unable to grade." }; }
	}

	validate(question: Question<"long-answer">): ValidationResult {
		const errors = [];
		if (!question.body.rubric?.length) errors.push({ type: "schema" as const, field: "rubric", message: "Rubric required", severity: "error" as const });
		return { isValid: errors.length === 0, errors, warnings: [], score: errors.length > 0 ? 0 : 100 };
	}

	private cleanResponse(content: string): string { return content.replace(/```json/g, "").replace(/```/g, "").trim(); }
}
