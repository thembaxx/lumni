import { getAI } from "@/lib/ai";
import type { AIResponse } from "@/lib/ai/types";
import type { GenerationParams, GradingResult, Question, QuestionProcessor, UserAnswer, ValidationResult } from "../types";
import { PromptManager } from "../prompt-manager";

export class ShortAnswerProcessor implements QuestionProcessor<"short-answer"> {
	readonly type = "short-answer" as const;
	private prompts = new PromptManager();

	async generate(params: GenerationParams): Promise<Question<"short-answer">[]> {
		const prompt = this.prompts.getPrompt("short-answer", params);
		const result = await getAI().generateWithSystem(prompt.system, prompt.user, { temperature: 0.7, maxTokens: 4096 });
		if ("available" in result && !result.available) throw new Error("AI generation failed");
		const parsed = JSON.parse(this.cleanResponse((result as AIResponse).content)) as Question<"short-answer">[];
		return Array.isArray(parsed) ? parsed : [parsed];
	}

	async generateHint(question: Question<"short-answer">): Promise<string> {
		const prompt = this.prompts.getHintPrompt("short-answer");
		const ctx = `Question: ${question.questionText}`;
		const result = await getAI().generateWithSystem(prompt.system, `${prompt.user}\n\n${ctx}`, { temperature: 0.5, maxTokens: 256 });
		if ("available" in result && !result.available) return question.hint;
		return this.cleanResponse((result as AIResponse).content);
	}

	async grade(question: Question<"short-answer">, answer: UserAnswer): Promise<GradingResult> {
		const studentAnswer = answer.value as string;
		if (!studentAnswer || studentAnswer.trim().length === 0) {
			return { correct: false, score: 0, maxScore: question.points, feedback: "No answer provided." };
		}

		const prompt = this.prompts.getGradePrompt("short-answer");
		const ctx = `Question: ${question.questionText}\nModel answer: ${question.body.modelAnswer}\nAcceptable answers: ${question.body.acceptableAnswers.join(" | ")}\nStudent answer: ${studentAnswer}`;
		const result = await getAI().generateWithSystem(prompt.system, `${prompt.user}\n\n${ctx}`, { temperature: 0.2, maxTokens: 512 });

		if ("available" in result && !result.available) {
			const exactMatch = question.body.acceptableAnswers.some(
				(a) => a.toLowerCase().trim() === studentAnswer.toLowerCase().trim(),
			);
			return { correct: exactMatch, score: exactMatch ? question.points : 0, maxScore: question.points, feedback: exactMatch ? "Correct!" : "Incorrect." };
		}

		try {
			const grade = JSON.parse(this.cleanResponse((result as AIResponse).content));
			return { correct: grade.correct, score: grade.correct ? question.points : 0, maxScore: question.points, feedback: grade.feedback ?? question.explanation };
		} catch {
			return { correct: false, score: 0, maxScore: question.points, feedback: question.explanation };
		}
	}

	validate(question: Question<"short-answer">): ValidationResult {
		const errors = [];
		if (!question.body.modelAnswer || question.body.modelAnswer.length < 3) {
			errors.push({ type: "schema" as const, field: "modelAnswer", message: "Model answer required", severity: "error" as const });
		}
		return { isValid: errors.length === 0, errors, warnings: [], score: errors.length > 0 ? 0 : 100 };
	}

	private cleanResponse(content: string): string { return content.replace(/```json/g, "").replace(/```/g, "").trim(); }
}
