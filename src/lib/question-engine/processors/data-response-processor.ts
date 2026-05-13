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
import { validateDataResponse } from "../validators";

export class DataResponseProcessor
	implements QuestionProcessor<"data-response">
{
	readonly type = "data-response" as const;
	private prompts = new PromptManager();

	async generate(
		params: GenerationParams,
	): Promise<Question<"data-response">[]> {
		const prompt = this.prompts.getPrompt("data-response", params);
		const result = await getAI().generateWithSystem(
			prompt.system,
			prompt.user,
			{ temperature: 0.7, maxTokens: 4096 },
		);
		const parsed = parseAIResponse<Question<"data-response">[]>(result, []);
		if (!parsed) throw new Error("AI generation failed");
		return ensureArray(parsed.data);
	}

	async generateHint(question: Question<"data-response">): Promise<string> {
		return `Study the ${question.body.data.type} "${question.body.data.title}" carefully. There are ${question.body.questions.length} questions to answer based on this data.`;
	}

	async grade(
		question: Question<"data-response">,
		answer: UserAnswer,
	): Promise<GradingResult> {
		const answers = answer.value as { questionId: string; answer: string }[];
		if (!answers?.length)
			return {
				correct: false,
				score: 0,
				maxScore: question.points,
				feedback: "No answers.",
			};
		const prompt = this.prompts.getGradePrompt("data-response");
		const ctx = `Data: ${JSON.stringify(question.body.data)}\nQuestions: ${JSON.stringify(question.body.questions)}\nStudent answers: ${JSON.stringify(answers)}`;
		const result = await getAI().generateWithSystem(
			prompt.system,
			`${prompt.user}\n\n${ctx}`,
			{ temperature: 0.2, maxTokens: 1024 },
		);
		const parsed = parseAIResponse<{
			correct: boolean;
			score?: number;
			feedback?: string;
		}>(result, { correct: false });
		if (parsed) {
			return {
				correct: parsed.data.correct,
				score: parsed.data.score ?? 0,
				maxScore: question.points,
				feedback: parsed.data.feedback ?? "",
			};
		}
		return {
			correct: false,
			score: 0,
			maxScore: question.points,
			feedback: "Unable to grade.",
		};
	}

	validate(question: Question<"data-response">): ValidationResult {
		return validateDataResponse(question);
	}
}
