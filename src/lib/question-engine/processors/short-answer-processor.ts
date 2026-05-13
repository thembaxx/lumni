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
import { validateShortAnswer } from "../validators";

export class ShortAnswerProcessor implements QuestionProcessor<"short-answer"> {
	readonly type = "short-answer" as const;
	private prompts = new PromptManager();

	async generate(
		params: GenerationParams,
	): Promise<Question<"short-answer">[]> {
		const prompt = this.prompts.getPrompt("short-answer", params);
		const result = await getAI().generateWithSystem(
			prompt.system,
			prompt.user,
			{ temperature: 0.7, maxTokens: 4096 },
		);
		const parsed = parseAIResponse<Question<"short-answer">[]>(result, []);
		if (!parsed) throw new Error("AI generation failed");
		return ensureArray(parsed.data);
	}

	async generateHint(question: Question<"short-answer">): Promise<string> {
		const prompt = this.prompts.getHintPrompt("short-answer");
		const ctx = `Question: ${question.questionText}`;
		const result = await getAI().generateWithSystem(
			prompt.system,
			`${prompt.user}\n\n${ctx}`,
			{ temperature: 0.5, maxTokens: 256 },
		);
		return getTextResponse(result) ?? question.hint;
	}

	async grade(
		question: Question<"short-answer">,
		answer: UserAnswer,
	): Promise<GradingResult> {
		const studentAnswer = answer.value as string;
		if (!studentAnswer || studentAnswer.trim().length === 0) {
			return {
				correct: false,
				score: 0,
				maxScore: question.points,
				feedback: "No answer provided.",
			};
		}

		const prompt = this.prompts.getGradePrompt("short-answer");
		const ctx = `Question: ${question.questionText}\nModel answer: ${question.body.modelAnswer}\nAcceptable answers: ${question.body.acceptableAnswers.join(" | ")}\nStudent answer: ${studentAnswer}`;
		const result = await getAI().generateWithSystem(
			prompt.system,
			`${prompt.user}\n\n${ctx}`,
			{ temperature: 0.2, maxTokens: 512 },
		);

		const parsed = parseAIResponse<{
			correct: boolean;
			score?: number;
			feedback?: string;
		}>(result, { correct: false });

		if (parsed) {
			return {
				correct: parsed.data.correct,
				score: parsed.data.correct ? question.points : 0,
				maxScore: question.points,
				feedback: parsed.data.feedback ?? question.explanation,
			};
		}

		const exactMatch = question.body.acceptableAnswers.some(
			(a) => a.toLowerCase().trim() === studentAnswer.toLowerCase().trim(),
		);
		return {
			correct: exactMatch,
			score: exactMatch ? question.points : 0,
			maxScore: question.points,
			feedback: exactMatch ? "Correct!" : "Incorrect.",
		};
	}

	validate(question: Question<"short-answer">): ValidationResult {
		return validateShortAnswer(question);
	}
}
