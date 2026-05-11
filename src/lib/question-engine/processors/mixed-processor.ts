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

export class MixedProcessor implements QuestionProcessor<"mixed"> {
	readonly type = "mixed" as const;
	private prompts = new PromptManager();

	async generate(params: GenerationParams): Promise<Question<"mixed">[]> {
		const prompt = this.prompts.getPrompt("mixed", params);
		const result = await getAI().generateWithSystem(
			prompt.system,
			prompt.user,
			{ temperature: 0.8, maxTokens: 4096 },
		);
		if ("available" in result && !result.available)
			throw new Error("AI generation failed");
		const parsed = JSON.parse(
			this.cleanResponse((result as AIResponse).content),
		) as Question<"mixed">[];
		return Array.isArray(parsed) ? parsed : [parsed];
	}

	async generateHint(question: Question<"mixed">): Promise<string> {
		return `This question has ${question.body.parts.length} parts. Answer each part carefully.`;
	}

	async grade(
		question: Question<"mixed">,
		answer: UserAnswer,
	): Promise<GradingResult> {
		const parts = answer.value as { partId: string; answer: UserAnswer }[];
		if (!parts?.length)
			return {
				correct: false,
				score: 0,
				maxScore: question.points,
				feedback: "No answers.",
			};
		const prompt = this.prompts.getGradePrompt("mixed");
		const ctx = `Question parts: ${JSON.stringify(question.body.parts.map((p) => ({ id: p.id, text: p.questionText, type: p.type, points: p.points })))}\nStudent answers: ${JSON.stringify(parts)}`;
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
				feedback: "Grading unavailable.",
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
				feedback: "Unable to grade mixed answer.",
			};
		}
	}

	validate(question: Question<"mixed">): ValidationResult {
		const errors = [];
		if (!question.body.parts?.length)
			errors.push({
				type: "schema" as const,
				field: "parts",
				message: "Parts required",
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
