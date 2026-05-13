import { getAI } from "@/lib/ai";
import type { AIResponse } from "@/lib/ai/types";
import {
	ensureArray,
	getTextResponse,
	parseAIResponse,
} from "../parse-response";
import { PromptManager } from "../prompt-manager";
import type {
	GenerationParams,
	GradingResult,
	Question,
	QuestionProcessor,
	UserAnswer,
	ValidationResult,
} from "../types";
import { validateMCQ } from "../validators";

export class MCQProcessor implements QuestionProcessor<"multiple-choice"> {
	readonly type = "multiple-choice" as const;
	private prompts = new PromptManager();

	async generate(
		params: GenerationParams,
	): Promise<Question<"multiple-choice">[]> {
		const prompt = this.prompts.getPrompt("multiple-choice", params);
		const result = await getAI().generateWithSystem(
			prompt.system,
			prompt.user,
			{
				temperature: 0.8,
				maxTokens: 4096,
			},
		);

		const parsed = parseAIResponse<Question<"multiple-choice">[]>(result, []);
		if (!parsed) {
			throw new Error(
				`AI generation failed: ${"error" in result ? result.error : "unknown"}`,
			);
		}
		return ensureArray(parsed.data);
	}

	async generateHint(question: Question<"multiple-choice">): Promise<string> {
		const prompt = this.prompts.getHintPrompt("multiple-choice");
		const ctx = `Question: ${question.questionText}\nOptions: ${JSON.stringify(question.body.options)}`;
		const result = await getAI().generateWithSystem(
			prompt.system,
			`${prompt.user}\n\n${ctx}`,
			{
				temperature: 0.5,
				maxTokens: 256,
			},
		);
		return getTextResponse(result) ?? question.hint;
	}

	async grade(
		question: Question<"multiple-choice">,
		answer: UserAnswer,
	): Promise<GradingResult> {
		const selectedIds = answer.value as string[];
		const correctIds = question.body.options
			.filter((o) => o.isCorrect)
			.map((o) => o.id);

		const isCorrect =
			selectedIds.length === correctIds.length &&
			selectedIds.every((id) => correctIds.includes(id));

		return {
			correct: isCorrect,
			score: isCorrect ? question.points : 0,
			maxScore: question.points,
			feedback: isCorrect
				? question.explanation
				: `The correct answer was: ${correctIds.join(", ")}. ${question.explanation}`,
		};
	}

	validate(question: Question<"multiple-choice">): ValidationResult {
		return validateMCQ(question);
	}
}
