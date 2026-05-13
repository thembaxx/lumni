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
import { validateSourceBased } from "../validators";

export class SourceBasedProcessor implements QuestionProcessor<"source-based"> {
	readonly type = "source-based" as const;
	private prompts = new PromptManager();

	async generate(
		params: GenerationParams,
	): Promise<Question<"source-based">[]> {
		const prompt = this.prompts.getPrompt("source-based", params);
		const result = await getAI().generateWithSystem(
			prompt.system,
			prompt.user,
			{ temperature: 0.7, maxTokens: 4096 },
		);
		const parsed = parseAIResponse<Question<"source-based">[]>(result, []);
		if (!parsed) throw new Error("AI generation failed");
		return ensureArray(parsed.data);
	}

	async generateHint(question: Question<"source-based">): Promise<string> {
		return `Carefully read the source material. There are ${question.body.subQuestions.length} sub-questions to answer.`;
	}

	async grade(
		question: Question<"source-based">,
		answer: UserAnswer,
	): Promise<GradingResult> {
		const answers = answer.value as { subQuestionId: string; answer: string }[];
		if (!answers?.length)
			return {
				correct: false,
				score: 0,
				maxScore: question.points,
				feedback: "No answers submitted.",
			};
		const prompt = this.prompts.getGradePrompt("source-based");
		const ctx = `Source: ${question.body.source.content}\nSub-questions: ${JSON.stringify(question.body.subQuestions)}\nStudent answers: ${JSON.stringify(answers)}`;
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
			feedback: "Unable to grade source-based answer.",
		};
	}

	validate(question: Question<"source-based">): ValidationResult {
		return validateSourceBased(question);
	}
}
