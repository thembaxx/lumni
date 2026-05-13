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
import { validateMixed } from "../validators";

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
		const parsed = parseAIResponse<Question<"mixed">[]>(result, []);
		if (!parsed) throw new Error("AI generation failed");
		return ensureArray(parsed.data);
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
			feedback: "Unable to grade mixed answer.",
		};
	}

	validate(question: Question<"mixed">): ValidationResult {
		return validateMixed(question);
	}
}
