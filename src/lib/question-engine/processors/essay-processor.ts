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
import { validateEssay } from "../validators";

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
		const parsed = parseAIResponse<Question<"essay">[]>(result, []);
		if (!parsed) throw new Error("AI generation failed");
		return ensureArray(parsed.data);
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
		const parsed = parseAIResponse<{
			correct: boolean;
			score?: number;
			maxScore?: number;
			feedback?: string;
			breakdown?: GradingResult["breakdown"];
		}>(result, { correct: false });
		if (parsed) {
			return {
				correct: parsed.data.correct,
				score: parsed.data.score ?? 0,
				maxScore: parsed.data.maxScore ?? question.points,
				feedback: parsed.data.feedback ?? "",
				breakdown: parsed.data.breakdown,
			};
		}
		return {
			correct: false,
			score: 0,
			maxScore: question.points,
			feedback: "Unable to grade essay.",
		};
	}

	validate(question: Question<"essay">): ValidationResult {
		return validateEssay(question);
	}
}
