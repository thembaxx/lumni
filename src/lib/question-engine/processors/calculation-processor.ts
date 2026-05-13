import { getAI } from "@/lib/ai";
import type { AIResponse } from "@/lib/ai/types";
import { ensureArray, parseAIResponse } from "../parse-response";
import { PromptManager } from "../prompt-manager";
import type {
	GenerationParams,
	GradingResult,
	Question,
	QuestionProcessor,
	UserAnswer,
	ValidationResult,
} from "../types";
import { validateCalculation } from "../validators";

export class CalculationProcessor implements QuestionProcessor<"calculation"> {
	readonly type = "calculation" as const;
	private prompts = new PromptManager();

	async generate(params: GenerationParams): Promise<Question<"calculation">[]> {
		const prompt = this.prompts.getPrompt("calculation", params);
		const result = await getAI().generateWithSystem(
			prompt.system,
			prompt.user,
			{ temperature: 0.6, maxTokens: 4096 },
		);
		const parsed = parseAIResponse<Question<"calculation">[]>(result, []);
		if (!parsed) throw new Error("AI generation failed");
		return ensureArray(parsed.data);
	}

	async generateHint(question: Question<"calculation">): Promise<string> {
		const steps = question.steps;
		if (steps && steps.length > 0) {
			return `Try following these steps:\n${steps.slice(0, 2).join("\n")}\n... then continue with the same approach.`;
		}
		return `Recall the formula: ${question.body.formula}. Make sure your answer includes the correct unit (${question.body.unit}).`;
	}

	async grade(
		question: Question<"calculation">,
		answer: UserAnswer,
	): Promise<GradingResult> {
		const studentAnswer = answer.value as { value: number; unit?: string };
		if (studentAnswer == null || studentAnswer.value == null) {
			return {
				correct: false,
				score: 0,
				maxScore: question.points,
				feedback: "No answer provided.",
			};
		}
		const correct = question.body.correctValue;
		const tolerance = question.body.tolerance;
		const numericDiff = Math.abs(studentAnswer.value - correct);
		const unitCorrect = studentAnswer.unit
			? studentAnswer.unit.toLowerCase().trim() ===
				question.body.unit.toLowerCase().trim()
			: true;
		const valueCorrect = numericDiff <= tolerance;
		if (valueCorrect && !unitCorrect) {
			return {
				correct: false,
				score: Math.round(question.points * 0.7),
				maxScore: question.points,
				feedback: `Your value is correct, but the unit should be "${question.body.unit}".`,
			};
		}
		return {
			correct: valueCorrect && unitCorrect,
			score: valueCorrect && unitCorrect ? question.points : 0,
			maxScore: question.points,
			feedback:
				valueCorrect && unitCorrect
					? `Correct! The answer is ${correct} ${question.body.unit}.`
					: `Incorrect. The correct answer is ${correct} ${question.body.unit} (tolerance: ±${tolerance}).`,
		};
	}

	validate(question: Question<"calculation">): ValidationResult {
		return validateCalculation(question);
	}
}
