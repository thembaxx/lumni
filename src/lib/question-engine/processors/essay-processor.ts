import { getAI } from "@/lib/ai";
import type { AIResponse } from "@/lib/ai/types";
import { PromptManager } from "../prompt-manager";
import type {
	GenerationParams,
	GradingResult,
	Question,
	QuestionProcessor,
	UserAnswer,
	ValidationResult,
} from "../types";

export class EssayProcessor implements QuestionProcessor<"essay"> {
	readonly type = "essay" as const;
	private prompts = new PromptManager();

	async generate(params: GenerationParams): Promise<Question<"essay">[]> {
		const prompt = this.prompts.getPrompt("essay", params);
		const result = await getAI().generateWithSystem(
			prompt.system,
			prompt.user,
			{ temperature: 0.8, maxTokens: 4096 },
		);
		if ("available" in result && !result.available)
			throw new Error("AI generation failed");
		const parsed = JSON.parse(
			this.cleanResponse((result as AIResponse).content),
		) as Question<"essay">[];
		return Array.isArray(parsed) ? parsed : [parsed];
	}

	async generateHint(question: Question<"essay">): Promise<string> {
		return `Structure your essay around these criteria: ${question.body.rubric.map((r) => r.name).join(", ")}. Make sure to address each one.`;
	}

	async grade(
		question: Question<"essay">,
		answer: UserAnswer,
	): Promise<GradingResult> {
		const studentAnswer = answer.value as string;
		if (!studentAnswer || studentAnswer.trim().length < 20) {
			return {
				correct: false,
				score: 0,
				maxScore: question.points,
				feedback: "Essay is too short to grade.",
			};
		}
		const prompt = this.prompts.getGradePrompt("essay");
		const ctx = `Question: ${question.questionText}\nRubric: ${JSON.stringify(question.body.rubric)}\nModel answer: ${question.body.modelAnswer}\nStudent essay: ${studentAnswer}`;
		const result = await getAI().generateWithSystem(
			prompt.system,
			`${prompt.user}\n\n${ctx}`,
			{ temperature: 0.2, maxTokens: 1024 },
		);
		if ("available" in result && !result.available)
			return {
				correct: false,
				score: 0,
				maxScore: question.points,
				feedback: "Grading unavailable currently.",
			};
		try {
			const g = JSON.parse(this.cleanResponse((result as AIResponse).content));
			return {
				correct: g.correct,
				score: g.score,
				maxScore: g.maxScore ?? question.points,
				feedback: g.feedback,
				breakdown: g.breakdown,
			};
		} catch {
			return {
				correct: false,
				score: 0,
				maxScore: question.points,
				feedback: "Unable to grade essay.",
			};
		}
	}

	validate(question: Question<"essay">): ValidationResult {
		const errors = [];
		if (!question.body.rubric || question.body.rubric.length < 2)
			errors.push({
				type: "schema" as const,
				field: "rubric",
				message: "Need at least 2 rubric criteria",
				severity: "error" as const,
			});
		if (!question.body.modelAnswer || question.body.modelAnswer.length < 20)
			errors.push({
				type: "schema" as const,
				field: "modelAnswer",
				message: "Model answer too short",
				severity: "error" as const,
			});
		return {
			isValid: errors.length === 0,
			errors,
			warnings: [],
			score: errors.length > 0 ? 0 : 100,
		};
	}

	private cleanResponse(content: string): string {
		return content
			.replace(/```json/g, "")
			.replace(/```/g, "")
			.trim();
	}
}
