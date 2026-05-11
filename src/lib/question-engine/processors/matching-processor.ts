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

export class MatchingProcessor implements QuestionProcessor<"matching"> {
	readonly type = "matching" as const;
	private prompts = new PromptManager();

	async generate(params: GenerationParams): Promise<Question<"matching">[]> {
		const prompt = this.prompts.getPrompt("matching", params);
		const result = await getAI().generateWithSystem(
			prompt.system,
			prompt.user,
			{ temperature: 0.7, maxTokens: 4096 },
		);
		if ("available" in result && !result.available)
			throw new Error("AI generation failed");
		const parsed = JSON.parse(
			this.cleanResponse((result as AIResponse).content),
		) as Question<"matching">[];
		return Array.isArray(parsed) ? parsed : [parsed];
	}

	async generateHint(question: Question<"matching">): Promise<string> {
		return `Try matching these pairs correctly. You have ${question.body.pairs.length} items to match.`;
	}

	async grade(
		question: Question<"matching">,
		answer: UserAnswer,
	): Promise<GradingResult> {
		const userPairs = answer.value as { left: string; right: string }[];
		const correct = question.body.pairs;
		let correctCount = 0;
		for (const up of userPairs) {
			if (correct.some((cp) => cp.left === up.left && cp.right === up.right)) {
				correctCount++;
			}
		}
		const score = Math.round((correctCount / correct.length) * question.points);
		return {
			correct: correctCount === correct.length,
			score,
			maxScore: question.points,
			feedback:
				correctCount === correct.length
					? "All matches correct!"
					: `${correctCount}/${correct.length} matches correct.`,
		};
	}

	validate(question: Question<"matching">): ValidationResult {
		const errors = [];
		if (!question.body.pairs || question.body.pairs.length < 2) {
			errors.push({
				type: "schema" as const,
				field: "pairs",
				message: "Need at least 2 pairs",
				severity: "error" as const,
			});
		}
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
