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
import { validateLongAnswer } from "../validators";

export class LongAnswerProcessor implements QuestionProcessor<"long-answer"> {
	readonly type = "long-answer" as const;
	private prompts = new PromptManager();

	async generate(params: GenerationParams): Promise<Question<"long-answer">[]> {
		const prompt = this.prompts.getPrompt("long-answer", params);
		const result = await getAI().generateWithSystem(
			prompt.system,
			prompt.user,
			{ temperature: 0.8, maxTokens: 4096 },
		);
		const parsed = parseAIResponse<Question<"long-answer">[]>(result, []);
		if (!parsed) throw new Error("AI generation failed");
		return ensureArray(parsed.data);
	}

	async generateHint(question: Question<"long-answer">): Promise<string> {
		return `Write ${question.body.minWords}-${question.body.maxWords} words covering: ${question.body.rubric.map((r) => r.name).join(", ")}.`;
	}

	async grade(
		question: Question<"long-answer">,
		answer: UserAnswer,
	): Promise<GradingResult> {
		const student = answer.value as string;
		if (!student)
			return {
				correct: false,
				score: 0,
				maxScore: question.points,
				feedback: "No answer.",
			};
		const words = student.split(/\s+/).length;
		if (words < question.body.minWords) {
			return {
				correct: false,
				score: 0,
				maxScore: question.points,
				feedback: `Answer too short (${words} words, minimum ${question.body.minWords}).`,
			};
		}
		const prompt = this.prompts.getGradePrompt("long-answer");
		const ctx = `Question: ${question.questionText}\nRubric: ${JSON.stringify(question.body.rubric)}\nStudent: ${student}`;
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
			feedback: "Unable to grade.",
		};
	}

	validate(question: Question<"long-answer">): ValidationResult {
		return validateLongAnswer(question);
	}
}
