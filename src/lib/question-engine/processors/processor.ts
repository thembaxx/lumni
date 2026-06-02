import { getAI } from "@/lib/ai";
import { ensureArray, parseAIResponse } from "@/lib/ai/parse-response";
import type { PromptManager, RagContext } from "../prompt-manager";
import { attachWebSources } from "../source-mapper";
import type {
	GenerationParams,
	GradingResult,
	Question,
	QuestionProcessor,
	QuestionType,
	UserAnswer,
	ValidationResult,
} from "../types";
import { validateQuestion } from "../validators";
import type { GradeFn, HintFn } from "./types";

export class TypedQuestionProcessor<T extends QuestionType>
	implements QuestionProcessor<T>
{
	constructor(
		public readonly type: T,
		private config: { generateTemperature: number },
		private gradeFn: GradeFn,
		private hintFn: HintFn,
		private prompts: PromptManager,
	) {}

	async generate(
		params: GenerationParams,
		ragContext?: RagContext,
	): Promise<Question<T>[]> {
		const prompt = this.prompts.getPrompt(this.type, params, ragContext);
		const result = await getAI().generateWithSystem(
			prompt.system,
			prompt.user,
			{ temperature: this.config.generateTemperature, maxTokens: 4096 },
		);
		const parsed = parseAIResponse<Question<T>[]>(result, []);
		if (!parsed) throw new Error(`AI generation failed for ${this.type}`);
		const questions = ensureArray(parsed.data) as Array<
			Question<T> & { sourceRefs?: unknown }
		>;
		for (const q of questions) {
			attachWebSources(q, ragContext);
		}
		return questions;
	}

	async generateHint(question: Question<T>): Promise<string> {
		return this.hintFn(question, this.prompts);
	}

	async grade(
		question: Question<T>,
		answer: UserAnswer,
	): Promise<GradingResult> {
		return this.gradeFn(question, answer, this.prompts);
	}

	validate(question: Question<T>): ValidationResult {
		return validateQuestion(question);
	}
}
